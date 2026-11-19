# WINTER EDITION – browser QA on the real build (real keyboard / pointer events, deterministic frame stepping).
#   python3 scripts/qa_winter.py
import sys, asyncio, json, os, re, shutil
from playwright.async_api import async_playwright
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
DIST=os.path.abspath('dist/index.html'); URL='file://'+DIST+'?capture'
SHOTS='screenshots/qa'; os.makedirs(SHOTS, exist_ok=True)
G='window.__game'; fails=0
def check(name, ok, extra=''):
    global fails; print(('  PASS  ' if ok else '  FAIL  ')+name, extra); fails += 0 if ok else 1
async def boot(b, w, h, touch=False, q='', url=None):
    ctx=await b.new_context(viewport={'width':w,'height':h}, has_touch=touch, is_mobile=touch)
    pg=await ctx.new_page(); pg.errors=[]
    pg.on('pageerror',lambda e:pg.errors.append(str(e))); pg.on('console',lambda m: pg.errors.append(m.text) if m.type=='error' else None)
    await pg.goto((url or URL)+q); await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=120000)
    return pg
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)

        print('1. Four levels, progression, menu')
        pg=await boot(b,1280,720); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        check('title is the winter edition', 'Winter Wonderland' in await pg.title() and 'WINTER WONDERLAND ADVENTURE' in await pg.inner_text('#menu'))
        check('menu shows the official HANG TEN wordmark image', await ev('(()=>{const i=document.querySelector("#menu .wordmark"); return i.complete && i.naturalWidth>100})()'))
        await pg.click('#btnLevels')
        check('level select has exactly FOUR levels', await pg.locator('#worldList .world').count()==4, await pg.inner_text('#worldList'))
        names=await ev('[...document.querySelectorAll("#worldList .world strong")].map(e=>e.textContent)')
        check('level names', names==['Snowy Village','Frozen Forest','Iceberg Adventure','Aurora Castle'], str(names))
        diffs=await ev('[...document.querySelectorAll("#worldList .world .diff")].map(e=>e.textContent)')
        check('difficulty labels rise level by level', diffs==['Beginner','Beginner Plus','Early Intermediate','Intermediate'], str(diffs))
        check('fresh save: only Level 1 open', await pg.locator('#worldList .world.locked').count()==3)
        await pg.click('#btnWorldsBack')
        check('MY REWARD is hidden before Level 4 is cleared', await pg.is_hidden('#btnMyReward'))
        await pg.click('#btnPlay'); await pg.click('#btnSkip'); await ff(0.3)
        check('PLAY starts Level 1', await ev(f'{G}.levelIndex')==0 and await ev(f'{G}.state')=='playing')

        print('2. Controls (keyboard) and both characters')
        x0=await ev(f'{G}.sim.player.x'); await pg.keyboard.down('ArrowRight'); await ff(1.0); await pg.keyboard.up('ArrowRight'); x1=await ev(f'{G}.sim.player.x')
        check('move right', x1>x0+5, f'{x0:.1f}→{x1:.1f}')
        await pg.keyboard.down('ArrowLeft'); await ff(0.4); await pg.keyboard.up('ArrowLeft'); check('move left', await ev(f'{G}.sim.player.x')<x1)
        await ff(0.5); y0=await ev(f'{G}.sim.player.y'); await pg.keyboard.down('Space'); top=0
        for _ in range(10): await ff(0.1); top=max(top, await ev(f'{G}.sim.player.y'))
        await pg.keyboard.up('Space'); check('HAHA jump (high)', top-y0>4.0, f'{top-y0:.2f}')
        await ff(0.8); c0=await ev(f'{G}.sim.player.char'); await pg.keyboard.press('KeyS'); await ff(0.1); c1=await ev(f'{G}.sim.player.char')
        check('character switch (S key)', c0=='haha' and c1=='nini')
        y0=await ev(f'{G}.sim.player.y'); await pg.keyboard.down('Space'); await ff(0.35); await pg.keyboard.up('Space'); await ff(0.03); await pg.keyboard.down('Space'); top=0
        for _ in range(8): await ff(0.1); top=max(top, await ev(f'{G}.sim.player.y'))
        await pg.keyboard.up('Space'); check('NINI double jump', top-y0>3.0, f'{top-y0:.2f}')
        await ff(1.5)
        await pg.click('#btnPause'); t=await ev(f'{G}.sim.t'); await ff(0.5); check('pause', await ev(f'{G}.state')=='paused' and await ev(f'{G}.sim.t')==t)
        await pg.click('#btnResume'); check('resume', await ev(f'{G}.state')=='playing')
        print('3. Ice, footprints, respawn')
        await ev(f'{G}.playLevel(0)') ; await ev(f'{G}.beginPlay()')
        check('HUD shows footprint counter with the official footprint icon', (await pg.inner_text('#hudFpTotal'))=='/2' and await ev('(()=>{const i=document.querySelector(".pill .fp img"); return i.complete && i.naturalWidth>50})()'))
        await ev(f'(()=>{{const g={G},s=g.sim.player,f=g.levelDef.footprints[0]; s.x=f.x; s.y=f.y-1.2; s.grounded=false; s.ground=null; s.vy=0;}})()'); await ff(0.3)
        check('collecting a footprint updates HUD and score', (await pg.inner_text('#hudFp'))=='1' and await ev(f'{G}.sim.score().footprints')==1)
        await ev(f'(()=>{{const g={G},s=g.sim.player; s.x=64; s.y=0;}})()'); await pg.keyboard.down('ArrowRight'); await ff(0.5); await pg.keyboard.up('ArrowRight'); await ff(2.2)
        check('falling into the icy water respawns safely', await ev(f'{G}.sim.falls')>=1 and await ev(f'{G}.state')=='playing' and await ev(f'{G}.sim.player.y')>=-0.01)
        check('no console errors (desktop flow)', not pg.errors, '; '.join(pg.errors)[:200])

        print('4. Level complete screen (Level 1) – no reward yet')
        await ev(f'(()=>{{const g={G},s=g.sim.player; s.x=g.levelDef.finishX-2; s.y=g.sim.world.heightAt(s.x); s.vy=0;}})()'); await pg.keyboard.down('ArrowRight'); await ff(0.6); await pg.keyboard.up('ArrowRight'); await ff(3.5)
        check('Level 1 shows the normal level-complete screen', await ev(f'{G}.state')=='complete' and await pg.is_visible('#complete') and await pg.is_hidden('#reward'))
        check('level-complete screen carries the subtle HANG TEN signature', await ev('(()=>{const i=document.querySelector("#complete .signature"); const r=i.getBoundingClientRect(); return i.complete && i.naturalWidth>100 && r.height>10 && getComputedStyle(i).opacity<0.8})()'))
        await pg.wait_for_timeout(1500); await pg.screenshot(path=f'{SHOTS}/complete-L1.png')
        check('reward is NOT earned after Level 1', await ev(f'{G}.save.rewardEarned')==False)
        await pg.click('#btnNext'); await ff(0.2); check('NEXT LEVEL → Level 2', await ev(f'{G}.levelIndex')==1)
        await pg.context.close()

        print('5. Final reward only after Level 4 + coupon button')
        pg=await boot(b,1280,720,q='&level=4'); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        await pg.click('#btnPlay'); await pg.click('#btnSkip'); await ff(0.3)
        lv=await ev('(()=>{const L=window.__game.level; return {flags:L.flags.length, fps:L.footprints.length, castle:!!L.castle, emblem:!!(L.castle&&L.castle.userData.emblem), pengs:L.penguins.length, seals:L.seals.length}})()')
        check('Level 4: HANG TEN flags, footprint collectibles, castle with footprint emblem', lv['flags']>=4 and lv['fps']==3 and lv['emblem'], str(lv))
        check('Level 4 has penguins and seals', lv['pengs']>=2 and lv['seals']>=2)
        await ev(f'(()=>{{const g={G},s=g.sim.player; s.x=g.levelDef.finishX-2; s.y=g.sim.world.heightAt(s.x); s.vy=0;}})()'); await pg.keyboard.down('ArrowRight'); await ff(0.6); await pg.keyboard.up('ArrowRight')
        await ff(2.0); check('castle celebration before the reward (animals cheer, castle lit)', await ev(f'{G}.state')=='finishing' and await ev(f'{G}.level.celebrating'))
        await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SHOTS}/finale-castle.png')
        await ff(2.6)
        check('reward screen appears after Level 4', await pg.is_visible('#reward') and await ev(f'{G}.save.rewardEarned'))
        txt=await pg.inner_text('#reward')
        for s in ['CONGRATULATIONS!','WINTER ADVENTURE COMPLETE','恭喜你成功闖關！','感謝你幫助哈哈熊與妮妮熊找回冬日魔法星星，讓整座寒帶島嶼重新閃耀！','Your Reward:','HANG TEN NT$300','購物抵用券','立即領取優惠券','CLAIM YOUR REWARD']:
            check(f'reward copy: {s[:24]}', s in txt)
        btn=await ev('(()=>{const a=document.getElementById("btnClaim"); return {href:a.getAttribute("href"), dis:a.getAttribute("aria-disabled"), note:document.getElementById("claimNote").textContent}})()')
        CFG=re.search(r'^export const COUPON_CLAIM_URL = "([^"]*)"', open('src/reward/rewardConfig.js',encoding='utf-8').read(), re.M).group(1)
        if CFG.startswith('https://'):
            check(f'claim button opens the configured coupon link ({CFG})', btn['href']==CFG and btn['dis'] is None and btn['note']=='', str(btn))
            check('claim link opens in a new tab and is a real, clickable link', await ev('(()=>{const a=document.getElementById("btnClaim"); const r=a.getBoundingClientRect(); return a.target==="_blank" && a.rel.includes("noopener") && r.width>50 && getComputedStyle(a).pointerEvents!=="none"})()'))
        else:
            check('COUPON_CLAIM_URL = "待補": button disabled, no link, marked awaiting activation', btn['href'] is None and btn['dis']=='true' and 'Awaiting activation' in btn['note'], str(btn))
        check('no claim of an issued coupon', not re.search(r'(issued|redeemed|已發送|已領取|已兌換)', txt, re.I))
        await pg.wait_for_timeout(1200); await pg.screenshot(path=f'{SHOTS}/reward-1280x720.png')
        await pg.click('#btnRewardMenu'); await ff(0.3); check('MY REWARD appears in the menu once earned', await pg.is_visible('#btnMyReward'))
        await pg.click('#btnMyReward'); check('MY REWARD reopens the reward screen', await pg.is_visible('#reward'))
        await pg.reload(); await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=120000)
        check('earned reward survives a reload', await pg.is_visible('#btnMyReward'))
        check('no console errors (reward flow)', not pg.errors, '; '.join(pg.errors)[:200])
        await pg.context.close()
        # same build with a real https link pasted into the config → the button must open exactly that link
        tmp=os.path.abspath('dist/_qa_coupon.html'); html=open(DIST, encoding='utf-8').read()
        assert html.count(f'"{CFG}"')>=1; open(tmp,'w',encoding='utf-8').write(html.replace(f'"{CFG}"','"https://example.com/hangten-coupon-test"'))
        pg=await boot(b,1280,720,q='&level=4',url='file://'+tmp+'?capture'); ev=lambda js: pg.evaluate(js)
        await ev(f'{G}.save.earnReward(); {G}.showReward()')
        btn=await ev('(()=>{const a=document.getElementById("btnClaim"); return {href:a.getAttribute("href"), dis:a.getAttribute("aria-disabled"), target:a.target, note:document.getElementById("claimNote").textContent}})()')
        check('with a real URL in COUPON_CLAIM_URL the button links to exactly that URL', btn['href']=='https://example.com/hangten-coupon-test' and btn['dis'] is None and btn['target']=='_blank' and btn['note']=='', str(btn))
        await pg.context.close(); os.remove(tmp)

        print('6. Eyes visible in every animation state (both bears, per frame)')
        pg=await boot(b,900,500,q='&level=1&skipintro'); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        await ev(f'{G}.play()')
        PROBE='''(()=>{const g=window.__game, out={}; for(const id of ['haha','nini']){ const v=g.visuals[id];
          out[id]=v.eyes.map(e=>({vis:e.eye.visible, lid:e.lid.visible, glints:e.glints.length, inFront:(e.eye.geometry.computeBoundingBox(), e.eye.geometry.boundingBox.max.z>0)})); out[id+'Closed']=v.eyesClosed; out[id+'Outfit']=v.outfit; } return out;})()'''
        async def sample(label, secs):
            closed={'haha':0,'nini':0}; run={'haha':0,'nini':0}; worst={'haha':0,'nini':0}; n=0; ok=True
            for _ in range(int(secs*30)):
                await ev(f'{G}.frame(1/30)'); r=await ev(PROBE); n+=1
                for i in ['haha','nini']:
                    if r[i+'Closed']: closed[i]+=1; run[i]+=1; worst[i]=max(worst[i],run[i])
                    else:
                        run[i]=0
                        if len(r[i])!=2 or not all(e['vis'] and not e['lid'] and e['glints']==2 and e['inFront'] for e in r[i]): ok=False
            check(f'eyes – {label}', ok and max(worst.values())<=6 and max(closed.values())/n<0.12, f"blink share {max(closed.values())/n:.0%}, longest {max(worst.values())/30:.2f}s")
        r=await ev(PROBE); check('bears wear the winter outfit by default', r['hahaOutfit'] and r['niniOutfit'])
        await sample('idle', 6); await pg.keyboard.down('ArrowRight'); await sample('walk/run', 2.5); await pg.keyboard.down('Space'); await sample('jump/fall', 1.2); await pg.keyboard.up('Space'); await pg.keyboard.up('ArrowRight'); await ff(1)
        await pg.keyboard.press('KeyS'); await pg.keyboard.down('ArrowLeft'); await sample('turning (NINI leading)', 1.5); await pg.keyboard.up('ArrowLeft')
        await pg.click('#btnPause'); await pg.click('#btnPauseSettings'); await pg.click('#setOutfit'); await pg.click('#btnSettingsClose'); await pg.click('#btnResume'); await ff(0.2)
        r=await ev(PROBE); check('winter outfit can be switched off (accessory is optional)', not r['hahaOutfit'] and not r['niniOutfit'] and len(r['haha'])==2)
        await sample('idle without outfit', 2)
        check('no console errors (eyes)', not pg.errors, '; '.join(pg.errors)[:200]); await pg.context.close()

        print('7. Mobile landscape: full screen, no bands, no scrolling, touch controls')
        JS='''(()=>{const c=document.getElementById('game').getBoundingClientRect(), s=document.getElementById('stage').getBoundingClientRect(), d=document.scrollingElement;
          return {c:[c.left,c.top,c.width,c.height], s:[s.left,s.top,s.width,s.height], vw:innerWidth, vh:innerHeight, sh:d.scrollHeight, sw:d.scrollWidth, cw:document.getElementById('game').width, ch:document.getElementById('game').height}})()'''
        for (w,h) in [(667,375),(740,360),(844,390),(915,412),(932,430),(1024,768)]:
            pg=await boot(b,w,h,touch=True,q='&level=2'); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
            await pg.tap('#btnPlay'); await pg.tap('#btnSkip'); await ff(0.5)
            m=await ev(JS)
            full = abs(m['c'][0])<1 and abs(m['c'][1])<1 and abs(m['c'][2]-w)<1 and abs(m['c'][3]-h)<1
            noscroll = m['sh']<=h and m['sw']<=w
            await pg.mouse.wheel(0,600); await pg.wait_for_timeout(100); sy=await ev('scrollY')
            check(f'{w}×{h}: canvas fills the whole screen, no bands, no scrolling', full and noscroll and sy==0, str(m))
            ids=['btnPause','hudFill','tLeft','tRight','tJump','tSwitch']
            res=await ev('''(()=>{const r=%s.map(i=>{const e=document.getElementById(i).getBoundingClientRect(); return {i,l:e.left,t:e.top,r:e.right,b:e.bottom}}); const bad=[];
              for(const a of r){ if(a.l<0||a.t<0||a.r>innerWidth||a.b>innerHeight) bad.push(a.i+' off'); for(const c of r) if(a.i<c.i&&a.l<c.r-1&&c.l<a.r-1&&a.t<c.b-1&&c.t<a.b-1) bad.push(a.i+'/'+c.i);} 
              const pill=document.querySelector('.pill').getBoundingClientRect(), prog=document.querySelector('.progress').getBoundingClientRect(); if(pill.right>prog.left+1) bad.push('pill/progress'); return bad})()''' % json.dumps(ids))
            check(f'{w}×{h}: HUD + touch controls on screen, no overlap', not res, str(res))
            if (w,h)==(844,390):
                async def hold(sel, secs, pid=1):
                    await pg.dispatch_event(sel,'pointerdown',{'pointerId':pid,'pointerType':'touch','bubbles':True}); await ff(secs); await pg.dispatch_event(sel,'pointerup',{'pointerId':pid,'pointerType':'touch','bubbles':True})
                x0=await ev(f'{G}.sim.player.x'); await hold('#tRight',0.8); x1=await ev(f'{G}.sim.player.x'); check('touch ▶ moves', x1>x0+3)
                await hold('#tLeft',0.3); check('touch ◀ moves', await ev(f'{G}.sim.player.x')<x1)
                await ff(0.8); y0=await ev(f'{G}.sim.player.y'); await pg.dispatch_event('#tJump','pointerdown',{'pointerId':2,'pointerType':'touch','bubbles':True}); await ff(0.4); y1=await ev(f'{G}.sim.player.y'); await pg.dispatch_event('#tJump','pointerup',{'pointerId':2,'pointerType':'touch','bubbles':True})
                check('touch JUMP', y1>y0+1.5); await ff(1.2)
                c0=await ev(f'{G}.sim.player.char'); await pg.tap('#tSwitch'); await ff(0.1); check('touch ⇄ switch', await ev(f'{G}.sim.player.char')!=c0)
                await pg.tap('#btnPause'); check('touch pause', await ev(f'{G}.state')=='paused'); await pg.tap('#btnResume')
                await ev(f'(()=>{{const g={G},s=g.sim.player; s.x=16; s.y=0;}})()'); await ff(1.0)
                await pg.wait_for_timeout(600); await pg.screenshot(path=f'{SHOTS}/phone-844x390-L2.png')
                # reward screen fits a phone without scrolling
                await ev(f'{G}.save.earnReward(); {G}.showReward()'); await pg.wait_for_timeout(900)
                fit=await ev('(()=>{const r=document.querySelector(".reward").getBoundingClientRect(); const b=document.getElementById("btnClaim").getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight && b.bottom<=innerHeight && document.scrollingElement.scrollHeight<=innerHeight})()')
                check('844×390: reward screen fits on screen (button visible, no scrolling)', fit); await pg.screenshot(path=f'{SHOTS}/reward-phone-844x390.png')
            px=await pg.screenshot(path=f'{SHOTS}/edge-{w}x{h}.png')
            check(f'{w}×{h}: no console errors', not pg.errors, '; '.join(pg.errors)[:200]); await pg.context.close()
        # top/bottom rows of the screen are game pixels (not white bands)
        from PIL import Image
        for f in ['edge-844x390.png','edge-667x375.png']:
            im=Image.open(f'{SHOTS}/{f}').convert('RGB'); W,H=im.size
            rows=[[im.getpixel((x,y)) for x in range(0,W,16)] for y in (0,1,H-2,H-1)]
            white=sum(1 for r in rows for c in r if min(c)>250)/sum(len(r) for r in rows)
            check(f'{f}: first/last pixel rows are the 3D scene, not white bands', white<0.05, f'{white:.0%} pure-white')
        print('8. Desktop presentation')
        pg=await boot(b,2560,900); ev=lambda js: pg.evaluate(js); m=await ev(JS)
        check('ultra-wide desktop: stage centred at a landscape ratio, dark side bands', abs(m['s'][2]/m['s'][3]-2.4)<0.02 and abs(m['s'][0]-(2560-m['s'][2])/2)<1, str(m['s']))
        await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SHOTS}/desktop-ultrawide.png')
        band=Image.open(f'{SHOTS}/desktop-ultrawide.png').convert('RGB').getpixel((5,450)); check('side bands use the dark winter colour (not white)', max(band)<80 and band[2]>band[0], str(band))
        await pg.context.close()
        pg=await boot(b,1280,720); m=await pg.evaluate(JS); check('16:9 desktop: full window', m['s']==[0,0,1280,720]); await pg.context.close()
        await b.close()
    print('\nALL PASSED' if not fails else f'\n{fails} FAILED'); sys.exit(1 if fails else 0)
asyncio.run(main())
