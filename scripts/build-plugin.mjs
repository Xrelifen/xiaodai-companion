import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPetLibrary, publicPet } from "./pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath, encoding = "utf8") => fs.readFile(path.join(root, relativePath), encoding);

const [html, css, core, app, pets] = await Promise.all([
  read("src/ui/index.html"),
  read("src/ui/styles.css"),
  read("src/core/behavior-engine.js"),
  read("src/ui/app.js"),
  loadPetLibrary(root),
]);

const escapeScript = (source) => source.replaceAll("</script", "<\\/script");
const catalog = await Promise.all(pets.map(async (pet) => {
  let spriteUrl = null;
  if (pet.spritePath) {
    const sprite = await fs.readFile(pet.spritePath);
    spriteUrl = `data:image/png;base64,${sprite.toString("base64")}`;
  }
  return publicPet(pet, { spriteUrl });
}));
const catalogSource = `globalThis.XIAODAI_PET_CATALOG = ${JSON.stringify(catalog)};`;

let bundled = html
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${css}\n</style>`)
  .replace('<script src="../core/behavior-engine.js"></script>', `<script>\n${escapeScript(core)}\n</script>`)
  .replace('<script src="./pet-catalog.generated.js"></script>', `<script>\n${catalogSource}\n</script>`)
  .replace('<script src="./app.js"></script>', `<script>\n${escapeScript(app)}\n</script>`);

bundled = bundled.replace("</head>", "  <meta name=\"xiaodai-build\" content=\"0.1.0\" />\n  </head>");

const outputDirectory = path.join(root, "dist", "plugin");
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(path.join(outputDirectory, "app.html"), bundled, "utf8");
console.log(`Built dist/plugin/app.html (${Math.round(Buffer.byteLength(bundled) / 1024)} KiB)`);
