import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("assets", "pets");

async function alphaBounds(file, threshold = 64) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] < threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) return null;
  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
    canvasWidth: info.width,
    canvasHeight: info.height,
    widthRatio: Number(((right - left + 1) / info.width).toFixed(4)),
    heightRatio: Number(((bottom - top + 1) / info.height).toFixed(4)),
  };
}

for (const pet of await readdir(root, { withFileTypes: true })) {
  if (!pet.isDirectory()) continue;
  const motionsRoot = path.join(root, pet.name, "generated", "motions");
  let motions;
  try {
    motions = await readdir(motionsRoot, { withFileTypes: true });
  } catch {
    continue;
  }
  for (const motionDir of motions) {
    if (!motionDir.isDirectory()) continue;
    const motionPath = path.join(motionsRoot, motionDir.name, "motion.json");
    const motion = JSON.parse(await readFile(motionPath, "utf8"));
    const files = [...new Set((motion.variants || []).flatMap((variant) =>
      (variant.frames || []).map((frame) => frame.file).filter(Boolean)))];
    if (!files.length) continue;
    const frames = [];
    for (const relative of files) {
      frames.push({ file: relative, bounds: await alphaBounds(path.join(path.dirname(motionPath), relative)) });
    }
    console.log(JSON.stringify({ pet: pet.name, motion: motion.id, frames }));
  }
}
