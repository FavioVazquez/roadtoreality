import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, '..');
const stopsDir  = path.join(repoRoot, 'Episodio4', 'stops');

const stopDirs = fs.readdirSync(stopsDir).filter(name =>
  fs.statSync(path.join(stopsDir, name)).isDirectory()
);

let written = 0;
let errors  = 0;

for (const dir of stopDirs.sort()) {
  const svgPath = path.join(stopsDir, dir, 'og-image.svg');
  const pngPath = path.join(stopsDir, dir, 'og-image.png');

  if (!fs.existsSync(svgPath)) {
    console.error(`  [SKIP] ${dir} — no og-image.svg`);
    continue;
  }

  try {
    const svg = fs.readFileSync(svgPath, 'utf8');
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const pngData = resvg.render();
    fs.writeFileSync(pngPath, pngData.asPng());
    console.log(`  [OK] ${dir}`);
    written++;
  } catch (err) {
    console.error(`  [ERR] ${dir}: ${err.message}`);
    errors++;
  }
}

console.log(`\nDone. ${written} PNGs written, ${errors} errors.`);
process.exit(errors === 0 ? 0 : 1);
