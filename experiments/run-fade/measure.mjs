import { readFile } from 'node:fs/promises';
import '../../src/core/natural-motion-player.js';

const motion = JSON.parse(await readFile(new URL('../../assets/pets/小呆/generated/motions/run-cycle-v1/motion.json', import.meta.url), 'utf8'));
for (const variant of motion.variants) for (const frame of variant.frames) frame.url = frame.file;
for (const hz of [60, 144]) {
  for (const transitionMs of [motion.transitionMs, 12]) {
    const player = new globalThis.XiaodaiMotion.NaturalCyclePlayer({ ...motion, transitionMs }, { now: 0 });
    let overlapping = 0;
    const samples = hz * 10;
    for (let i = 1; i <= samples; i++) {
      const frame = player.tick(i * 1000 / hz, { playbackRate: 1.5 });
      if (frame.previousUrl && frame.blend > 0.15 && frame.blend < 0.85) overlapping++;
    }
    console.log(`${hz} Hz, maximum fade ${transitionMs} ms: ${overlapping}/${samples} samples (${(100 * overlapping / samples).toFixed(1)}%)`);
  }
}
