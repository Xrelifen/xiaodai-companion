import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPetLibrary } from "./pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "plugin.json",
  "mcp.json",
  "config/default-behavior.json",
  "assets/pets/小呆/pet.json",
  "assets/pets/15/pet.json",
  "assets/pets/牧牧/pet.json",
  "assets/app-icon.png",
  "dist/plugin/app.html",
  "src/plugin/server.mjs",
  "src/desktop/main.mjs",
];

for (const relativePath of requiredFiles) {
  await fs.access(path.join(root, relativePath));
}

const loadJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
const [plugin, config] = await Promise.all([
  loadJson("plugin.json"),
  loadJson("config/default-behavior.json"),
]);
const pets = await loadPetLibrary(root);

const interfaceConfig = plugin.extensions?.["com.openai"]?.interface;
assert.equal(plugin.name, "xiaodai-companion");
assert.ok(interfaceConfig?.shortDescription?.length <= 30, "shortDescription must be 30 characters or fewer");
assert.ok(["Other", "Entertainment"].includes(interfaceConfig?.category), "plugin category must be supported");
assert.ok(config.idleDelay.minMs >= 1000);
assert.ok(config.idleDelay.maxMs > config.idleDelay.minMs);
assert.ok(config.actions.length >= 6, "at least six randomized actions are required");
assert.ok(config.actions.every((action) => action.weight > 0 && action.cooldownMs >= 0));
assert.deepEqual(pets.map((pet) => pet.name), ["小呆", "15", "牧牧"]);
assert.equal(new Set(pets.map((pet) => pet.id)).size, 3);

const sprite = await fs.readFile(path.join(root, "assets", "pets", "小呆", "generated", "sprite-sheet.png"));
assert.equal(sprite.toString("ascii", 1, 4), "PNG");
assert.equal(sprite.readUInt32BE(16), 1536, "sprite sheet must contain eight 192px columns");
assert.equal(sprite.readUInt32BE(20), 2288, "sprite sheet must contain eleven 208px rows");

const bundled = await fs.readFile(path.join(root, "dist", "plugin", "app.html"), "utf8");
assert.match(bundled, /data:image\/png;base64,/);
assert.doesNotMatch(bundled, /src="\.\/app\.js"/);
assert.doesNotMatch(bundled, /href="\.\/styles\.css"/);
console.log("Project validation passed.");
