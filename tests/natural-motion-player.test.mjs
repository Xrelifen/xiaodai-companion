import assert from "node:assert/strict";
import test from "node:test";

await import("../src/core/natural-motion-player.js");
const {
  NaturalMotionPlayer,
  NaturalSequencePlayer,
  NaturalCyclePlayer,
  NaturalStopPlayer,
  sampleDuration,
  chooseSequenceVariant,
} = globalThis.XiaodaiMotion;

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

test("stop variants use weights and avoid an immediate repeat when alternatives exist", () => {
  const motion = { variants: [
    { id: "quiet", weight: 3, frames: [{ url: "a", durationMs: 1 }] },
    { id: "tail", weight: 4, frames: [{ url: "b", durationMs: 1 }] },
    { id: "tail-and-ear", weight: 2, frames: [{ url: "c", durationMs: 1 }] },
  ] };
  assert.equal(chooseSequenceVariant(motion, null, () => 0).id, "quiet");
  assert.equal(chooseSequenceVariant(motion, null, () => 0.99).id, "tail-and-ear");
  assert.equal(chooseSequenceVariant(motion, "tail-and-ear", () => 0.99).id, "tail");
  assert.equal(chooseSequenceVariant({ variants: [motion.variants[0]] }, "quiet", () => 0).id, "quiet");
});

test("a subtle interaction can request a specific natural variant", () => {
  const player = new NaturalMotionPlayer(fixture(), { now: 0, rng: () => 0 });
  const reaction = player.startVariantById("listen", 100);
  assert.equal(reaction.id, "listen");
  assert.equal(player.variant.id, "listen");
  assert.equal(player.frameIndex, 0);
});

test("frame changes expose a short cross-fade instead of snapping", () => {
  const player = new NaturalMotionPlayer(fixture(), { rng: () => 0, now: 0 });
  const start = player.tick(0);
  assert.equal(start.previousUrl, "neutral.png");
  assert.equal(start.url, "blink.png");
  assert.equal(start.blend, 0);
  assert.ok(player.tick(5).blend > 0);
});

