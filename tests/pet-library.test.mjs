import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadPetLibrary, serializeNaturalMotions } from "../scripts/pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Xiaodai exposes separate seated and lying natural motion packs", async () => {
  const pets = await loadPetLibrary(root);
  const xiaodai = pets.find((pet) => pet.id === "xiaodai");
  const motions = await serializeNaturalMotions(xiaodai, async (framePath) => framePath);
  assert.deepEqual(motions.map((motion) => motion.fromPose), ["sit", "lie"]);
  assert.ok(motions.every((motion) => motion.neutralFrameUrl));
});
