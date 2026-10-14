// Share card for the How Physics Works landing page, in the style of the stop cards
// (scripts/sim-images.mjs): HowPhysicsWorks/og-image.png, 1200x630, the site's fonts and
// colours, with four stops' simulation frames from assets/img/thumbs.
//
//   node landing-card.mjs <baseUrl>
//
// baseUrl is a local server of this repo's HowPhysicsWorks folder, e.g.
// http://127.0.0.1:9320/HowPhysicsWorks. Needs playwright-core and a Chromium
// build (path in the CHROME env var).
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, '..', 'HowPhysicsWorks');
const baseUrl = (process.argv[2] || '').replace(/\/$/, '');
if (!baseUrl) { console.error('usage: node landing-card.mjs <baseUrl>'); process.exit(2); }

const stops = JSON.parse(fs.readFileSync(path.join(SITE, 'assets', 'data', 'stops.json'), 'utf8')).stops;
// The first stop, two from the middle and one near the end: the arc the card promises.
const PICK = ['001', '011', '027', '048'];
const picked = PICK.map(p => stops.find(s => s.id.startsWith(p)));

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

function cardHtml() {
  const tiles = picked.map(s => `
    <figure class="tile" style="--era: var(--era-${s.era}-color)">
      <img src="assets/img/thumbs/${s.id}.webp" alt="">
      <figcaption><b>${String(s.order).padStart(3, '0')}</b> ${esc(s.scientist)}</figcaption>
    </figure>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<base href="${baseUrl}/">
<link rel="stylesheet" href="assets/css/base.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--color-void); }
  .og { position: relative; width: 1200px; height: 630px; box-sizing: border-box;
        display: grid; grid-template-columns: 1fr 560px; gap: 44px; padding: 52px 52px 48px 70px;
        background:
          radial-gradient(ellipse 55% 75% at 80% 50%, oklch(0.68 0.20 310 / 0.13), transparent 70%),
          radial-gradient(ellipse 50% 60% at 0% 100%, oklch(0.80 0.17 82 / 0.08), transparent 70%),
          var(--color-void); }
  .og::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
               background: linear-gradient(var(--era-ancient-color), var(--era-revolution-color),
                 var(--era-classical-color), var(--era-modern-color), var(--era-contemporary-color)); }
  .text { display: flex; flex-direction: column; min-width: 0; }
  .site { font-family: var(--font-display); font-weight: 700; font-size: 34px; letter-spacing: -0.01em;
          color: var(--color-text-primary); line-height: 1; }
  .site span { color: var(--color-gold); }
  .mid { margin-block: auto; }
  .title { font-family: var(--font-display); font-weight: 600; font-size: 62px; line-height: 1.04;
           color: var(--color-text-primary); margin: 0; text-wrap: balance; }
  .sub { font-family: var(--font-body); font-size: 22px; color: var(--color-text-secondary); margin-top: 22px; line-height: 1.38; }
  .url { font-family: var(--font-body); font-size: 17px; letter-spacing: 0.04em; color: var(--color-gold); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-content: center; }
  .tile { margin: 0; position: relative; border-radius: 12px; overflow: hidden;
          border: 1px solid oklch(from var(--era) l c h / 0.5);
          box-shadow: 0 14px 36px oklch(0 0 0 / 0.65), 0 0 40px oklch(from var(--era) l c h / 0.10); }
  .tile img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
  .tile figcaption { position: absolute; left: 10px; bottom: 9px; padding: 3px 9px; border-radius: 6px;
          background: oklch(0.07 0 0 / 0.78); font-family: var(--font-body); font-size: 14px; color: var(--color-text-primary); }
  .tile figcaption b { color: var(--era); font-weight: 500; letter-spacing: 0.08em; margin-right: 4px; }
</style></head><body>
<div class="og">
  <div class="text">
    <div class="site">How <span>Physics</span> Works</div>
    <div class="mid">
      <h1 class="title">A history of physics you can play with</h1>
      <div class="sub">${stops.length} stops from Thales to gravitational waves, each with a simulation</div>
    </div>
    <div class="url">roadtoreality.dev/HowPhysicsWorks</div>
  </div>
  <div class="grid">${tiles}</div>
</div></body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('page error', e.message));
// Serve the card from the site's own origin so its fonts and thumbnails load.
await page.route(baseUrl + '/__landing-card.html', r => r.fulfill({ body: cardHtml(), contentType: 'text/html' }));
await page.goto(baseUrl + '/__landing-card.html', { waitUntil: 'load' });
await page.evaluate(async () => {
  await Promise.all(['700 34px "Cormorant Garamond"', '600 62px "Cormorant Garamond"',
    '400 22px "DM Sans"', '500 14px "DM Sans"'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  if (!document.fonts.check('600 62px "Cormorant Garamond"')) throw new Error('site fonts did not load');
  const imgs = [...document.images];
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
  const bad = imgs.filter(i => !i.naturalWidth);
  if (bad.length) throw new Error(bad.length + ' thumbnail(s) did not load');
});
const out = path.join(SITE, 'og-image.png');
await page.screenshot({ path: out });
console.log('og-image.png', Math.round(fs.statSync(out).size / 1024) + 'KB');
await browser.close();
