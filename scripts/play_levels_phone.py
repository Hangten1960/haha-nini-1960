# The bot plays levels on an emulated PHONE (touch, 844x390 @3x, phone profile) in the real build.
import asyncio, sys, json, os
from playwright.async_api import async_playwright
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        for n in [int(x) for x in sys.argv[1].split(',')]:
            ctx=await b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True,device_scale_factor=3)
            pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file://'+os.path.abspath('dist/index.html')+f'?capture&autoplay&skipintro&level={n}')
            await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=120000)
            phone=await pg.evaluate('window.__game.phone'); await pg.evaluate('window.__game.play()')
            for _ in range(3000):
                if await pg.evaluate('window.__game.state')=='complete' or await pg.evaluate('window.__game.sim.t')>400: break
                await pg.evaluate('window.__game.fastForward(0.5)')
            if n==int(sys.argv[1].split(',')[0]): pass
            sc=json.loads(await pg.evaluate('JSON.stringify(window.__game.sim.score())')); st=await pg.evaluate('window.__game.state')
            ok=st=='complete' and not errs and phone
            print(('  PASS  ' if ok else '  FAIL  ')+f"phone level {n}: {st}, {sc['time']:.0f}s, stars {sc['stars']}/{sc['totalStars']}, falls {sc['falls']}", errs[:1])
            await ctx.close()
        await b.close()
asyncio.run(main())
