// Bundles the game into ONE self-contained file: dist/index.html
//   node scripts/build.mjs           → build
//   node scripts/build.mjs --serve   → build, watch and serve on http://localhost:8080
import { build, context } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';

const serve = process.argv.includes('--serve');
const options = {
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', target: 'es2020', charset: 'utf8', minify: !serve, write: false, outdir: 'dist',
  loader: { '.png': 'dataurl', '.woff2': 'dataurl', '.glb': 'dataurl', '.mp3': 'dataurl', '.ogg': 'dataurl' }, logLevel: 'info',
};
function emit(result) {
  const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text, css = result.outputFiles.find((f) => f.path.endsWith('.css')).text;
  const html = readFileSync('index.html', 'utf8').replace('<!--STYLE-->', () => `<style>${css}</style>`).replace('<!--SCRIPT-->', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
  mkdirSync('dist', { recursive: true }); writeFileSync('dist/index.html', html);
  console.log(`dist/index.html  ${(html.length / 1024 / 1024).toFixed(2)} MB`);
}
if (!serve) emit(await build(options));
else {
  const ctx = await context({ ...options, plugins: [{ name: 'emit', setup(b) { b.onEnd((r) => { if (!r.errors.length) emit(r); }); } }] });
  await ctx.watch();
  createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(readFileSync('dist/index.html')); }).listen(8080, () => console.log('http://localhost:8080'));
}
