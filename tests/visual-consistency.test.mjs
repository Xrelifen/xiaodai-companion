import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const motionsRoot = path.resolve("assets", "pets", "小呆", "generated", "motions");
const motionNames = ["sit-idle-v1", "lie-idle-v1", "sit-to-lie-v1", "walk-cycle-v1", "run-cycle-v1"];

async function alphaBottom(filePath, threshold = 64) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] >= threshold) bottom = y;
    }
  }
  return { bottom, width: info.width, height: info.height };
}

function rgbToHsv(r, g, b) {
  const channels = [r / 255, g / 255, b / 255];
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === channels[0]) hue = 60 * (((channels[1] - channels[2]) / delta) % 6);
    else if (max === channels[1]) hue = 60 * ((channels[2] - channels[0]) / delta + 2);
    else hue = 60 * ((channels[0] - channels[1]) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { hue, saturation: max ? delta / max : 0, value: max };
}

async function furAppearance(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  let saturation = 0;
  let value = 0;
  for (let index = 0; index < data.length; index += info.channels) {
    if (data[index + 3] < 160) continue;
    const hsv = rgbToHsv(data[index], data[index + 1], data[index + 2]);
    if (hsv.hue < 8 || hsv.hue > 48 || hsv.saturation < 0.12 || hsv.value < 0.22) continue;
    saturation += hsv.saturation;
    value += hsv.value;
    count += 1;
  }
  return { saturation: saturation / count, value: value / count };
}

async function runtimeFrames() {
  const frames = new Set();
  for (const motionName of motionNames) {
    const manifestPath = path.join(motionsRoot, motionName, "motion.json");
    const motion = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const variant of motion.variants || []) {
      for (const frame of variant.frames || []) {
        frames.add(path.resolve(path.dirname(manifestPath), frame.file));
      }
    }
  }
  return [...frames];
}

test("all natural motion frames share one stable canvas and ground line", async () => {
  const frames = await runtimeFrames();
  assert.ok(frames.length >= 20);
  for (const frame of frames) {
    const bounds = await alphaBottom(frame);
    assert.equal(bounds.width, 1280, frame);
    assert.equal(bounds.height, 1354, frame);
    assert.ok(bounds.bottom >= 1316 && bounds.bottom <= 1321, `${frame}: bottom ${bounds.bottom}`);
  }
});

test("legacy sprite actions are excluded when natural motions are available", async () => {
  const source = await readFile(new URL("../src/ui/app.js", import.meta.url), "utf8");
  assert.match(source, /naturalMotions\.length \? naturalOnlyActions/);
  assert.match(source, /action\.sequence === "lieDown"/);
});

test("fur brightness and saturation stay inside one photographic grade", async () => {
  for (const frame of await runtimeFrames()) {
    const appearance = await furAppearance(frame);
    assert.ok(appearance.value >= 0.68 && appearance.value <= 0.79, `${frame}: value ${appearance.value}`);
    assert.ok(appearance.saturation >= 0.31 && appearance.saturation <= 0.44, `${frame}: saturation ${appearance.saturation}`);
  }
});
