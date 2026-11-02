import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function requestServer(request) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "src", "plugin", "server.mjs")], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let errors = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Timed out: ${errors}`));
    }, 5000);
    child.stderr.on("data", (chunk) => { errors += chunk; });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const newline = output.indexOf("\n");
      if (newline < 0) return;
      const line = output.slice(0, newline).trim();
      if (!line) return;
      clearTimeout(timeout);
      child.kill();
      resolve(JSON.parse(line));
    });
    child.on("error", reject);
    child.stdin.end(`${JSON.stringify(request)}\n`);
  });
}

test("MCP server advertises the interactive companion", async () => {
  const response = await requestServer({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.equal(response.result.tools[0].name, "xiaodai.open");
  assert.equal(response.result.tools[0]._meta.ui.resourceUri, "ui://xiaodai-companion/main");
});

test("MCP resource is a self-contained app", async () => {
  const response = await requestServer({
    jsonrpc: "2.0",
    id: 2,
    method: "resources/read",
    params: { uri: "ui://xiaodai-companion/main" },
  });
  const content = response.result.contents[0];
  assert.equal(content.mimeType, "text/html;profile=mcp-app");
  assert.match(content.text, /data:image\/png;base64,/);
});
