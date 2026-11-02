import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("desktop package excludes reference photos", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.build.files.includes("!assets/pets/*/source/**/*"));
});

test("release workflow does not copy the complete assets tree", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /Copy-Item\s+skills,src,assets,/);
  assert.match(workflow, /Get-ChildItem assets\/pets -Directory/);
  assert.match(workflow, /Join-Path \$_\.FullName "generated"/);
});
