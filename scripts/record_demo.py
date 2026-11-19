# Records a gameplay demo (autoplay bot) to MP4 by stepping the game frame by frame.
#   python3 scripts/record_demo.py out.mp4      (needs: playwright, Chrome, ffmpeg)
import sys, asyncio, subprocess, os
from playwright.async_api import async_playwright
OUT=sys.argv[1]; FPS=30; W,H=1280,720
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
async def main():
    tmp=OUT.replace('.mp4','.tmp.mp4')
    ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',tmp],stdin=subprocess.PIPE)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get('CHROME','/usr/bin/google-chrome'),args=ARGS)
        pg=await b.new_page(viewport={'width':W,'height':H})
        await pg.goto('file://'+os.path.abspath('dist/index.html')+'?capture&autoplay')
        await pg.wait_for_function('window.__game && window.__game.state==="menu"',timeout=60000)
        async def frames(n):
            for _ in range(n):
                await pg.evaluate(f'window.__advance({1/FPS})'); ff.stdin.write(await pg.screenshot(type='jpeg',quality=92,timeout=120000))
        await frames(45); await pg.evaluate('window.__game.play()')
        n=0
        while await pg.evaluate('window.__game.state')!='complete' and n<3000: await frames(10); n+=10
        await frames(110)
        await b.close()
    ff.stdin.close(); ff.wait(); os.replace(tmp,OUT); print('frames',n+155)
asyncio.run(main())
