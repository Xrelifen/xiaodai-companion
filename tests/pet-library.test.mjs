import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadPetLibrary, serializeNaturalMotions } from "../scripts/pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Xiaodai exposes idle, transition, and locomotion motion packs", async () => {
  const pets = await loadPetLibrary(root);
  const xiaodai = pets.find((pet) => pet.id === "xiaodai");
  const motions = await serializeNaturalMotions(xiaodai, async (framePath) => framePath);
  assert.deepEqual(motions.filter((motion) => motion.intent === "idle").map((motion) => motion.fromPose), ["sit", "lie"]);
  assert.ok(motions.some((motion) => motion.intent === "transition" && motion.fromPose === "sit" && motion.toPose === "lie"));
  assert.deepEqual(motions.filter((motion) => motion.intent === "locomotion").map((motion) => motion.gait), ["walk", "run"]);
  assert.ok(motions.some((motion) => motion.intent === "settle" && motion.neutralFrameUrl));
  const turn = motions.find((motion) => motion.intent === "turn");
  assert.ok(turn, "turning poses must be available to the renderer");
  assert.equal(turn.variants[0].frames.length, 4);
  assert.ok(turn.variants[0].frames.every((frame) => frame.url && frame.durationMs > 0));
  const firstStep = motions.find((motion) => motion.intent === "startStep");
  assert.ok(firstStep?.variants?.[0]?.frames?.[0]?.url, "first-step transition must load an image");
  assert.ok(motions.every((motion) => motion.neutralFrameUrl));
});
