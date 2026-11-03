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
  assert.deepEqual(motions.map((motion) => motion.fromPose), ["sit", "lie", "sit", "stand", "stand"]);
  assert.equal(motions[2].intent, "transition");
  assert.equal(motions[2].toPose, "lie");
  assert.deepEqual(motions.slice(3).map((motion) => motion.gait), ["walk", "run"]);
  assert.ok(motions.every((motion) => motion.neutralFrameUrl));
});
