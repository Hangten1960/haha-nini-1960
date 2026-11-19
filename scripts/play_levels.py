# Browser QA: the autoplay bot plays each level of the real build start to finish; saves a few screenshots per level.
#   python3 scripts/play_levels.py out_dir [levels e.g. 1,2,3,4]
import sys, asyncio, os, json
from playwright.async_api import async_playwright
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
levels=[int(x) for x in (sys.argv[2] if len(sys.argv)>2 else '1,2,3,4,5,6,7,8').split(',')]
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    bad=0
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        for n in levels:
            pg=await b.new_page(viewport={'width':1280,'height':720}); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
            await pg.goto('file://'+os.path.abspath('dist/index.html')+f'?capture&autoplay&skipintro&level={n}')
            await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=60000)
            await pg.evaluate('window.__game.play()')
            fin=await pg.evaluate('window.__game.sim.level.finishX'); shots=[0.22,0.5,0.78]; k=0
            for _ in range(4000):
                st=await pg.evaluate('[window.__game.state, window.__game.sim.player.x, window.__game.sim.t]')
                if st[0]=='complete' or st[2]>400: break
                if k<len(shots) and st[1]>=fin*shots[k]:
                    await pg.wait_for_timeout(400); await pg.screenshot(path=f'{out}/L{n}-{k+1}.png',timeout=120000); k+=1
                await pg.evaluate('window.__game.fastForward(0.25)')
            sc=json.loads(await pg.evaluate('JSON.stringify(window.__game.sim.score())')); state=await pg.evaluate('window.__game.state')
            await pg.evaluate('window.__game.fastForward(2)'); await pg.wait_for_timeout(1500); await pg.screenshot(path=f'{out}/L{n}-complete.png',timeout=120000)
            ok= state=='complete' and not errs; bad+=0 if ok else 1
            print(('  PASS  ' if ok else '  FAIL  ')+f"Level {n}: {state}, time {sc['time']:.0f}s, stars {sc['stars']}/{sc['totalStars']}, rush {sc['rushes']}/{sc['totalRushes']}, falls {sc['falls']}, bonks {sc['bonks']}, score {sc['total']}", errs[:2])
            await pg.close()
        await b.close()
    sys.exit(1 if bad else 0)
asyncio.run(main())
