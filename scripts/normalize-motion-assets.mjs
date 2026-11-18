import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const motionsRoot = path.join(root, "assets", "pets", "小呆", "generated", "motions");
const referencePath = path.join(motionsRoot, "sit-idle-v1", "frames", "frame-000-neutral.png");
const canvas = { width: 1280, height: 1354, groundY: 1320 };

const profiles = {
  "sit-idle-v1": { axis: "height", extent: 1260, grade: { brightness: 1, saturation: 1, hue: 0 } },
  "lie-idle-v1": { axis: "width", extent: 1210, grade: { brightness: 1.002, saturation: 0.957, hue: -0.9 } },
  "walk-cycle-v1": { axis: "width", extent: 1190, grade: { brightness: 1.006, saturation: 0.967, hue: -1.45 } },
  "run-cycle-v1": { axis: "width", extent: 1190, grade: { brightness: 1.012, saturation: 0.951, hue: -1.1 } },
  "stand-settle-v1": { axis: "width", extent: 1190, grade: { brightness: 1.006, saturation: 0.967, hue: -1.45 } },
  "start-step-v1": { axis: "width", extent: 1190, grade: { brightness: 1.006, saturation: 0.967, hue: -1.45 } },
  "sit-stand-v1": { axis: "height", extent: 1260, grade: { brightness: 1, saturation: 1, hue: 0 } },
  "turn-v1/frames/frame-020-front": { axis: "height", extent: 1260, offsetX: 110, grade: { brightness: 1, saturation: 1, hue: 0 } },
  "turn-v1": { axis: "height", extent: 1260, grade: { brightness: 1, saturation: 1, hue: 0 } },
  "sit-to-lie-v1/frames/frame-010": { axis: "height", extent: 1190, grade: { brightness: 1.01, saturation: 0.981, hue: -0.5 } },
  "sit-to-lie-v1/frames/frame-012": { axis: "width", extent: 1195, grade: { brightness: 1.01, saturation: 0.981, hue: -0.5 } },
  "sit-to-lie-v1/frames/frame-015": { axis: "width", extent: 1195, grade: { brightness: 1.01, saturation: 0.981, hue: -0.5 } },
  "sit-to-lie-v1/frames/frame-020": { axis: "width", extent: 1195, grade: { brightness: 1.01, saturation: 0.981, hue: -0.5 } },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsv(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { hue, saturation: max ? delta / max : 0, value: max };
}

async function alphaBounds(filePath, threshold = 28) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha < threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error(`No visible pixels: ${filePath}`);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function furStats(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  let hueX = 0;
  let hueY = 0;
  let saturation = 0;
  let value = 0;
  for (let index = 0; index < data.length; index += info.channels) {
    if (data[index + 3] < 160) continue;
    const hsv = rgbToHsv(data[index], data[index + 1], data[index + 2]);
    if (hsv.hue < 8 || hsv.hue > 48 || hsv.saturation < 0.12 || hsv.value < 0.22) continue;
    const radians = hsv.hue / 180 * Math.PI;
    hueX += Math.cos(radians);
    hueY += Math.sin(radians);
    saturation += hsv.saturation;
    value += hsv.value;
    count += 1;
  }
  if (!count) return { hue: 28, saturation: 0.35, value: 0.72, count: 0 };
  let hue = Math.atan2(hueY / count, hueX / count) / Math.PI * 180;
  if (hue < 0) hue += 360;
  return { hue, saturation: saturation / count, value: value / count, count };
}

function profileFor(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  for (const [key, profile] of Object.entries(profiles)) {
    if (normalized.includes(key)) return profile;
  }
  throw new Error(`Missing normalization profile: ${relativePath}`);
}

async function listPngFrames(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await listPngFrames(target));
    else if (entry.name.endsWith(".png") && target.includes(`${path.sep}frames${path.sep}`)) output.push(target);
  }
  return output;
}

