import assert from "node:assert/strict";
import test from "node:test";

await import("../src/core/crossfade.js");
const { anchorOffsets } = globalThis.XiaodaiCrossfade;

test("posture crossfade moves both anchors together without shifting either endpoint", () => {
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const offsets = anchorOffsets(100, 200, progress);
    assert.equal(100 + offsets.previous, 200 + offsets.current);
    assert.equal(100 + offsets.previous, 100 + 100 * progress);
  }
  assert.equal(anchorOffsets(100, 200, 0).previous, 0);
  assert.equal(Math.abs(anchorOffsets(100, 200, 1).current), 0);
  assert.deepEqual(anchorOffsets(undefined, 200, 0.5), { previous: 0, current: 0 });
});
