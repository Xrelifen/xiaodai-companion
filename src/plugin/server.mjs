import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const resourceUri = "ui://xiaodai-companion/main";
const protocolVersion = "2026-07-28";

const tool = {
  name: "xiaodai.open",
  title: "打開小呆 Companion",
  description: "Open the interactive Xiaodai companion panel for natural idle actions and simple pet interactions.",
  inputSchema: {
    type: "object",
    properties: {
      greeting: { type: "string", description: "Optional short greeting shown when Xiaodai opens." },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  _meta: {
    ui: { resourceUri },
    "openai/ui": { entrypoints: [{ type: "global" }] },
  },
};

async function appHtml() {
  return fs.readFile(path.join(root, "dist", "plugin", "app.html"), "utf8");
}

async function handle(method, params = {}) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion,
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: "xiaodai-companion", version: "0.1.0" },
      };
    case "server/discover":
      return { protocolVersion, capabilities: { tools: {}, resources: {} } };
    case "ping":
      return {};
    case "tools/list":
      return { tools: [tool] };
    case "tools/call": {
      if (params.name !== tool.name) throw new Error(`Unknown tool: ${params.name}`);
      const greeting = params.arguments?.greeting || "小呆來陪你了。";
      return {
        content: [{ type: "text", text: greeting }],
        structuredContent: { greeting, companion: "小呆", mode: "interactive" },
      };
    }
    case "resources/list":
      return {
        resources: [{ uri: resourceUri, name: "小呆 Companion", mimeType: "text/html;profile=mcp-app" }],
      };
    case "resources/read":
      if (params.uri !== resourceUri) throw new Error(`Unknown resource: ${params.uri}`);
      return {
        contents: [{
          uri: resourceUri,
          mimeType: "text/html;profile=mcp-app",
          text: await appHtml(),
          _meta: {
            "openai/ui": {
              availableDisplayModes: ["inline", "fullscreen"],
              preferredDisplayMode: "fullscreen",
            },
          },
        }],
      };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    let request;
    try {
      request = JSON.parse(line);
      if (request.id === undefined) continue;
      const result = await handle(request.method, request.params);
      process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`);
    } catch (error) {
      if (request?.id === undefined) continue;
      process.stdout.write(`${JSON.stringify({
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32603, message: error instanceof Error ? error.message : String(error) },
      })}\n`);
    }
  }
});
