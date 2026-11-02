import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const compactSize = { width: 360, height: 390 };
const expandedSize = { width: 440, height: 620 };
let companionWindow;
let dragState = null;
let roamTimer = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampToDisplay(bounds, x, y) {
  const display = screen.getDisplayNearestPoint({ x, y });
  const area = display.workArea;
  return {
    x: clamp(Math.round(x), area.x, area.x + Math.max(0, area.width - bounds.width)),
    y: clamp(Math.round(y), area.y, area.y + Math.max(0, area.height - bounds.height)),
  };
}

function stopRoam() {
  if (roamTimer) clearInterval(roamTimer);
  roamTimer = null;
}

function createWindow() {
  companionWindow = new BrowserWindow({
    ...compactSize,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(here, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  companionWindow.setAlwaysOnTop(true, "floating");
  companionWindow.loadFile(path.join(here, "..", "ui", "index.html"), {
    query: { mode: "desktop" },
  });
  companionWindow.once("ready-to-show", () => companionWindow.show());
  companionWindow.on("closed", () => {
    stopRoam();
    companionWindow = null;
  });
}

ipcMain.on("xiaodai:drag-start", (_event, point) => {
  if (!companionWindow || !point) return;
  stopRoam();
  dragState = { point, bounds: companionWindow.getBounds() };
});

ipcMain.on("xiaodai:drag-move", (_event, point) => {
  if (!companionWindow || !dragState || !point) return;
  const x = dragState.bounds.x + point.screenX - dragState.point.screenX;
  const y = dragState.bounds.y + point.screenY - dragState.point.screenY;
  const next = clampToDisplay(dragState.bounds, x, y);
  companionWindow.setPosition(next.x, next.y, false);
});

ipcMain.on("xiaodai:drag-end", () => {
  dragState = null;
});

ipcMain.on("xiaodai:set-expanded", (_event, expanded) => {
  if (!companionWindow) return;
  const current = companionWindow.getBounds();
  const target = expanded ? expandedSize : compactSize;
  const next = clampToDisplay(target, current.x, current.y + current.height - target.height);
  companionWindow.setBounds({ ...next, ...target }, true);
});

ipcMain.on("xiaodai:close", () => companionWindow?.close());

ipcMain.handle("xiaodai:roam", async (_event, request = {}) => {
  if (!companionWindow) return false;
  stopRoam();
  const start = companionWindow.getBounds();
  const targetPoint = clampToDisplay(start, start.x + Number(request.dx || 0), start.y);
  const duration = clamp(Number(request.duration || 3000), 500, 12000);
  const startedAt = Date.now();

  await new Promise((resolve) => {
    roamTimer = setInterval(() => {
      if (!companionWindow) {
        stopRoam();
        resolve();
        return;
      }
      const progress = clamp((Date.now() - startedAt) / duration, 0, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      companionWindow.setPosition(
        Math.round(start.x + (targetPoint.x - start.x) * eased),
        start.y,
        false,
      );
      if (progress >= 1) {
        stopRoam();
        resolve();
      }
    }, 16);
  });
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
