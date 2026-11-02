import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPetLibrary, publicPet } from "./pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pets = await loadPetLibrary(root);
const catalog = pets.map((pet) => publicPet(pet, {
  spriteUrl: pet.spritePath ? pathToFileURL(pet.spritePath).href : null,
}));
const source = `globalThis.XIAODAI_PET_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
await fs.writeFile(path.join(root, "src", "ui", "pet-catalog.generated.js"), source, "utf8");
console.log(`Synced ${pets.length} pet manifests.`);
