import assert from "node:assert/strict";
import test from "node:test";

await import("../src/core/natural-motion-player.js");
const { NaturalMotionPlayer, NaturalSequencePlayer, sampleDuration } = globalThis.XiaodaiMotion;

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

test("pose transitions can play forward and reverse with the same frames", () => {
  const motion = {
    transitionMs: 100,
    variants: [{
      id: "sit-to-lie",
      frames: [
        { url: "sit.png", durationMs: 10 },
        { url: "middle.png", durationMs: 10 },
        { url: "lie.png", durationMs: 10 },
      ],
    }],
  };
  const forward = new NaturalSequencePlayer(motion, { now: 0 });
  assert.equal(forward.tick(0).url, "sit.png");
  assert.equal(forward.tick(21).url, "lie.png");
  assert.equal(forward.tick(31).complete, true);

  const reverse = new NaturalSequencePlayer(motion, { now: 0, reverse: true });
  assert.equal(reverse.tick(0).url, "lie.png");
  assert.equal(reverse.tick(21).url, "sit.png");
});
