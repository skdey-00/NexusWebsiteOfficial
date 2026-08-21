// One-off: optimize the 6 new 4032x3024 dept/robot photos in
// public/Images/archive/ into web-ready sizes. Idempotent + verifiable.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'Images', 'archive');

const JOBS = [
  // [source, output slug, widths]
  ['Electronics_Dept_2025.webp', 'electronics-dept-2025', [800, 1600]],
  ['Embedded_Dept_2025.webp',    'embedded-dept-2025',    [800, 1600]],
  ['IP_MATLAB_Dept_2025.webp',   'ip-matlab-dept-2025',   [800, 1600]],
  ['Mechanical_Dept_2025.webp',  'mechanical-dept-2025',  [800, 1600]],
  ['PR_Marketing_2025.webp',     'pr-marketing-2025',     [800, 1600]],
  ['R1_R2_2025.webp',            'r1-r2-2025',            [800, 1600]],
];

(async () => {
  for (const [src, slug, widths] of JOBS) {
    const from = path.join(DIR, src);
    for (const w of widths) {
      const to = path.join(DIR, `${slug}-${w}.webp`);
      await sharp(from)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(to);
      const kb = Math.round(fs.statSync(to).size / 1024);
      console.log(`ok ${slug}-${w}.webp ${kb}KB`);
    }
  }
  console.log('DONE');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
