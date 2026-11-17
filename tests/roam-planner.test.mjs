import assert from "node:assert/strict";
import test from "node:test";
import { planRoam } from "../src/desktop/roam-planner.mjs";

const area = { x: 0, y: 0, width: 1920, height: 1080 };

test("autonomous roaming turns away from a nearby display edge", () => {
  const plan = planRoam(
    { x: 0, y: 500, width: 360, height: 390 },
    area,
    { direction: "left", distance: 500, duration: 10000 },
  );
  assert.equal(plan.direction, "right");
  assert.ok(plan.dx > 0);
});

test("edge-clamped roaming shortens its duration with its route", () => {
  const plan = planRoam(
    { x: 1400, y: 500, width: 360, height: 390 },
    area,
    { direction: "right", distance: 500, duration: 10000 },
  );
  assert.equal(plan.distance, 160);
  assert.equal(plan.duration, 3200);
});

test("roaming stays idle when neither direction has useful space", () => {
  const plan = planRoam(
    { x: 0, y: 0, width: 360, height: 390 },
    { x: 0, y: 0, width: 380, height: 390 },
    { direction: "right", distance: 300, duration: 8000, minimumDistance: 36 },
  );
  assert.deepEqual(plan, { direction: null, dx: 0, distance: 0, duration: 0 });
});
