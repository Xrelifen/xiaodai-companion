import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const petsRoot = path.join(root, "assets", "pets");

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

async function optimizePng(filePath) {
  const outputPath = filePath.replace(/\.png$/i, ".webp");
  await sharp(filePath)
    .webp({ quality: 84, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(outputPath);
  const [source, output, metadata] = await Promise.all([
    fs.stat(filePath),
    fs.stat(outputPath),
    sharp(outputPath).metadata(),
  ]);
  if (!metadata.hasAlpha) throw new Error(`WebP lost alpha: ${outputPath}`);
  return { filePath, outputPath, sourceBytes: source.size, outputBytes: output.size };
}

async function updateMotionManifest(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const motion = JSON.parse(text);
  if (motion.neutralFrame) motion.neutralFrame = motion.neutralFrame.replace(/\.png$/i, ".webp");
  for (const variant of motion.variants || []) {
    for (const frame of variant.frames || []) {
      frame.file = frame.file.replace(/\.png$/i, ".webp");
    }
  }
  await fs.writeFile(filePath, `${JSON.stringify(motion, null, 2)}\n`);
}

const allFiles = await walk(petsRoot);
const motionPngs = allFiles.filter((filePath) => /[\\/]generated[\\/]motions[\\/].*[\\/]frames[\\/].*\.png$/i.test(filePath));
const results = [];
for (const filePath of motionPngs) results.push(await optimizePng(filePath));
for (const filePath of allFiles.filter((entry) => entry.endsWith(`${path.sep}motion.json`))) {
  await updateMotionManifest(filePath);
}

const sourceBytes = results.reduce((sum, result) => sum + result.sourceBytes, 0);
const outputBytes = results.reduce((sum, result) => sum + result.outputBytes, 0);
const reduction = sourceBytes ? (1 - outputBytes / sourceBytes) * 100 : 0;
console.log(`Optimized ${results.length} motion frames.`);
console.log(`PNG ${(sourceBytes / 1024 / 1024).toFixed(2)} MiB -> WebP ${(outputBytes / 1024 / 1024).toFixed(2)} MiB (${reduction.toFixed(1)}% smaller).`);
