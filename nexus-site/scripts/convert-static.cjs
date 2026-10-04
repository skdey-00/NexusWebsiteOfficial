/**
 * ONE-OFF: convert public/Images + KYNEX poster JPG/PNG → WebP (2026-09-15)
 * Run from Windows node (sharp is a win-x64 install):
 *   cmd.exe /c "cd nexus-site && node scripts/convert-static.cjs"
 * - writes .webp next to each source (same base name)
 * - logos/thumbnails: max width 800, quality 88 (keeps crisp edges)
 * - big art (blueprint/poster): max width 1600, quality 80
 * - reports size before → after
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  // [relative path, maxWidth, quality]
  ['public/Images/Logo_without_text.png', 800, 88],
  ['public/Images/Logo.png', 800, 88],
  ['public/Images/Logo_white.png', 800, 88],
  ['public/Images/somaiya trust.png', 400, 88],
  ['public/Images/K J Somaiya College of Engineering.png', 400, 88],
  ['public/Images/nexus-blueprint.png', 1600, 80],
  ['public/Images/archive/workshop-01.jpg', 1600, 80],
  ['public/Images/archive/workshop-02.jpg', 1600, 80],
  ['public/Images/archive/workshop-03.jpg', 1600, 80],
  ['public/Images/archive/workshop-04.jpg', 1600, 80],
  ['public/KYNEX-26 Material/poster-900.jpg', 900, 82],
  ['public/KYNEX-26 Material/poster-1600.jpg', 1600, 82],
];

const SPONSORS_DIR = path.join(ROOT, 'public/Images/Sponsers list');

(async () => {
  const jobs = [...FILES];
  for (const name of fs.readdirSync(SPONSORS_DIR)) {
    if (/\.(png|jpe?g)$/i.test(name)) jobs.push([`public/Images/Sponsers list/${name}`, 600, 88]);
  }

  let totalIn = 0, totalOut = 0, n = 0;
  for (const [rel, maxW, q] of jobs) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) { console.log(`MISS  ${rel}`); continue; }
    const out = src.replace(/\.(png|jpe?g)$/i, '.webp');
    const inSize = fs.statSync(src).size;
    try {
      await sharp(src)
        .resize({ width: maxW, withoutEnlargement: true })
        .webp({ quality: q, effort: 5 })
        .toFile(out + '.tmp');
      fs.renameSync(out + '.tmp', out);
      const outSize = fs.statSync(out).size;
      totalIn += inSize; totalOut += outSize; n++;
      console.log(`ok  ${rel}  ${(inSize / 1024).toFixed(0)}KB → ${(outSize / 1024).toFixed(0)}KB`);
    } catch (err) {
      console.error(`FAIL ${rel}: ${err.message}`);
      try { fs.unlinkSync(out + '.tmp'); } catch {}
    }
  }
  console.log(`\n${n} converted · ${(totalIn / 1024).toFixed(0)}KB → ${(totalOut / 1024).toFixed(0)}KB (${(100 - (totalOut / totalIn) * 100).toFixed(0)}% smaller)`);
})();
