// One-off: download the Grand Slam Fitness machine photos into /public/machines/home.
// Run from the repo root:  node scripts/fetch-machine-images.mjs
// Requires Node 18+ (built-in fetch). Keep the repo private; these photos belong to Grand Slam Fitness.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/';
const OUT_DIR = path.resolve('public/machines/home');

// [local file name, remote file name]
const FILES = [
  ['e916-unilateral-lat-pulldown.webp', 'latpull-down016.webp'],
  ['e926-lat-pulldown.webp', 'lat-pull-down-02bbdzx.webp'],
  ['e921-mid-row.webp', 'E921-Mid-Row921.webp'],
  ['ppd803-pec-fly-rear-delt.webp', 'PPD803.webp'],
  ['fw760-t-bar-row.webp', 'T-Bar-row.webp'],
  ['df302-abductor-adductor.webp', 'DF-302-Abductor-Adductor.webp'],
];

await mkdir(OUT_DIR, { recursive: true });

let failed = 0;
for (const [local, remote] of FILES) {
  try {
    const res = await fetch(BASE + remote, {
      headers: { 'User-Agent': 'Mozilla/5.0 (personal gym logger; one-time download)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(`unexpected content-type "${type}"`);

    await writeFile(path.join(OUT_DIR, local), Buffer.from(await res.arrayBuffer()));
    console.log('✔', local);
  } catch (err) {
    failed += 1;
    console.error('✘', local, '-', err.message);
  }
}

if (failed) {
  console.error(`\n${failed} of ${FILES.length} downloads failed. Open the product page, save the image manually, and drop it in ${OUT_DIR}.`);
  process.exit(1);
}
console.log(`\nAll ${FILES.length} images saved to ${OUT_DIR}`);
