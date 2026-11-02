import fs from "node:fs/promises";
import path from "node:path";

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadPetLibrary(root) {
  const petsRoot = path.join(root, "assets", "pets");
  const entries = await fs.readdir(petsRoot, { withFileTypes: true });
  const pets = [];

  for (const entry of entries.filter((item) => item.isDirectory())) {
    const folderPath = path.join(petsRoot, entry.name);
    const manifestPath = path.join(folderPath, "pet.json");
    if (!(await exists(manifestPath))) continue;
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const spritePath = path.join(folderPath, manifest.spriteSheet || "generated/sprite-sheet.png");
    const previewPath = path.join(folderPath, manifest.previewGif || "generated/preview.gif");
    const naturalMotionPath = manifest.naturalMotion ? path.join(folderPath, manifest.naturalMotion) : null;
    let naturalMotionData = null;
    if (naturalMotionPath && await exists(naturalMotionPath)) {
      const motion = JSON.parse(await fs.readFile(naturalMotionPath, "utf8"));
      const motionDirectory = path.dirname(naturalMotionPath);
      naturalMotionData = {
        ...motion,
        neutralFramePath: motion.neutralFrame ? path.join(motionDirectory, motion.neutralFrame) : null,
        variants: (motion.variants || []).map((variant) => ({
          ...variant,
          frames: (variant.frames || []).map((frame) => ({
            ...frame,
            framePath: path.join(motionDirectory, frame.file),
          })),
        })),
      };
    }
    pets.push({
      ...manifest,
      folder: entry.name,
      spritePath: await exists(spritePath) ? spritePath : null,
      previewPath: await exists(previewPath) ? previewPath : null,
      naturalMotionPath,
      naturalMotionData,
    });
  }

  pets.sort((a, b) => ["xiaodai", "fifteen", "mumu"].indexOf(a.id) - ["xiaodai", "fifteen", "mumu"].indexOf(b.id));
  const ids = new Set();
  for (const pet of pets) {
    if (!pet.id || !pet.name) throw new Error(`Invalid pet manifest in ${pet.folder}`);
    if (ids.has(pet.id)) throw new Error(`Duplicate pet id: ${pet.id}`);
    ids.add(pet.id);
  }
  return pets;
}

export async function serializeNaturalMotion(pet, resolveFrameUrl) {
  if (!pet.naturalMotionData) return null;
  const {
    neutralFramePath,
    variants,
    ...motion
  } = pet.naturalMotionData;
  return {
    ...motion,
    neutralFrameUrl: neutralFramePath ? await resolveFrameUrl(neutralFramePath) : null,
    variants: await Promise.all(variants.map(async (variant) => ({
      ...variant,
      frames: await Promise.all(variant.frames.map(async ({ framePath, ...frame }) => ({
        ...frame,
        url: await resolveFrameUrl(framePath),
      }))),
    }))),
  };
}

export function publicPet(pet, options = {}) {
  const { spriteUrl = null, naturalMotion = null } = options;
  const {
    spritePath: _spritePath,
    previewPath: _previewPath,
    naturalMotionPath: _naturalMotionPath,
    naturalMotionData: _naturalMotionData,
    naturalMotion: _naturalMotionManifestPath,
    ...manifest
  } = pet;
  return { ...manifest, spriteUrl, naturalMotion };
}
