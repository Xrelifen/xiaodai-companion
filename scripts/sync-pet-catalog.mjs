import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPetLibrary, publicPet, serializeNaturalMotion } from "./pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiRoot = path.join(root, "src", "ui");
const relativeAssetUrl = (assetPath) => path.relative(uiRoot, assetPath)
  .split(path.sep)
  .map((part) => encodeURIComponent(part))
  .join("/");
const pets = await loadPetLibrary(root);
const catalog = await Promise.all(pets.map(async (pet) => publicPet(pet, {
  spriteUrl: pet.spritePath ? relativeAssetUrl(pet.spritePath) : null,
  naturalMotion: await serializeNaturalMotion(pet, async (framePath) => relativeAssetUrl(framePath)),
})));
const source = `globalThis.XIAODAI_PET_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
await fs.writeFile(path.join(root, "src", "ui", "pet-catalog.generated.js"), source, "utf8");
console.log(`Synced ${pets.length} pet manifests.`);
