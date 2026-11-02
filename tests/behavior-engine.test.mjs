import assert from "node:assert/strict";
import test from "node:test";

await import("../src/core/behavior-engine.js");
const { BehaviorEngine, SEQUENCES, frameAt, lookFrameForAngle, smoothAngle } = globalThis.XiaodaiCore;

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
  assert.equal(engine.current.name, "walkLeft");
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
