// Stills from each stop's own simulation, for the landing cards and share cards.
//
//   node sim-images.mjs capture <baseUrl> <frameDir> [id-prefix ...]
//     Opens every stop, lets the sim run to the moment set in CONFIG and saves
//     the sim canvas as <frameDir>/<id>.png (2x pixels).
//   node sim-images.mjs build <baseUrl> <frameDir> [id-prefix ...]
//     From those frames writes HowPhysicsWorks/assets/img/thumbs/<id>.webp
//     (640x400, at most about 40 KB) and HowPhysicsWorks/stops/<id>/og-image.png
//     (1200x630: the frame, stop number, title and site name in the site's type).
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
const stops = JSON.parse(fs.readFileSync(path.join(SITE, 'assets', 'data', 'stops.json'), 'utf8')).stops;

const [mode, baseUrl, frameDir, ...only] = process.argv.slice(2);
if (!['capture', 'build'].includes(mode) || !baseUrl || !frameDir) {
  console.error('usage: node sim-images.mjs capture|build <baseUrl> <frameDir> [id-prefix ...]');
  process.exit(2);
}
fs.mkdirSync(frameDir, { recursive: true });

// Per-stop moment and crop, keyed by stop number.
// wait: ms after the sim is on screen (and after any clicks).
// pre: ms before the clicks (for controls that unlock later).
// set: {selector: value} for range inputs, applied first.
// clicks: selectors clicked in order, clickGap ms apart.
// canvas: selector of the canvas to keep when the largest one is not it.
// cx, cy: focus of the 16:10 thumbnail crop (0..1, default centre); z: zoom (>= 1).
// PROBE=ms,ms,... (capture only) saves <nnn>@<ms>.png at those times instead.
const DEFAULT = { wait: 4000, pre: 0, set: {}, clicks: [], clickGap: 600, cx: 0.5, cy: 0.5, z: 1 };
const CONFIG = {
  '001': { cy: 0.15 },
  '002': { clicks: ['[data-ratio="3/2"]', '#sim-play-btn'], wait: 1000 },
  '004': { clicks: ['#sim-play-btn'], clickGap: 0, wait: 400 },
  '007': { cy: 0.3 },
  '010': { z: 1.3, cy: 0.35 },
  '012': { clicks: ['#sim-play-btn'], wait: 1500 },
  '016': { cx: 0.4 },
  '018': { cx: 0.6 },
  '023': { set: { '#source-frequency-slider': 3 }, wait: 3000 },
  '028': { set: { '#frequency-slider': 60 } },
  '033': { pre: 4000, clicks: ['#bohr-toggle-btn'] },
  '039': { clicks: ['#mode-chamber'], wait: 3500 },
  '040': { clicks: ['#mode-energy'] },
  '043': { cy: 0.25 },
  '044': { cy: 0.4 },
  '047': { cy: 0.3 },
};
const cfgFor = id => ({ ...DEFAULT, ...(CONFIG[id.slice(0, 3)] || {}) });
const selected = stops.filter(s => !only.length || only.some(p => s.id.startsWith(p)));


