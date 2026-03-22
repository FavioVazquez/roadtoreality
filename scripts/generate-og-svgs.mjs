#!/usr/bin/env node
/**
 * generate-og-svgs.mjs
 * Reads Episodio4/assets/data/stops.json and writes one 1200x630 SVG
 * Open Graph image per stop to Episodio4/stops/{stop-id}/og-image.svg
 *
 * Run from repo root:
 *   node scripts/generate-og-svgs.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ------------------------------------------------------------------
// Era accent colors (hex approximations of oklch design tokens)
// ------------------------------------------------------------------
const ERA_COLORS = {
  ancient:       '#c4922a',   // warm amber  — oklch(0.72 0.12  60)
  revolution:    '#4ca86b',   // sage green  — oklch(0.72 0.15 145)
  classical:     '#5b8fd4',   // steel blue  — oklch(0.65 0.18 240)
  modern:        '#b06fd0',   // purple      — oklch(0.68 0.20 310)
  contemporary:  '#d45b5b',   // coral red   — oklch(0.68 0.22  20)
};

const ERA_LABELS = {
  ancient:      'Era 1 — Ancient',
  revolution:   'Era 2 — Scientific Revolution',
  classical:    'Era 3 — Classical Physics',
  modern:       'Era 4 — Modern Physics',
  contemporary: 'Era 5 — Contemporary',
};

// ------------------------------------------------------------------
// Text wrapping helper — returns array of lines fitting maxChars
// ------------------------------------------------------------------
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ------------------------------------------------------------------
// Escape XML special characters
// ------------------------------------------------------------------
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ------------------------------------------------------------------
// Generate a single SVG string for one stop
// ------------------------------------------------------------------
function generateSVG(stop) {
  const accent     = ERA_COLORS[stop.era]  || '#c4922a';
  const eraLabel   = ERA_LABELS[stop.era]  || stop.era;
  const orderLabel = String(stop.order).padStart(2, '0');

  // Title wrapping: ~28 chars per line at font-size 72
  const titleLines = wrapText(stop.title, 28);

  // Build title <text> elements — stacked from y=280
  const titleY0   = 285;
  const titleDy   = 86; // line height for 72px font
  const titleElems = titleLines.map((line, i) =>
    `<text x="88" y="${titleY0 + i * titleDy}"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="72" font-weight="600"
      fill="#f0ede8" letter-spacing="-1">${esc(line)}</text>`
  ).join('\n    ');

  // Scientist name sits below the last title line
  const scientistY = titleY0 + titleLines.length * titleDy + 24;

  // Year badge (bottom-right)
  const yearText = esc(stop.yearLabel || String(stop.year));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">

  <!-- Background -->
  <rect width="1200" height="630" fill="#1a1a1a"/>

  <!-- Subtle grid pattern -->
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-width="0.3" opacity="0.04"/>
    </pattern>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#1a1a1a"   stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Grid overlay -->
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Left gradient wash -->
  <rect width="560" height="630" fill="url(#bgGrad)"/>

  <!-- Era accent bar — left edge -->
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>

  <!-- Era badge — top left -->
  <rect x="28" y="28" width="${eraLabel.length * 9 + 24}" height="34" rx="6" fill="${accent}" fill-opacity="0.18"/>
  <rect x="28" y="28" width="${eraLabel.length * 9 + 24}" height="34" rx="6"
    fill="none" stroke="${accent}" stroke-width="1" stroke-opacity="0.6"/>
  <text x="40" y="51"
    font-family="'DM Sans', Arial, sans-serif"
    font-size="14" font-weight="500"
    fill="${accent}" letter-spacing="0.5">${esc(eraLabel.toUpperCase())}</text>

  <!-- Site branding — top right -->
  <text x="1172" y="52" text-anchor="end"
    font-family="'DM Sans', Arial, sans-serif"
    font-size="15" font-weight="400"
    fill="#ffffff" fill-opacity="0.35">HOW PHYSICS WORKS</text>

  <!-- Title lines -->
  ${titleElems}

  <!-- Scientist name -->
  <text x="88" y="${scientistY}"
    font-family="'DM Sans', Arial, sans-serif"
    font-size="32" font-weight="400"
    fill="${accent}">${esc(stop.scientist)}</text>

  <!-- Horizontal rule -->
  <line x1="88" y1="${scientistY + 28}" x2="600" y2="${scientistY + 28}"
    stroke="${accent}" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Description excerpt (first 90 chars) -->
  <text x="88" y="${scientistY + 60}"
    font-family="'DM Sans', Arial, sans-serif"
    font-size="20" font-weight="300"
    fill="#ffffff" fill-opacity="0.45">${esc(String(stop.description || '').substring(0, 90))}…</text>

  <!-- Year badge — bottom right -->
  <rect x="${1200 - 48 - yearText.length * 14}" y="560" width="${yearText.length * 14 + 32}" height="44" rx="8"
    fill="${accent}" fill-opacity="0.15"/>
  <rect x="${1200 - 48 - yearText.length * 14}" y="560" width="${yearText.length * 14 + 32}" height="44" rx="8"
    fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.5"/>
  <text x="${1200 - 32}" y="588" text-anchor="end"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="22" font-weight="600"
    fill="${accent}">${yearText}</text>

  <!-- Bottom accent line -->
  <rect x="0" y="622" width="1200" height="8" fill="${accent}" fill-opacity="0.35"/>

</svg>`;
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
const stopsPath = join(ROOT, 'Episodio4', 'assets', 'data', 'stops.json');
const data      = JSON.parse(readFileSync(stopsPath, 'utf8'));
const stops     = data.stops;

let written = 0;
let errors  = 0;

for (const stop of stops) {
  const outPath = join(ROOT, 'Episodio4', stop.path, 'og-image.svg');
  try {
    const svg = generateSVG(stop);
    writeFileSync(outPath, svg, 'utf8');
    console.log(`  [OK] ${stop.id}`);
    written++;
  } catch (err) {
    console.error(`  [ERR] ${stop.id}: ${err.message}`);
    errors++;
  }
}

console.log(`\nDone. ${written} SVGs written, ${errors} errors.`);
