import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function escapeHtmlAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

const stopsJsonPath = path.join(repoRoot, 'Episodio4', 'assets', 'data', 'stops.json');
const stopsData = JSON.parse(fs.readFileSync(stopsJsonPath, 'utf8'));
const stops = stopsData.stops;

let written = 0;
let skipped = 0;
let errors = 0;

for (const stop of stops) {
  const htmlPath = path.join(repoRoot, 'Episodio4', 'stops', stop.id, 'index.html');

  let html;
  try {
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch (err) {
    console.error(`ERROR: Could not read ${htmlPath}: ${err.message}`);
    errors++;
    continue;
  }

  if (html.includes('property="og:title"')) {
    skipped++;
    continue;
  }

  const escapedTitle = escapeHtmlAttr(stop.title);
  const escapedDescription = escapeHtmlAttr(stop.description);
  const ogImageUrl = `https://faviovazquez.github.io/roadtoreality/Episodio4/stops/${stop.id}/og-image.svg`;

  const injectionBlock =
    `\n  <meta property="og:title" content="${escapedTitle} — How Physics Works">` +
    `\n  <meta property="og:description" content="${escapedDescription}">` +
    `\n  <meta property="og:image" content="${ogImageUrl}">` +
    `\n  <meta property="og:type" content="article">` +
    `\n  <meta name="twitter:card" content="summary_large_image">`;

  const updatedHtml = html.replace(
    /<meta name="description"[^>]+>/,
    match => match + injectionBlock
  );

  if (updatedHtml === html) {
    console.error(`ERROR: Could not find <meta name="description"> in ${htmlPath}`);
    errors++;
    continue;
  }

  try {
    fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
    written++;
  } catch (err) {
    console.error(`ERROR: Could not write ${htmlPath}: ${err.message}`);
    errors++;
  }
}

console.log(`Injected OG tags: ${written} files updated, ${skipped} already had tags, ${errors} errors`);

process.exit(errors === 0 ? 0 : 1);
