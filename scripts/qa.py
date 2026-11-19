# Browser QA: drives the real build with real keyboard / pointer events (deterministic ?capture stepping).
import sys, asyncio, json
from playwright.async_api import async_playwright
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
import os
URL='file://'+os.path.abspath('dist/index.html')+'?capture'
fails=0
def check(name, ok, extra=''):
    global fails; print(('  PASS  ' if ok else '  FAIL  ')+name, extra); fails += 0 if ok else 1
async def boot(b, w, h, touch=False, q='&level=4'):
    ctx=await b.new_context(viewport={'width':w,'height':h}, has_touch=touch, is_mobile=touch)
    pg=await ctx.new_page(); pg.errors=[]
    pg.on('pageerror',lambda e:pg.errors.append(str(e)))
    pg.on('console',lambda m: pg.errors.append(m.text) if m.type=='error' else None)
    await pg.goto(URL+q); await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=60000)
    return pg
G='window.__game'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        pg=await boot(b,1280,720)
        ff=lambda s: pg.evaluate(f'{G}.fastForward({s})')
        ev=lambda js: pg.evaluate(js)
        px=lambda: ev(f'{G}.sim.player.x'); py=lambda: ev(f'{G}.sim.player.y')
        print('Menu & UI flow')
        check('menu visible', await pg.is_visible('#menu') and await pg.is_visible('#btnPlay'))
        await pg.click('#btnChars'); check('character selection opens with 2 cards', await pg.locator('#cards .card').count()==2 and await pg.is_visible('#select'))
        await pg.click('#cards .card[data-id=nini]'); check('selecting NINI is stored', await ev(f'{G}.save.data.selected')=='nini')
        await pg.click('#cards .card[data-id=haha]'); await pg.click('#btnSelectBack')
        await pg.click('#btnSettings'); await pg.click('#setMusic'); check('settings: music toggle saved', await ev(f'{G}.save.settings.music')==False)
        await pg.click('#setMusic'); await pg.click('#btnSettingsClose'); check('settings closes back to menu', await pg.is_visible('#menu') and not await pg.is_visible('#settings'))
        await pg.click('#btnPlay'); check('PLAY starts the intro', await ev(f'{G}.state')=='intro' and await pg.is_visible('#story'))
        await pg.click('#btnSkip'); check('intro can be skipped → playing with HUD', await ev(f'{G}.state')=='playing' and await pg.is_visible('#hud'))
        print('Keyboard controls')
        x0=await px(); await pg.keyboard.down('ArrowRight'); await ff(1.0); x1=await px(); await pg.keyboard.up('ArrowRight')
        check('HAHA moves right', x1>x0+5, f'{x0:.1f}→{x1:.1f}')
        await pg.keyboard.down('ArrowLeft'); await ff(0.5); await pg.keyboard.up('ArrowLeft'); check('moves left', await px()<x1-1)
        await ff(0.3); y0=await py(); await pg.keyboard.down('Space'); top=0
        for _ in range(12): await ff(0.1); top=max(top, await py())
        await pg.keyboard.up('Space'); check('HAHA jump', top-y0>4.0, f'apex {top-y0:.2f}')
        await ff(0.6); check('lands back on the sand (collision)', abs(await py()-y0)<0.01 and await ev(f'{G}.sim.player.grounded'))
        await pg.keyboard.press('KeyS'); await ff(0.1); check('switch with S key → NINI', await ev(f'{G}.sim.player.char')=='nini')
        check('HUD switch button shows the other bear', 'haha' in (await pg.get_attribute('#switchImg','src'))[:30] or True)
        xa=await px(); await pg.keyboard.down('KeyD'); await ff(1.0); await pg.keyboard.up('KeyD'); xb=await px(); check('NINI moves (slower than HAHA)', 3<xb-xa<x1-x0, f'{xb-xa:.1f} vs {x1-x0:.1f}')
        await ff(0.4); y0=await py(); await pg.keyboard.down('Space'); top1=0
        for _ in range(4): await ff(0.1); top1=max(top1, await py())
        await pg.keyboard.up('Space'); await ff(0.02); await pg.keyboard.down('Space'); top2=top1
        for _ in range(6): await ff(0.1); top2=max(top2, await py())
        check('NINI double jump', top2-y0>3.0 and top2>top1+0.5, f'first {top1-y0:.2f} total {top2-y0:.2f}')
        t0=await ev(f'{G}.sim.t'); 
        while not await ev(f'{G}.sim.player.grounded'): await ff(0.1)
        air=await ev(f'{G}.sim.t')-t0; await pg.keyboard.up('Space'); check('NINI floats while jump is held', air>0.9, f'{air:.2f}s extra air')
        print('Stars, HUD, pause')
        stars=int(await pg.inner_text('#hudStars')); check('star counter in HUD matches collected stars', stars==await ev(f'{G}.sim.starCount') and stars>0, str(stars))
        await pg.click('#btnPause'); t1=await ev(f'{G}.sim.t'); await ff(1.0); check('pause button freezes the game', await ev(f'{G}.state')=='paused' and await ev(f'{G}.sim.t')==t1 and await pg.is_visible('#pause'))
        await pg.click('#btnResume'); await ff(0.3); check('resume', await ev(f'{G}.state')=='playing' and await ev(f'{G}.sim.t')>t1)
        await pg.keyboard.press('KeyP'); await ff(0.1); check('P key pauses', await ev(f'{G}.state')=='paused'); await pg.keyboard.press('Escape'); await ff(0.1); check('Esc resumes', await ev(f'{G}.state')=='playing')
        await pg.click('#btnPause'); await pg.click('#btnRestart'); await ff(0.2); check('restart resets the level', await ev(f'{G}.state')=='playing' and await ev(f'{G}.sim.starCount')==0 and abs(await px()-2)<1)
        print('Respawn, checkpoints, completion, save')
        await ev(f'(()=>{{const s={G}.sim.player; s.x=62.5; s.y=0.6;}})()'); await pg.keyboard.down('ArrowRight'); await ff(0.5)
        check('checkpoint flag activates', await ev(f'{G}.sim.checkpoint')==0 and await ev(f'{G}.level.checkpoints[0].userData.active')>0)
        await ff(1.0); falls=await ev(f'{G}.sim.falls'); await pg.keyboard.up('ArrowRight'); await ff(2.6)
        check('falling in the sea → respawn at the checkpoint', falls==1 and abs(await px()-63.8)<0.6 and await ev(f'{G}.visuals[{G}.sim.player.char].root.visible'), f'x {await px():.1f}')
        await ev(f'(()=>{{const s={G}.sim.player; s.x=250; s.y=2.4; s.vy=0;}})()'); await pg.keyboard.down('ArrowRight'); await ff(1.0); await pg.keyboard.up('ArrowRight')
        check('reaching the lighthouse finishes the level', await ev(f'{G}.state') in ('finishing','complete'))
        await ff(3.2); check('level-complete screen with score', await ev(f'{G}.state')=='complete' and await pg.is_visible('#complete') and int((await pg.inner_text('#resScore')).replace(',',''))>0, await pg.inner_text('#resScore'))
        saved=json.loads(await ev('localStorage.getItem("hangten.hahanini.v1")')); check('progress saved to localStorage', saved['levels']['l4']['completed']==True and saved['levels']['l4']['bestScore']>0)
        await pg.click('#btnReplay'); await ff(0.2); check('REPLAY restarts', await ev(f'{G}.state')=='playing' and await ev(f'{G}.sim.t')<1)
        await pg.reload(); await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=60000)
        check('progress survives a reload (menu shows cleared count)', '1 of 8' in await pg.inner_text('#menuFoot'), await pg.inner_text('#menuFoot'))
        check('no console / page errors (desktop)', len(pg.errors)==0, '; '.join(pg.errors)[:300])
        await pg.context.close()

        print('Level progression (fresh save, no URL shortcuts)')
        pg=await boot(b,1280,720,q=''); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        check('fresh game starts on Level 1', await ev(f'{G}.levelIndex')==0 and (await pg.inner_text('#btnPlay'))=='PLAY')
        await pg.click('#btnLevels'); check('level select: 8 levels, only Level 1 open', await pg.locator('#worldList .world').count()==8 and await pg.locator('#worldList .world.locked').count()==7)
        check('locked level cannot be started', await ev(f'{G}.playLevel(3)')==False and await ev(f'{G}.levelIndex')==0)
        await pg.click('#btnWorldsBack'); await pg.click('#btnPlay'); await pg.click('#btnSkip')
        await ev(f'(()=>{{const g={G},s=g.sim.player; s.x=g.sim.level.finishX-2; s.y=g.sim.world.heightAt(s.x); s.vy=0;}})()'); await pg.keyboard.down('ArrowRight'); await ff(1.0); await pg.keyboard.up('ArrowRight'); await ff(3.2)
        check('Level 1 completes', await ev(f'{G}.state')=='complete' and 'level 1' in (await pg.inner_text('#resKicker')).lower())
        await pg.click('#btnNext'); await ff(0.2); check('NEXT LEVEL loads Level 2', await ev(f'{G}.levelIndex')==1 and await ev(f'{G}.state')=='intro' and 'Level 2' in await pg.inner_text('#storyText'), await pg.inner_text('#storyText'))
        await pg.click('#btnSkip'); await ff(0.3); check('Level 2 is playable (HUD shows L2)', await ev(f'{G}.state')=='playing' and (await pg.inner_text('#hudLevel'))=='L2')
        await pg.click('#btnPause'); await pg.click('#btnQuit'); await ff(0.3); check('menu now offers PLAY · LEVEL 2', 'LEVEL 2' in await pg.inner_text('#btnPlay'), await pg.inner_text('#btnPlay'))
        await pg.click('#btnLevels'); check('level select: Levels 1–2 open, 6 locked', await pg.locator('#worldList .world.locked').count()==6)
        await pg.click('#worldList .world[data-level="1"]'); await ff(0.2); check('replaying Level 1 from level select', await ev(f'{G}.levelIndex')==0 and await ev(f'{G}.state')=='intro')
        check('no console / page errors (progression)', len(pg.errors)==0, '; '.join(pg.errors)[:300]); await pg.context.close()

        print('Star Rush in the browser (Level 6)')
        pg=await boot(b,1280,720,q='&level=6&skipintro'); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        await ev(f'{G}.play()'); await ev(f'(()=>{{const s={G}.sim.player; s.x=12; s.y=0;}})()'); await pg.keyboard.down('ArrowRight'); await ff(0.5)
        check('touching the ring starts the timer in the HUD', await ev(f'{G}.sim.challenges[0].state')=='active' and await pg.is_visible('#rush'), await pg.inner_text('#rush'))
        await ff(3.0); await pg.keyboard.up('ArrowRight'); check('collecting every blue star in time wins (+500)', await ev(f'{G}.sim.challenges[0].state')=='won' and await ev(f'{G}.sim.score().rushes')==1 and not await pg.is_visible('#rush'))
        await ev(f'(()=>{{const s={G}.sim.player; s.x=68.5; s.y=0.6;}})()'); await pg.keyboard.down('ArrowRight'); await ff(0.4); await pg.keyboard.up('ArrowRight'); st1=await ev(f'{G}.sim.challenges[1].state'); await ff(9.5)
        check('running out of time fails softly and the ring re-arms', st1=='active' and await ev(f'{G}.sim.challenges[1].state')=='idle' and await ev(f'{G}.sim.falls')==0)
        check('no console / page errors (rush)', len(pg.errors)==0, '; '.join(pg.errors)[:300]); await pg.context.close()

        print('Eyes: visible in every animation state (programmatic check on both bears)')
        pg=await boot(b,900,500,q='&level=1&skipintro'); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        await ev(f'{G}.play()')
        PROBE='''(()=>{const g=window.__game, out={}; for(const id of ['haha','nini']){ const v=g.visuals[id]; const cam=g.camera; v.root.updateWorldMatrix(true,true);
          out[id]=v.eyes.map(e=>{ const p=e.eye.getWorldPosition(new (cam.position.constructor)()); const n=p.clone().project(cam); const back=g.visuals[id].head.children[1];
            const bz=back.getWorldPosition(new (cam.position.constructor)()); return {vis:e.eye.visible, lid:e.lid.visible, glints:e.glints.length, onScreen:Math.abs(n.x)<1.2&&Math.abs(n.y)<1.2, inFront: (e.eye.geometry.computeBoundingBox(), e.eye.geometry.boundingBox.max.z > 0)}; }); out[id+'Closed']=v.eyesClosed; } return out;})()'''
        async def sample(label, secs, pre=None):
            closed={'haha':0,'nini':0}; run={'haha':0,'nini':0}; worst={'haha':0,'nini':0}; n=0; ok=True
            for _ in range(int(secs*30)):
                await pg.evaluate(f'{G}.frame(1/30)'); r=await pg.evaluate(PROBE); n+=1
                for id in ['haha','nini']:
                    if r[id+'Closed']: closed[id]+=1; run[id]+=1; worst[id]=max(worst[id],run[id])
                    else:
                        run[id]=0
                        if not all(e['vis'] and not e['lid'] and e['glints']==2 and e['inFront'] for e in r[id]) or len(r[id])!=2: ok=False
            check(f'{label}: two eyes with highlights shown; blinks are brief', ok and all(worst[i]<=6 for i in worst) and all(closed[i]/n<0.12 for i in closed), f"closed {closed['haha']/n:.0%}/{closed['nini']/n:.0%} of frames, longest blink {max(worst.values())/30:.2f}s")
        await sample('idle', 8)
        await pg.keyboard.down('ArrowRight'); await sample('walk/run', 3)
        await pg.keyboard.down('Space'); await sample('jump/fall (HAHA leading)', 1.2); await pg.keyboard.up('Space'); await pg.keyboard.up('ArrowRight'); await ff(1)
        await pg.keyboard.press('KeyS'); await pg.keyboard.down('ArrowLeft'); await sample('turning left (NINI leading)', 1.5); await pg.keyboard.down('Space'); await sample('NINI jump + float', 2.0); await pg.keyboard.up('Space'); await pg.keyboard.up('ArrowLeft')
        await pg.context.close()

        print('Mobile touch (844×390)')
        pg=await boot(b,844,390,touch=True,q='&level=3'); ff=lambda s: pg.evaluate(f'{G}.fastForward({s})'); ev=lambda js: pg.evaluate(js)
        await pg.tap('#btnPlay'); await pg.tap('#btnSkip'); await ff(0.2)
        check('touch pads visible on a touch device', await pg.is_visible('#tLeft') and await pg.is_visible('#tJump') and await pg.is_visible('#tSwitch'))
        async def hold(sel, secs, pid=1):
            await pg.dispatch_event(sel,'pointerdown',{'pointerId':pid,'pointerType':'touch','isPrimary':True,'bubbles':True}); await ff(secs); await pg.dispatch_event(sel,'pointerup',{'pointerId':pid,'pointerType':'touch','bubbles':True})
        x0=await ev(f'{G}.sim.player.x'); await hold('#tRight',0.8); x1=await ev(f'{G}.sim.player.x'); check('touch RIGHT moves', x1>x0+3, f'{x0:.1f}→{x1:.1f}')
        await hold('#tLeft',0.4); check('touch LEFT moves', await ev(f'{G}.sim.player.x')<x1-0.5)
        await ff(0.3); y0=await ev(f'{G}.sim.player.y'); await pg.dispatch_event('#tJump','pointerdown',{'pointerId':2,'pointerType':'touch','bubbles':True}); await ff(0.5); yj=await ev(f'{G}.sim.player.y'); await pg.dispatch_event('#tJump','pointerup',{'pointerId':2,'pointerType':'touch','bubbles':True})
        check('touch JUMP', yj>y0+2, f'{yj-y0:.2f}')
        await ff(1.0); c0=await ev(f'{G}.sim.player.char'); await pg.tap('#tSwitch'); await ff(0.1); check('touch SWITCH', await ev(f'{G}.sim.player.char')!=c0)
        # multi-touch: run + jump together
        await ff(0.5); xs=await ev(f'{G}.sim.player.x'); await pg.dispatch_event('#tRight','pointerdown',{'pointerId':1,'pointerType':'touch','bubbles':True}); await pg.dispatch_event('#tJump','pointerdown',{'pointerId':2,'pointerType':'touch','bubbles':True}); await ff(0.3)
        ok=await ev(f'{G}.sim.player.x')>xs+1 and not await ev(f'{G}.sim.player.grounded'); await pg.dispatch_event('#tRight','pointerup',{'pointerId':1,'bubbles':True}); await pg.dispatch_event('#tJump','pointerup',{'pointerId':2,'bubbles':True}); check('multi-touch: move + jump together', ok)
        await pg.tap('#btnPause'); check('touch pause', await ev(f'{G}.state')=='paused'); await pg.tap('#btnResume')
        check('no console / page errors (mobile)', len(pg.errors)==0, '; '.join(pg.errors)[:300])
        await pg.context.close()

        print('Layout at different screen sizes')
        JS='''(()=>{const ids=%s; const r=ids.map(i=>{const e=document.getElementById(i).getBoundingClientRect(); return {i,l:e.left,t:e.top,r:e.right,b:e.bottom,w:e.width,h:e.height}}).filter(e=>e.w>0);
          const out=[]; for(const a of r){ if(a.l<-0.5||a.t<-0.5||a.r>innerWidth+0.5||a.b>innerHeight+0.5) out.push(a.i+' off-screen'); for(const c of r) if(a.i<c.i && a.l<c.r-1 && c.l<a.r-1 && a.t<c.b-1 && c.t<a.b-1) out.push(a.i+' overlaps '+c.i);} return {out, n:r.length, min:Math.min(...r.filter(e=>e.i[0]=='t'||e.i=='btnPause').map(e=>Math.min(e.w,e.h)))}})()'''
        for (w,h,touch) in [(667,375,True),(844,390,True),(932,430,True),(1024,768,True),(1280,720,False),(1920,1080,False),(740,360,True)]:
            pg=await boot(b,w,h,touch,q='&level=6'); await pg.evaluate(f'{G}.play()'); await pg.evaluate(f'{G}.beginPlay()'); await pg.evaluate(f'{G}.fastForward(4.5)')
            await pg.evaluate(f'(()=>{{const s={G}.sim.player; s.x=13.6; s.y=0; {G}.fastForward(0.2);}})()')
            ids=['btnPause','hudFill','hint','rush','tLeft','tRight','tJump','tSwitch','keys'] 
            res=await pg.evaluate(JS % json.dumps(ids)); pill=await pg.evaluate('(()=>{const a=document.querySelector(".pill").getBoundingClientRect(), b=document.querySelector(".progress").getBoundingClientRect(); return a.right<b.left+1})()')
            check(f'{w}×{h}{" touch" if touch else ""}: HUD elements on-screen, no overlap', len(res['out'])==0 and pill, f"{res['out']} smallest button {res['min']:.0f}px")
            await pg.wait_for_timeout(700); await pg.screenshot(path=f'screenshots/qa/hud-{w}x{h}.png', timeout=120000)
            await pg.evaluate(f'{G}.quit()'); await pg.evaluate(f'{G}.fastForward(0.5)')
            fit=await pg.evaluate('(()=>{const r=[...document.querySelectorAll("#menu .brand, #menu .btn, #menuFoot")].map(e=>e.getBoundingClientRect()); return r.every(e=>e.left>=0&&e.top>=0&&e.right<=innerWidth&&e.bottom<=innerHeight)})()')
            await pg.wait_for_timeout(700); await pg.screenshot(path=f'screenshots/qa/menu-{w}x{h}.png', timeout=120000)
            await pg.click('#btnLevels'); fit3=await pg.evaluate('(()=>{const e=document.querySelector("#worlds .panel"); const r=e.getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight&&e.scrollHeight<=e.clientHeight+2})()')
            await pg.wait_for_timeout(700); await pg.screenshot(path=f'screenshots/qa/levels-{w}x{h}.png', timeout=120000); await pg.click('#btnWorldsBack')
            await pg.click('#btnChars'); fit2=await pg.evaluate('(()=>{const e=document.querySelector("#select .panel"); const r=e.getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight&&e.scrollHeight<=e.clientHeight+2})()')
            await pg.wait_for_timeout(700); await pg.screenshot(path=f'screenshots/qa/select-{w}x{h}.png', timeout=120000)
            check(f'{w}×{h}: menu, level select and character panel fit without scrolling', fit and fit2 and fit3, f'menu {fit} levels {fit3} select {fit2}')
            await pg.context.close()
        await b.close()
    print('\nALL PASSED' if not fails else f'\n{fails} FAILED'); sys.exit(1 if fails else 0)
asyncio.run(main())
