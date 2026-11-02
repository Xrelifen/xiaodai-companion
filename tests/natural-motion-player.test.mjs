import assert from "node:assert/strict";
import test from "node:test";

await import("../src/core/natural-motion-player.js");
const { NaturalMotionPlayer, sampleDuration } = globalThis.XiaodaiMotion;

function fixture() {
  return {
    neutralFrameUrl: "neutral.png",
    idleGapMs: 0,
    transitionMs: 100,
    variants: [
      { id: "blink", weight: 1, cooldownMs: 0, frames: [{ url: "blink.png", durationMs: 10 }] },
      { id: "listen", weight: 1, cooldownMs: 0, frames: [{ url: "listen.png", durationMs: 10 }] },
    ],
  };
}

test("duration ranges are sampled rather than replayed at one fixed speed", () => {
  assert.equal(sampleDuration([100, 300], () => 0), 100);
  assert.equal(sampleDuration([100, 300], () => 0.5), 200);
  assert.equal(sampleDuration([100, 300], () => 1), 300);
});

test("natural idle avoids immediately repeating the same variant", () => {
  const player = new NaturalMotionPlayer(fixture(), { rng: () => 0, now: 0 });
  assert.equal(player.tick(0).variantId, "blink");
  player.tick(11);
  assert.equal(player.tick(12).variantId, "listen");
});

test("frame changes expose a short cross-fade instead of snapping", () => {
  const player = new NaturalMotionPlayer(fixture(), { rng: () => 0, now: 0 });
  const start = player.tick(0);
  assert.equal(start.previousUrl, "neutral.png");
  assert.equal(start.url, "blink.png");
  assert.equal(start.blend, 0);
  assert.ok(player.tick(5).blend > 0);
});
