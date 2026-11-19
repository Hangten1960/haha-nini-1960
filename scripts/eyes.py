# QA: close-up renders of both bears' faces from several angles and in every animation state.
import sys, asyncio, os
from playwright.async_api import async_playwright
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        pg=await b.new_page(viewport={'width':900,'height':500})
        pg.on('pageerror',lambda e:print('PAGEERROR',e))
        await pg.goto('file://'+os.path.abspath('dist/index.html')+'?capture')
        await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=60000)
        await pg.evaluate('document.getElementById("ui").style.display="none"')
        # menu: both bears, three camera angles
        for name,pos in [('front',[4.55,1.75,4.2]),('left',[2.2,1.9,3.6]),('right',[6.9,1.9,3.6]),('high',[4.55,3.4,3.6])]:
            await pg.evaluate(f'window.__game.debugCam={{pos:{pos},look:[4.55,1.6,0]}}; window.__game.fastForward(0.6)')
            await pg.screenshot(path=f'{out}/menu-{name}.png')
        # gameplay states for each bear
        await pg.evaluate('window.__game.play(); window.__game.beginPlay(); window.__game.fastForward(0.5)')
        for ch in ['haha','nini']:
            await pg.evaluate(f'(()=>{{const g=window.__game; if(g.sim.player.char!=="{ch}"){{const ev=[]; g.sim.switchCharacter(ev); g.handle(ev);}} g.sim.player.x=12; g.sim.player.y=0; g.fastForward(0.6);}})()')
            async def snap(tag):
                await pg.evaluate('(()=>{const g=window.__game,p=g.sim.player; g.debugCam={pos:[p.x+0.4,p.y+1.9,3.4],look:[p.x,p.y+1.5,0]}; g.frame(1e-4);})()')
                await pg.screenshot(path=f'{out}/{ch}-{tag}.png')
            await snap('idle')
            await pg.keyboard.down('ArrowRight'); await pg.evaluate('window.__game.fastForward(0.12)'); await snap('walk'); await pg.evaluate('window.__game.fastForward(0.6)'); await snap('run')
            await pg.keyboard.down('Space'); await pg.evaluate('window.__game.fastForward(0.25)'); await snap('jump'); await pg.keyboard.up('Space'); await pg.evaluate('window.__game.fastForward(0.45)'); await snap('fall')
            await pg.keyboard.up('ArrowRight'); await pg.evaluate('window.__game.fastForward(0.8)')
            await pg.keyboard.down('ArrowLeft'); await pg.evaluate('window.__game.fastForward(0.5)'); await snap('turn-left'); await pg.keyboard.up('ArrowLeft'); await pg.evaluate('window.__game.fastForward(0.5)')
        await b.close()
asyncio.run(main())