test("idle transition retains the previous facing until a new idle frame starts", () => {
  const motion = { ...fixture(), idleGapMs: [1000, 1000] };
  const player = new NaturalMotionPlayer(motion, { rng: () => 0, now: 0 });
  player.previousUrl = "walking.png";
  player.previousMirror = true;
  player.transitionStartedAt = 0;
  assert.equal(player.tick(50).previousMirror, true);
  player.startVariantById("blink", 1000);
  assert.equal(player.tick(1000).previousMirror, false);
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

test("settling blends from the last walking frame and completes its head turn", () => {
  const motion = { transitionMs: 100, displayScale: 0.89, variants: [{ frames: [
    { url: "standing", durationMs: 400 }, { url: "look-half", durationMs: 350 },
  ] }] };
  const player = new NaturalSequencePlayer(motion, { now: 0, previousUrl: "walking", previousDisplayScale: 0.8 });
  const start = player.tick(0);
  assert.equal(start.previousUrl, "walking");
  assert.equal(start.previousDisplayScale, 0.8);
  assert.equal(player.tick(450).url, "look-half");
  assert.equal(player.tick(750).complete, true);
});

test("a turning sequence preserves each layer's direction, including mirrored copies of one image", () => {
  const motion = { transitionMs: 20, variants: [{ frames: [
    { url: "front", durationMs: 100, mirror: false },
    { url: "front", durationMs: 100, mirror: true },
  ] }] };
  const player = new NaturalSequencePlayer(motion, { now: 0, previousUrl: "walking", previousMirror: true });
  const start = player.tick(0);
  assert.equal(start.previousMirror, true);
  assert.equal(start.mirror, false);
  const turning = player.tick(110);
  assert.equal(turning.previousMirror, false);
  assert.equal(turning.mirror, true);
  assert.equal(turning.previousUrl, "front");
  assert.ok(turning.blend > 0 && turning.blend < 1);
});

test("a posture sequence retains both image anchors while crossing frames", () => {
  const motion = { transitionMs: 60, variants: [{ frames: [
    { url: "a", anchorX: 0.7, durationMs: 100 },
    { url: "b", anchorX: 0.4, durationMs: 100 },
  ] }] };
  const player = new NaturalSequencePlayer(motion, { now: 0, previousUrl: "sit", previousAnchorX: 0.8 });
  assert.equal(player.tick(0).previousAnchorX, 0.8);
  const next = player.tick(120);
  assert.equal(next.previousAnchorX, 0.7);
  assert.equal(next.anchorX, 0.4);
});

test("locomotion cycles preserve phase while playback speed changes", () => {
  const motion = {
    transitionMs: 20,
    variants: [{
      frames: [
        { url: "a.png", durationMs: 100 },
        { url: "b.png", durationMs: 100 },
      ],
    }],
  };
  const player = new NaturalCyclePlayer(motion, { now: 0 });
  assert.equal(player.tick(50, { playbackRate: 1 }).url, "a.png");
  assert.equal(player.tick(80, { playbackRate: 2 }).url, "b.png");
  assert.equal(player.tick(130, { playbackRate: 2 }).url, "a.png");
});

test("fast short steps finish fading while the current frame is still visible", () => {
  const motion = { transitionMs: 76, variants: [{ frames: [
    { url: "a", durationMs: 100 }, { url: "b", durationMs: 100 },
  ] }] };
  const player = new NaturalCyclePlayer(motion, { now: 0 });
  assert.equal(player.tick(50, { playbackRate: 2 }).url, "b");
  const midpoint = player.tick(75, { playbackRate: 2 });
  assert.equal(midpoint.url, "b");
  assert.equal(midpoint.blend, 1);
  assert.equal(midpoint.previousUrl, null);
});

test("a delayed tick blends from the last displayed pose, skipping unseen frames", () => {
  const motion = { transitionMs: 40, variants: [{ frames: [
    { url: "a", durationMs: 100, displayScale: 1.2 }, { url: "b", durationMs: 100, displayScale: 1.1 }, { url: "c", durationMs: 100 },
  ] }] };
  const player = new NaturalCyclePlayer(motion, { now: 0 });
  const late = player.tick(220);
  assert.equal(late.url, "c");
  assert.equal(late.previousUrl, "a");
  assert.equal(late.previousDisplayScale, 1.2);
  assert.ok(late.blend > 0.45 && late.blend < 0.55);
  assert.equal(player.tick(240).blend, 1);
});

test("switching gait starts at the corresponding position in the new cycle", () => {
  const walk = { variants: [{ frames: [{ url: "walk-a", durationMs: 100 }, { url: "walk-b", durationMs: 100 }] }] };
  const run = { variants: [{ frames: [{ url: "run-a", durationMs: 50 }, { url: "run-b", durationMs: 50 }] }] };
  const walker = new NaturalCyclePlayer(walk, { now: 0 });
  walker.tick(150);
  const runner = new NaturalCyclePlayer(run, { now: 150, initialPhase: walker.getPhase(), previousUrl: "walk-b" });
  assert.equal(runner.tick(150).url, "run-b");
  assert.equal(runner.tick(175).url, "run-a");
});

test("gait entry chooses the nearest permitted contact phase, including cycle wraparound", () => {
  const walk = { variants: [{ frames: Array.from({ length: 4 }, (_, index) => ({ url: `step-${index}`, durationMs: 100 })) }] };
  const choose = (phase) => new NaturalCyclePlayer(walk, { now: 0, initialPhase: phase, entryFrames: [0, 2] }).tick(0).url;
  assert.equal(choose(0.10), "step-0");
  assert.equal(choose(0.47), "step-2");
  assert.equal(choose(0.94), "step-0");
});

test("gait changes wait for a configured contact frame and enter at the target contact", () => {
  const walk = { gaitSwitchFrames: [1], variants: [{ frames: [{ url: "walk-a", durationMs: 100 }, { url: "walk-b", durationMs: 100 }] }] };
  const run = { gaitEntryFrame: 1, variants: [{ frames: [{ url: "run-a", durationMs: 60 }, { url: "run-b", durationMs: 40 }] }] };
  const walker = new NaturalCyclePlayer(walk, { now: 0 });
  assert.equal(walker.canSwitchGait(), false);
  walker.tick(110);
  assert.equal(walker.canSwitchGait(), true);
  const runner = new NaturalCyclePlayer(run, { now: 110, entryFrame: run.gaitEntryFrame });
  assert.equal(runner.tick(110).url, "run-b");
});

test("stopping keeps the current cycle until a contact frame and bounds the delay", () => {
  const motion = { gaitSwitchFrames: [1], variants: [{ frames: [
    { url: "airborne", durationMs: 100 }, { url: "contact", durationMs: 100 },
  ] }] };
  const cycle = new NaturalCyclePlayer(motion, { now: 0 });
  const stop = new NaturalStopPlayer(cycle, 0, { playbackRate: 1, maximumMs: 300 });
  assert.equal(stop.tick(0).complete, false);
  stop.tick(60);
  stop.tick(120);
  const landed = stop.tick(180);
  assert.equal(landed.url, "contact");
  assert.equal(landed.complete, true);

  const neverContact = new NaturalCyclePlayer({ ...motion, gaitSwitchFrames: [99] }, { now: 0 });
  const fallback = new NaturalStopPlayer(neverContact, 0, { maximumMs: 100 });
  assert.equal(fallback.tick(99).complete, false);
  assert.equal(fallback.tick(100).complete, true);
});

test("a stationary held drag freezes the current locomotion frame", () => {
  const motion = {
    transitionMs: 20,
    variants: [{
      frames: [
        { url: "a.png", durationMs: 100 },
        { url: "b.png", durationMs: 100 },
      ],
    }],
  };
  const player = new NaturalCyclePlayer(motion, { now: 0 });
  assert.equal(player.tick(120, { playbackRate: 1 }).url, "b.png");
  const held = player.tick(5_000, { playbackRate: 1, paused: true });
  assert.equal(held.url, "b.png");
  assert.equal(held.previousUrl, null);
  assert.equal(player.tick(5_050, { playbackRate: 1 }).url, "b.png");
  assert.equal(player.tick(5_100, { playbackRate: 1 }).url, "a.png");
});

test("locomotion frames expose per-frame display scale without accumulating it", () => {
  const motion = {
    transitionMs: 20,
    variants: [{
      frames: [
        { url: "a.png", durationMs: 100, displayScale: 0.9 },
        { url: "b.png", durationMs: 100, displayScale: 0.85 },
      ],
    }],
  };
  const player = new NaturalCyclePlayer(motion, { now: 0 });
  assert.equal(player.tick(0).displayScale, 0.9);
  assert.equal(player.tick(101).displayScale, 0.85);
  assert.equal(player.tick(201).displayScale, 0.9);
});

test("a motion-level display scale never drifts during a long drag", () => {
  const motion = {
    displayScale: 0.89,
    transitionMs: 20,
    variants: [{
      frames: [
        { url: "a.png", durationMs: 80 },
        { url: "b.png", durationMs: 120 },
        { url: "c.png", durationMs: 100 },
      ],
    }],
  };
  const player = new NaturalCyclePlayer(motion, { now: 0 });
  for (let now = 0; now <= 120_000; now += 137) {
    assert.equal(player.tick(now, { playbackRate: now % 2000 < 1000 ? 0.65 : 1.8 }).displayScale, 0.89);
  }
});
