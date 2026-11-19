# Records the four-level gameplay preview (autoplay bot) + castle finale + reward screen to MP4.
#   python3 scripts/record_preview.py out.mp4
import sys, asyncio, subprocess, os
from playwright.async_api import async_playwright
OUT=sys.argv[1]; FPS=30; W,H=1280,720
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    tmp=OUT.replace('.mp4','.tmp.mp4')
    ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-crf','22','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart',tmp],stdin=subprocess.PIPE)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
        pg=await b.new_page(viewport={'width':W,'height':H})
        await pg.goto('file://'+os.path.abspath('dist/index.html')+'?capture&autoplay&unlock')
        await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=120000)
        async def rec(seconds):
            for _ in range(int(seconds*FPS)):
                await pg.evaluate(f'window.__advance({1/FPS})'); ff.stdin.write(await pg.screenshot(type='jpeg',quality=90,timeout=120000))
        await rec(2.5)                                                   # winter menu
        for i in range(4):
            await pg.evaluate(f'window.__game.playLevel({i})'); await rec(4.2 if i==0 else 3.0)     # intro / level title
            await pg.evaluate('window.__game.beginPlay()'); await rec(6.0)
            fin=await pg.evaluate('window.__game.sim.level.finishX')
            while await pg.evaluate('window.__game.sim.player.x') < fin*0.55: await pg.evaluate('window.__game.fastForward(0.5)')
            await rec(5.0)
            if i==3:
                while await pg.evaluate('window.__game.state')=='playing' and await pg.evaluate('window.__game.sim.player.x') < fin-9: await pg.evaluate('window.__game.fastForward(0.5)')
                await rec(13.0)                                          # castle arrival + reward screen
            else:
                while await pg.evaluate('window.__game.state') not in ('complete',): await pg.evaluate('window.__game.fastForward(0.5)')
        await b.close()
    ff.stdin.close(); ff.wait(); os.replace(tmp,OUT); print('done')
asyncio.run(main())