function cleanTransparentEdges(data, channels) {
  for (let index = 0; index < data.length; index += channels) {
    const alpha = data[index + 3];
    if (alpha < 24) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
      continue;
    }
    const hsv = rgbToHsv(data[index], data[index + 1], data[index + 2]);
    if (alpha < 190 && hsv.saturation > 0.58 && (hsv.hue < 18 || hsv.hue > 345 || (hsv.hue > 48 && hsv.hue < 75))) {
      data[index + 3] = Math.round(alpha * 0.62);
    }
  }
  return data;
}

async function normalizeFrame(filePath, reference) {
  const relativePath = path.relative(motionsRoot, filePath);
  const profile = profileFor(relativePath);
  const [bounds, stats] = await Promise.all([alphaBounds(filePath), furStats(filePath)]);
  const brightness = clamp(reference.value / Math.max(0.01, stats.value), 0.90, 1.10) * profile.grade.brightness;
  const saturation = clamp(reference.saturation / Math.max(0.01, stats.saturation), 0.86, 1.14) * profile.grade.saturation;
  const hue = clamp(reference.hue - stats.hue, -4, 4) + profile.grade.hue;
  const hueRotation = Math.round((hue + 360) % 360);
  const aspect = bounds.width / bounds.height;
  let targetWidth = profile.axis === "width" ? profile.extent : Math.round(profile.extent * aspect);
  let targetHeight = profile.axis === "height" ? profile.extent : Math.round(profile.extent / aspect);
  const fitScale = Math.min(1, (canvas.width - 28) / targetWidth, (canvas.groundY - 20) / targetHeight);
  targetWidth = Math.max(1, Math.round(targetWidth * fitScale));
  targetHeight = Math.max(1, Math.round(targetHeight * fitScale));
  const left = Math.round(clamp((canvas.width - targetWidth) / 2 + (profile.offsetX || 0), 0, canvas.width - targetWidth));
  const top = canvas.groundY - targetHeight;

  const subject = await sharp(filePath)
    .extract(bounds)
    .modulate({ brightness, saturation, hue: hueRotation })
    .resize(targetWidth, targetHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .png()
    .toBuffer();
  const { data, info } = await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: subject, left, top }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  cleanTransparentEdges(data, info.channels);
  const outputPath = filePath.replace(/\.png$/i, ".webp");
  await sharp(data, { raw: info })
    .webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(outputPath);
  return {
    file: relativePath.replaceAll("\\", "/"),
    source: { width: bounds.width, height: bounds.height },
    output: { width: targetWidth, height: targetHeight, left, top, groundY: canvas.groundY },
    correction: {
      brightness: Number(brightness.toFixed(4)),
      saturation: Number(saturation.toFixed(4)),
      hue: Number(hue.toFixed(3)),
    },
  };
}

const reference = await furStats(referencePath);
// Optional relative path lets newly generated frames be normalized without
// regenerating already approved playback assets.
const requestedFrame = process.argv[2]?.replaceAll("\\", "/");
const allFrames = (await listPngFrames(motionsRoot)).sort();
const frames = requestedFrame
  ? allFrames.filter((file) => path.relative(motionsRoot, file).replaceAll("\\", "/") === requestedFrame)
  : allFrames;
if (requestedFrame && frames.length !== 1) throw new Error(`Motion frame not found: ${requestedFrame}`);
const report = [];
for (const frame of frames) report.push(await normalizeFrame(frame, reference));

for (const motionName of requestedFrame ? [] : await fs.readdir(motionsRoot)) {
  const manifestPath = path.join(motionsRoot, motionName, "motion.json");
  try {
    const motion = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    motion.canvas = { width: canvas.width, height: canvas.height };
    await fs.writeFile(manifestPath, `${JSON.stringify(motion, null, 2)}\n`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

console.log(JSON.stringify({
  canvas,
  reference: {
    hue: Number(reference.hue.toFixed(3)),
    saturation: Number(reference.saturation.toFixed(4)),
    value: Number(reference.value.toFixed(4)),
  },
  frames: report,
}, null, 2));