async function capture() {
  for (const stop of selected) {
    const cfg = cfgFor(stop.id);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${baseUrl}/stops/${stop.id}/index.html`, { waitUntil: 'load' });
    await page.evaluate(() => {
      const m = document.getElementById('sim-mount');
      if (m) m.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(800);
    for (const [sel, v] of Object.entries(cfg.set)) {
      await page.$eval(sel, (el, v) => {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, v);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(cfg.pre);
    for (const sel of cfg.clicks) {
      await page.click(sel);
      await page.waitForTimeout(cfg.clickGap);
    }
    const probe = process.env.PROBE ? process.env.PROBE.split(',').map(Number) : null;
    if (!probe) await page.waitForTimeout(cfg.wait);
    const handle = cfg.canvas
      ? await page.$(cfg.canvas)
      : await page.evaluateHandle(() => {
          const cs = [...document.querySelectorAll('#sim-mount canvas')];
          let best = null, area = 0;
          for (const c of cs) {
            const r = c.getBoundingClientRect();
            if (r.width * r.height > area) { area = r.width * r.height; best = c; }
          }
          return best;
        });
    const el = handle && handle.asElement();
    if (!el) { console.log(stop.id, 'NO CANVAS'); await ctx.close(); continue; }
    const box = await el.boundingBox();
    if (probe) {
      let t = 0;
      for (const ms of probe) {
        await page.waitForTimeout(ms - t); t = ms;
        await el.screenshot({ path: path.join(frameDir, stop.id.slice(0, 3) + '@' + ms + '.png') });
      }
    } else {
      await el.screenshot({ path: path.join(frameDir, stop.id + '.png') });
    }
    console.log(stop.id, Math.round(box.width) + 'x' + Math.round(box.height), errors.length ? 'ERR ' + errors[0] : '');
    await ctx.close();
  }
}

const ERA_LABEL = {
  ancient: 'Antiquity & the Middle Ages',
  revolution: 'Scientific Revolution',
  classical: 'Classical Physics',
  modern: 'The Modern Revolution',
  contemporary: 'Contemporary Physics',
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function ogHtml(stop, frameUrl) {
  const num = String(stop.order).padStart(3, '0');
  return `<!doctype html><html><head><meta charset="utf-8">
<base href="${baseUrl}/">
<link rel="stylesheet" href="assets/css/base.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--color-void); }
  .og { --era: var(--era-${stop.era}-color); position: relative; width: 1200px; height: 630px; box-sizing: border-box;
        display: grid; grid-template-columns: 430px 1fr; gap: 40px; padding: 48px 48px 48px 64px;
        background:
          radial-gradient(ellipse 60% 80% at 78% 50%, oklch(from var(--era) l c h / 0.16), transparent 70%),
          radial-gradient(ellipse 50% 60% at 0% 100%, oklch(0.80 0.17 82 / 0.07), transparent 70%),
          var(--color-void); }
  .og::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--era); }
  .text { display: flex; flex-direction: column; min-width: 0; }
  .site { font-family: var(--font-display); font-weight: 700; font-size: 34px; letter-spacing: -0.01em;
          color: var(--color-text-primary); line-height: 1; }
  .site span { color: var(--color-gold); }
  .mid { margin-block: auto; }
  .num { font-family: var(--font-body); font-weight: 500; font-size: 19px; letter-spacing: 0.16em;
         text-transform: uppercase; color: var(--era); display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .num::after { content: ''; flex: 1; height: 1px; background: var(--era); opacity: 0.45; }
  .title { font-family: var(--font-display); font-weight: 600; font-size: 64px; line-height: 1.04;
           color: var(--color-text-primary); margin: 0; text-wrap: balance; }
  .who { font-family: var(--font-body); font-size: 21px; color: var(--color-text-secondary); margin-top: 20px; line-height: 1.35; }
  .era { font-family: var(--font-body); font-size: 17px; letter-spacing: 0.06em; color: var(--color-text-secondary); }
  .frame { display: flex; align-items: center; justify-content: center; min-width: 0; }
  .frame img { display: block; max-width: 100%; max-height: 534px; border-radius: 14px;
               border: 1px solid oklch(from var(--era) l c h / 0.45);
               box-shadow: 0 18px 50px oklch(0 0 0 / 0.7), 0 0 60px oklch(from var(--era) l c h / 0.12); }
</style></head><body>
<div class="og">
  <div class="text">
    <div class="site">How <span>Physics</span> Works</div>
    <div class="mid">
      <div class="num">Stop ${num}</div>
      <h1 class="title">${esc(stop.title)}</h1>
      <div class="who">${esc(stop.scientist)} · ${esc(stop.yearLabel)}</div>
    </div>
    <div class="era">${esc(ERA_LABEL[stop.era] || '')}</div>
  </div>
  <div class="frame"><img src="${frameUrl}" alt=""></div>
</div></body></html>`;
}

async function build() {
  const thumbDir = path.join(SITE, 'assets', 'img', 'thumbs');
  fs.mkdirSync(thumbDir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('page error', e.message));
  // Serve the share-card template from the site's own origin so its fonts load.
  let ogPage = '';
  await page.route(baseUrl + '/__og-card.html', r => r.fulfill({ body: ogPage, contentType: 'text/html' }));
  for (const stop of selected) {
    const cfg = cfgFor(stop.id);
    const framePath = path.join(frameDir, stop.id + '.png');
    if (!fs.existsSync(framePath)) { console.log(stop.id, 'NO FRAME'); continue; }
    const frameUrl = 'data:image/png;base64,' + fs.readFileSync(framePath).toString('base64');

    // Thumbnail: 16:10 crop around (cx, cy), 640x400 WebP, quality stepped down to fit ~40 KB.
    await page.setContent('<!doctype html><body style="margin:0;background:#000"></body>');
    const webp = await page.evaluate(async ({ src, cfg }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const W = img.naturalWidth, H = img.naturalHeight, A = 1.6;
      const cw = Math.min(W, H * A) / cfg.z, ch = cw / A;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const x0 = clamp(cfg.cx * W - cw / 2, 0, W - cw), y0 = clamp(cfg.cy * H - ch / 2, 0, H - ch);
      const c = document.createElement('canvas');
      c.width = 640; c.height = 400;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, x0, y0, cw, ch, 0, 0, 640, 400);
      let q = 0.82, url;
      do { url = c.toDataURL('image/webp', q); q -= 0.06; } while (url.length * 0.75 > 40 * 1024 && q > 0.3);
      return url;
    }, { src: frameUrl, cfg });
    const thumbBuf = Buffer.from(webp.split(',')[1], 'base64');
    fs.writeFileSync(path.join(thumbDir, stop.id + '.webp'), thumbBuf);

    // Share card.
    ogPage = ogHtml(stop, frameUrl);
    await page.goto(baseUrl + '/__og-card.html', { waitUntil: 'load' });
    await page.evaluate(async () => {
      await Promise.all(['700 34px "Cormorant Garamond"', '600 64px "Cormorant Garamond"',
        '400 21px "DM Sans"', '500 19px "DM Sans"'].map(f => document.fonts.load(f)));
      await document.fonts.ready;
      if (!document.fonts.check('600 64px "Cormorant Garamond"')) throw new Error('site fonts did not load');
      const t = document.querySelector('.title');
      let size = 64;
      while ((t.getBoundingClientRect().height > 210 || t.scrollWidth > t.clientWidth) && size > 36) { size -= 2; t.style.fontSize = size + 'px'; }
    });
    const ogPath = path.join(SITE, 'stops', stop.id, 'og-image.png');
    await page.screenshot({ path: ogPath });
    console.log(stop.id, 'thumb', Math.round(thumbBuf.length / 1024) + 'KB', 'og', Math.round(fs.statSync(ogPath).size / 1024) + 'KB');
  }
  await ctx.close();
}

const browser = await chromium.launch({ executablePath: process.env.CHROME });
if (mode === 'capture') await capture();
else await build();
await browser.close();
