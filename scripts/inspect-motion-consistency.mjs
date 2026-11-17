import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const framesRoot = path.join(root, "assets", "pets", "小呆", "generated", "motions");

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation: max ? delta / max : 0, value: max };
}

async function collect(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(file));
    else if (/\.webp$/i.test(entry.name) && file.includes(`${path.sep}frames${path.sep}`)) files.push(file);
  }
  return files;
}

const rows = [];
for (const file of (await collect(framesRoot)).sort()) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hues = [];
  const sats = [];
  const values = [];
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      if (data[i + 3] < 160) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
      const hsv = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      if (hsv.hue >= 8 && hsv.hue <= 48 && hsv.saturation >= 0.12 && hsv.value >= 0.22) {
        hues.push(hsv.hue);
        sats.push(hsv.saturation);
        values.push(hsv.value);
      }
    }
  }
  const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  rows.push({
    motion: path.relative(framesRoot, file).split(path.sep)[0],
    file: path.basename(file),
    width: right - left + 1,
    height: bottom - top + 1,
    hue: avg(hues),
    saturation: avg(sats),
    value: avg(values),
    orangePixels: hues.length,
  });
}

const groups = new Map();
for (const row of rows) {
  const group = groups.get(row.motion) || [];
  group.push(row);
  groups.set(row.motion, group);
}
for (const [motion, group] of groups) {
  const avg = (key) => group.reduce((sum, row) => sum + row[key], 0) / group.length;
  const range = (key) => [Math.min(...group.map((row) => row[key])), Math.max(...group.map((row) => row[key]))];
  console.log(JSON.stringify({
    motion,
    frames: group.length,
    subjectWidthRange: range("width"),
    subjectHeightRange: range("height"),
    meanFurHue: Number(avg("hue").toFixed(2)),
    meanFurSaturation: Number(avg("saturation").toFixed(4)),
    meanFurValue: Number(avg("value").toFixed(4)),
    hueRange: range("hue").map((v) => Number(v.toFixed(2))),
    saturationRange: range("saturation").map((v) => Number(v.toFixed(4))),
    valueRange: range("value").map((v) => Number(v.toFixed(4))),
  }));
}
