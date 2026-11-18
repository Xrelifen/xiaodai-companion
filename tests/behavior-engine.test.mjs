import assert from "node:assert/strict";
import test from "node:test";

await import("../src/core/behavior-engine.js");
const {
  BehaviorEngine,
  SEQUENCES,
  frameAt,
  lookFrameForAngle,
  pointerVelocity,
  roamPlaybackRate,
  smoothAngle,
  stableDragDirection,
} = globalThis.XiaodaiCore;

test("roaming foot speed rises and falls with the window's eased motion", () => {
  const distance = 600, duration = 10_000;
  const start = roamPlaybackRate(distance, duration, 0);
  const quarter = roamPlaybackRate(distance, duration, 2500);
  const middle = roamPlaybackRate(distance, duration, 5000);
  const end = roamPlaybackRate(distance, duration, 10000);
  assert.ok(start < quarter && quarter < middle);
  assert.equal(roamPlaybackRate(distance, duration, 7500), quarter);
  assert.equal(start, end);
});

test("per-frame timing keeps slow head turns visible", () => {
  const sequence = SEQUENCES.lookAround;
  assert.deepEqual(frameAt(sequence, 0), { row: 9, column: 2, duration: 520, index: 0, progress: 0 });
  assert.equal(frameAt(sequence, 600).column, 4);
  assert.equal(frameAt(sequence, 1200).column, 4);
});

test("random actions avoid an immediate repeat", () => {
  const engine = new BehaviorEngine({ rng: () => 0, now: 0 });
  const first = engine.triggerRandomAction(20_000);
  const second = engine.triggerRandomAction(50_000);
  assert.notEqual(first.id, second.id);
});

test("drag speed selects walking or running playback", () => {
  const engine = new BehaviorEngine({ now: 0 });
  assert.equal(engine.setDragState("right", 120, 10).gait, "walk");
  assert.equal(engine.setDragState("left", 600, 20).gait, "run");
  assert.equal(engine.setDragState("left", 330, 800).gait, "run");
  assert.equal(engine.setDragState("left", 180, 900).gait, "run");
  assert.equal(engine.setDragState("left", 180, 1_100).gait, "walk");
  assert.equal(engine.setDragState("left", 450, 2_200).gait, "walk");
  assert.equal(engine.setDragState("left", 520, 2_300).gait, "run");
  assert.equal(engine.current.name, "walkLeft");
});

test("desktop dragging uses stable screen coordinates instead of the moving window", () => {
  const previous = { x: 100, y: 100, screenX: 800, screenY: 500, time: 0 };
  const current = { x: 91, y: 100, screenX: 810, screenY: 500, time: 20 };
  const velocity = pointerVelocity(current, previous);
  assert.equal(velocity.dx, 10);
  assert.equal(velocity.speed, 500);
  assert.equal(stableDragDirection("right", -0.5), "right");
  assert.equal(stableDragDirection("right", -4), "left");
});

test("look direction has sixteen stable sectors and smoothing", () => {
  const sectors = new Set();
  for (let index = 0; index < 16; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 16);
    sectors.add(lookFrameForAngle(angle).directionIndex);
  }
  assert.equal(sectors.size, 16);
  assert.ok(smoothAngle(0, Math.PI / 2, 0.1) < Math.PI / 2);
});

test("getting up reverses the lying transition before returning to idle", () => {
  assert.deepEqual(SEQUENCES.getUp.columns, [5, 4, 3, 2, 1, 0]);
  const engine = new BehaviorEngine({ now: 0 });
  engine.trigger("getUp", 0);
  engine.tick(10_000);
  assert.equal(engine.current.name, "idle");
});

test("a longer natural pose transition can finish before returning to idle", () => {
  const engine = new BehaviorEngine({ now: 0 });
  engine.trigger("lieDown", 0);
  engine.tick(5000, { holdSequence: true });
  assert.equal(engine.current.name, "lieDown");
  engine.tick(6000, { holdSequence: false });
  assert.equal(engine.current.name, "idle");
});
