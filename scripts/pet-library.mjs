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
    const motionReferences = Array.isArray(manifest.naturalMotions)
      ? manifest.naturalMotions
      : (manifest.naturalMotion ? [manifest.naturalMotion] : []);
    const naturalMotionPaths = motionReferences.map((reference) => path.join(folderPath, reference));
    const naturalMotionData = [];
    for (const naturalMotionPath of naturalMotionPaths) {
      if (!(await exists(naturalMotionPath))) continue;
      const motion = JSON.parse(await fs.readFile(naturalMotionPath, "utf8"));
      const motionDirectory = path.dirname(naturalMotionPath);
      naturalMotionData.push({
        ...motion,
        neutralFramePath: motion.neutralFrame ? path.join(motionDirectory, motion.neutralFrame) : null,
        variants: (motion.variants || []).map((variant) => ({
          ...variant,
          frames: (variant.frames || []).map((frame) => ({
            ...frame,
            framePath: path.join(motionDirectory, frame.file),
          })),
        })),
      });
    }
    pets.push({
      ...manifest,
      folder: entry.name,
      spritePath: await exists(spritePath) ? spritePath : null,
      previewPath: await exists(previewPath) ? previewPath : null,
      naturalMotionPaths,
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

async function serializeMotion(motionData, resolveFrameUrl) {
  const {
    neutralFramePath,
    variants,
    ...motion
  } = motionData;
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

export async function serializeNaturalMotions(pet, resolveFrameUrl) {
  return Promise.all((pet.naturalMotionData || []).map((motion) => serializeMotion(motion, resolveFrameUrl)));
}

export async function serializeNaturalMotion(pet, resolveFrameUrl) {
  const motions = await serializeNaturalMotions(pet, resolveFrameUrl);
  return motions[0] || null;
}

export function publicPet(pet, options = {}) {
  const { spriteUrl = null, naturalMotion = null, naturalMotions = naturalMotion ? [naturalMotion] : [] } = options;
  const {
    spritePath: _spritePath,
    previewPath: _previewPath,
    naturalMotionPaths: _naturalMotionPaths,
    naturalMotionData: _naturalMotionData,
    naturalMotion: _naturalMotionManifestPath,
    naturalMotions: _naturalMotionsManifestPaths,
    ...manifest
  } = pet;
  return { ...manifest, spriteUrl, naturalMotion: naturalMotions[0] || null, naturalMotions };
}
