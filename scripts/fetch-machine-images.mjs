// Fetch machine photos into /public/machines/home.
// Run from repo root: node scripts/fetch-machine-images.mjs
// Requires Node 18+ (built-in fetch).

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/machines/home');
await mkdir(OUT_DIR, { recursive: true });

const IMAGES = [
  // Grand Slam Fitness machines
  {
    local: 'e916-unilateral-lat-pulldown.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/latpull-down016.webp',
  },
  {
    local: 'e926-lat-pulldown.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/lat-pull-down-02bbdzx.webp',
  },
  {
    local: 'e921-mid-row.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/E921-Mid-Row921.webp',
  },
  {
    local: 'ppd803-pec-fly-rear-delt.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/PPD803.webp',
  },
  {
    local: 'fw760-t-bar-row.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/T-Bar-row.webp',
  },
  {
    local: 'df302-abductor-adductor.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/DF-302-Abductor-Adductor.webp',
  },
  {
    local: 'seated-chest-press.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/ss_products/1385791-ChestPress.webp',
  },
  {
    local: 'shoulder-press.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/commercial_products/FUSE0700-Shoulder-Press.webp',
  },
  {
    local: 'leg-extension-curl.webp',
    url: 'https://www.grandslamfitness.co.in/admin/upload/ss_products/2856764-C540-leg-extension.webp',
  },
  // Exercise images
  {
    local: 'hammer-curl.jpg',
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwF5_0P07BhrBfHEbMYO-aox4JZU45A5Sx6Fd2FTR9xA&s=10',
  },
  {
    local: 'preacher-curl.jpg',
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUf_0w7EAoKOm2WZ6yRZxnbhwPsTH2dC2THNsuW46dHJkKz1aqSFJVqzo&s=10',
  },
  {
    local: 'tricep-pushdown.jpg',
    url: 'https://static.strengthlevel.com/images/exercises/reverse-grip-tricep-pushdown/reverse-grip-tricep-pushdown-800.jpg',
  },
  {
    local: 'incline-chest-press.gif',
    url: 'https://fitnessprogramer.com/wp-content/uploads/2021/09/Lever-Incline-Hammer-Chest-Press.gif',
  },
  {
    local: 'tricep-overhead.webp',
    url: 'https://www.strongermobileapp.com/videos/exercises/v1/cable-straight-bar-overhead-tricep-extension.webp',
  },
  {
    local: 'calf-raises.png',
    url: 'https://apilyfta.com/static/GymvisualPNG/05941101-Lever-Seated-Calf-Raise-(plate-loaded)_Calf_small.png',
  },
  {
    local: 'lateral-raise.jpg',
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPLM07vZa1gAW-pQCIr3TkLjCi8pAXkSW3tJ1LqRt5dM5d57Ll2hSKOmY&s=10',
  },
  {
    local: 'cable-fly.jpg',
    url: 'https://i.pinimg.com/736x/bd/d0/8c/bdd08cc009b9e4a4bc9c4d59ff686689.jpg',
  },
  {
    local: 'leg-press.webp',
    url: 'https://5.imimg.com/data5/SELLER/Default/2022/9/BI/DU/LA/23365920/leg-press-500x500.png',
  },
  {
    local: 'weighted-squats.gif',
    url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-sumo-squat.gif',
  },
];

let failed = 0;
for (const item of IMAGES) {
  try {
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': item.url.includes('pinimg.com') ? 'https://www.pinterest.com/' :
                   item.url.includes('strengthlevel.com') ? 'https://strengthlevel.com/' :
                   item.url.includes('fitnessprogramer.com') ? 'https://fitnessprogramer.com/' :
                   item.url.includes('imimg.com') ? 'https://www.indiamart.com/' :
                   item.url.includes('grandslamfitness.co.in') ? 'https://grandslamfitness.co.in/' :
                   undefined,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(OUT_DIR, item.local), buffer);
    console.log('✔', item.local);
  } catch (err) {
    failed += 1;
    console.error('✘', item.local, '-', err.message);
  }
}

if (failed) {
  console.error(`\n${failed} of ${IMAGES.length} downloads failed.`);
  process.exit(1);
}
console.log(`\nAll ${IMAGES.length} images saved to ${OUT_DIR}`);
