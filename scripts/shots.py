# Dev helper: deterministic screenshots via the ?capture hook.  python3 scripts/shots.py out_dir W H [touch]
import sys, asyncio
from playwright.async_api import async_playwright
out, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); touch = len(sys.argv) > 4
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        ctx=await b.new_context(viewport={'width':W,'height':H}, has_touch=touch, is_mobile=touch, device_scale_factor=1)
        pg=await ctx.new_page()
        pg.on('console',lambda m: None if ('GL Driver' in m.text) else print('console:',m.type,m.text[:300]))
        pg.on('pageerror',lambda e:print('PAGEERROR',e))
        await pg.goto('file://'+__import__('os').path.abspath('dist/index.html')+'?capture&autoplay')
        await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=60000)
        ff=lambda s: pg.evaluate(f'window.__game.fastForward({s})')
        async def shot(n):
            await pg.wait_for_timeout(700); await pg.screenshot(path=f'{out}/{n}.png', timeout=120000)
        await ff(1.0); await shot('01-menu')
        await pg.evaluate('window.__game.play()'); await ff(2.2); await shot('02-intro')
        await ff(4.6); await shot('03-start')
        n=4
        for target in [float(x) for x in (sys.argv[5].split(',') if len(sys.argv)>5 else '20,45,76,104,121,150,182,201,236'.split(','))]:
            for _ in range(2000):
                if await pg.evaluate('window.__game.sim.player.x')>=target: break
                await ff(0.1)
            await shot(f'{n:02d}-x{int(target)}'); n+=1
        for _ in range(600):
            if await pg.evaluate('window.__game.state')=='complete': break
            await ff(0.2)
        await ff(2.5); await shot(f'{n:02d}-complete')
        print('score', await pg.evaluate('JSON.stringify(window.__game.sim.score())'))
        info=await pg.evaluate('(()=>{const g=window.__game; g.frame(0.001); const i=g.renderer.info; return {calls:i.render.calls,tris:i.render.triangles,geos:i.memory.geometries,tex:i.memory.textures}})()'); print('render info', info)
        await b.close()
asyncio.run(main())
