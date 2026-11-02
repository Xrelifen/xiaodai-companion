import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const motionUrl = new URL("../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/motion.json", import.meta.url);

function pngMetadata(buffer) {
  const signature = "89504e470d0a1a0a";
  assert.equal(buffer.subarray(0, 8).toString("hex"), signature);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

test("sit idle motion references valid transparent PNG frames", async () => {
  const motion = JSON.parse(await readFile(motionUrl, "utf8"));
  assert.equal(motion.fromPose, "sit");
  assert.equal(motion.toPose, "sit");
  assert.ok(motion.variants.length >= 4);

  const files = new Set(motion.variants.flatMap((variant) => variant.frames.map((frame) => frame.file)));
  assert.equal(files.size, 8);
  assert.ok(motion.neutralFrame);
  assert.ok(Array.isArray(motion.idleGapMs));
  assert.ok(motion.transitionMs >= 90 && motion.transitionMs <= 180);

  for (const file of files) {
    const url = new URL(file, motionUrl);
    await access(url);
    const metadata = pngMetadata(await readFile(url));
    assert.deepEqual(
      { width: metadata.width, height: metadata.height },
      motion.canvas,
      `${file} must match the motion canvas`,
    );
    assert.ok([4, 6].includes(metadata.colorType), `${file} must contain an alpha channel`);
  }
});
