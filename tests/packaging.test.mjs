import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("desktop package excludes reference photos", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.build.files.includes("!assets/pets/*/source/**/*"));
});

test("sandboxed desktop bridge uses a CommonJS preload", async () => {
  const main = await readFile(new URL("../src/desktop/main.mjs", import.meta.url), "utf8");
  const preload = await readFile(new URL("../src/desktop/preload.cjs", import.meta.url), "utf8");
  assert.match(main, /preload\.cjs/);
  assert.match(preload, /contextBridge\.exposeInMainWorld\("xiaodaiDesktop"/);
  assert.match(main, /screen\.getCursorScreenPoint\(\)/);
  assert.match(preload, /xiaodai:drag-sample/);
  assert.match(preload, /xiaodai:roam/);
});

test("desktop controls stay hidden until the pet is explicitly right-clicked", async () => {
  const app = await readFile(new URL("../src/ui/app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/ui/styles.css", import.meta.url), "utf8");
  assert.match(app, /addEventListener\("contextmenu"/);
  assert.match(app, /toggleSettings\(true\)/);
  assert.match(styles, /body\.desktop-mode \.action-bar\s*\{\s*display: none;/);
});

test("release workflow does not copy the complete assets tree", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /Copy-Item\s+skills,src,assets,/);
  assert.match(workflow, /Get-ChildItem assets\/pets -Directory/);
  assert.match(workflow, /Join-Path \$_\.FullName "generated"/);
});
