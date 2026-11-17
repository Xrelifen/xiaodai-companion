import assert from "node:assert/strict";
import test from "node:test";
import { createNativeDragState, sampleNativeDrag } from "../src/desktop/drag-controller.mjs";

test("a held stationary cursor cannot move or enlarge the desktop pet", () => {
  const bounds = { x: 120, y: 80, width: 360, height: 390 };
  const cursor = { x: 640, y: 400 };
  const state = createNativeDragState(bounds, cursor, 0);

  for (let now = 16; now <= 120_000; now += 16) {
    const sample = sampleNativeDrag(state, cursor, now);
    assert.equal(sample.x, bounds.x);
    assert.equal(sample.y, bounds.y);
    assert.equal(sample.dx, 0);
    assert.equal(sample.dy, 0);
  }

  assert.deepEqual(state.bounds, bounds);
});

test("native dragging follows only the operating system cursor delta", () => {
  const state = createNativeDragState(
    { x: 120, y: 80, width: 360, height: 390 },
    { x: 640, y: 400 },
    0,
  );
  const moved = sampleNativeDrag(state, { x: 670, y: 412 }, 20);
  assert.equal(moved.x, 150);
  assert.equal(moved.y, 92);
  assert.equal(moved.dx, 30);
  assert.equal(moved.dy, 12);

  const held = sampleNativeDrag(state, { x: 670, y: 412 }, 40);
  assert.equal(held.x, 150);
  assert.equal(held.y, 92);
  assert.equal(held.dx, 0);
  assert.equal(held.dy, 0);
});
