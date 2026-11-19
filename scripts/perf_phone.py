# Startup + rendering cost on an emulated phone (touch, 844×390 @3x, CPU slowed down N×).
#   python3 scripts/perf_phone.py file.html [cpu_slowdown]
import asyncio, sys, json
from playwright.async_api import async_playwright
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        ctx=await b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True,device_scale_factor=3)
        pg=await ctx.new_page(); cdp=await ctx.new_cdp_session(pg)
        await cdp.send('Emulation.setCPUThrottlingRate',{'rate':float(sys.argv[2]) if len(sys.argv)>2 else 4})
        await pg.goto('file://'+sys.argv[1]+'?capture&level=4', wait_until='commit')
        await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=300000,polling=50)
        ready=await pg.evaluate('performance.now()')
        await pg.evaluate('window.__game.play(); window.__game.beginPlay()')
        rows=[]
        for x in [20, 75, 150, 230]:
            r=await pg.evaluate(f'''(()=>{{const g=window.__game,s=g.sim.player; s.x={x}; s.y=g.sim.world.heightAt({x})??2; g.fastForward(0.6);
              const t0=performance.now(); for(let i=0;i<10;i++) g.frame(1/60); const ms=(performance.now()-t0)/10; const i=g.renderer.info.render;
              return {{x:{x}, calls:i.calls, tris:i.triangles, cpu_ms_per_frame:+ms.toFixed(1)}}}})()''')
            rows.append(r)
        g=await pg.evaluate('(()=>{const g=window.__game; return {pixelRatio:g.renderer.getPixelRatio(), shadows:g.renderer.shadowMap.enabled, phone:!!g.phone, boot:window.__boot||null, batch:g.level.batchInfo||null, buildMs:g.level.buildMs||null}})()')
        print(json.dumps({'menu_ready_ms':round(ready), **g}))
        for r in rows: print('  ', r)
        await b.close()
asyncio.run(main())
