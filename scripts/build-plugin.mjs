import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPetLibrary, publicPet, serializeNaturalMotion } from "./pet-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath, encoding = "utf8") => fs.readFile(path.join(root, relativePath), encoding);

const [html, css, core, motionCore, app, pets] = await Promise.all([
  read("src/ui/index.html"),
  read("src/ui/styles.css"),
  read("src/core/behavior-engine.js"),
  read("src/core/natural-motion-player.js"),
  read("src/ui/app.js"),
  loadPetLibrary(root),
]);

const escapeScript = (source) => source.replaceAll("</script", "<\\/script");
const embeddedFrameCache = new Map();
const embeddedFrameSources = new Map();
async function embedFrame(framePath) {
  if (!embeddedFrameCache.has(framePath)) {
    const frame = await fs.readFile(framePath);
    const token = `motion-frame-${embeddedFrameCache.size}`;
    embeddedFrameCache.set(framePath, token);
    embeddedFrameSources.set(token, `data:image/png;base64,${frame.toString("base64")}`);
  }
  return embeddedFrameCache.get(framePath);
}
const catalog = await Promise.all(pets.map(async (pet) => {
  let spriteUrl = null;
  if (pet.spritePath) {
    const sprite = await fs.readFile(pet.spritePath);
    spriteUrl = `data:image/png;base64,${sprite.toString("base64")}`;
  }
  const naturalMotion = await serializeNaturalMotion(pet, embedFrame);
  return publicPet(pet, { spriteUrl, naturalMotion });
}));
const catalogSource = [
  `globalThis.XIAODAI_MOTION_ASSETS = ${JSON.stringify(Object.fromEntries(embeddedFrameSources))};`,
  `globalThis.XIAODAI_PET_CATALOG = ${JSON.stringify(catalog)};`,
].join("\n");

let bundled = html
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${css}\n</style>`)
  .replace('<script src="../core/behavior-engine.js"></script>', `<script>\n${escapeScript(core)}\n</script>`)
  .replace('<script src="../core/natural-motion-player.js"></script>', `<script>\n${escapeScript(motionCore)}\n</script>`)
  .replace('<script src="./pet-catalog.generated.js"></script>', `<script>\n${catalogSource}\n</script>`)
  .replace('<script src="./app.js"></script>', `<script>\n${escapeScript(app)}\n</script>`);

bundled = bundled.replace("</head>", "  <meta name=\"xiaodai-build\" content=\"0.1.0\" />\n  </head>");

const outputDirectory = path.join(root, "dist", "plugin");
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(path.join(outputDirectory, "app.html"), bundled, "utf8");
console.log(`Built dist/plugin/app.html (${Math.round(Buffer.byteLength(bundled) / 1024)} KiB)`);
