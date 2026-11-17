import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNativeDragState, sampleNativeDrag } from "./drag-controller.mjs";
import { planRoam } from "./roam-planner.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const compactSize = { width: 360, height: 390 };
const expandedSize = { width: 440, height: 620 };
let companionWindow;
let dragState = null;
let dragTimer = null;
let roamTimer = null;
let expanded = false;

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

function intendedSize() {
  return expanded ? expandedSize : compactSize;
}

function moveWithFixedSize(x, y) {
  if (!companionWindow) return;
  const size = intendedSize();
  const position = clampToDisplay(size, x, y);
  companionWindow.setBounds({ ...position, ...size }, false);
}

function stopRoam() {
  if (roamTimer) clearInterval(roamTimer);
  roamTimer = null;
}

function stopDrag() {
  if (dragTimer) clearInterval(dragTimer);
  dragTimer = null;
  dragState = null;
}

function createWindow() {
  expanded = false;
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
      // Sandboxed Electron preload scripts must use the CommonJS loader.
      // Using an ESM .mjs preload silently prevented the desktop bridge from
      // loading, so animation state changed while the native window stayed put.
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  companionWindow.setAlwaysOnTop(true, "floating");
  companionWindow.loadFile(path.join(here, "..", "ui", "index.html"), {
    query: { mode: "desktop" },
  });
  companionWindow.once("ready-to-show", () => {
    const [x, y] = companionWindow.getPosition();
    moveWithFixedSize(x, y);
    companionWindow.show();
  });
  companionWindow.on("closed", () => {
    stopDrag();
    stopRoam();
    companionWindow = null;
  });
}

ipcMain.on("xiaodai:drag-start", () => {
  if (!companionWindow) return;
  stopRoam();
  stopDrag();
  const now = Date.now();
  const [x, y] = companionWindow.getPosition();
  dragState = createNativeDragState(
    { x, y, ...intendedSize() },
    screen.getCursorScreenPoint(),
    now,
  );
  dragTimer = setInterval(() => {
    if (!companionWindow || !dragState) {
      stopDrag();
      return;
    }
    const sample = sampleNativeDrag(dragState, screen.getCursorScreenPoint(), Date.now());
    const next = clampToDisplay(intendedSize(), sample.x, sample.y);
    moveWithFixedSize(next.x, next.y);
    companionWindow.webContents.send("xiaodai:drag-sample", {
      ...sample,
      x: next.x,
      y: next.y,
    });
  }, 16);
});

ipcMain.on("xiaodai:drag-end", () => {
  stopDrag();
  if (companionWindow) {
    const [x, y] = companionWindow.getPosition();
    moveWithFixedSize(x, y);
  }
});

ipcMain.on("xiaodai:set-expanded", (_event, shouldExpand) => {
  if (!companionWindow) return;
  const [x, y] = companionWindow.getPosition();
  const previousHeight = intendedSize().height;
  expanded = Boolean(shouldExpand);
  const target = intendedSize();
  const next = clampToDisplay(target, x, y + previousHeight - target.height);
  companionWindow.setBounds({ ...next, ...target }, true);
});

ipcMain.on("xiaodai:close", () => companionWindow?.close());

ipcMain.handle("xiaodai:roam", async (_event, request = {}) => {
  if (!companionWindow) return false;
  stopRoam();
  const [x, y] = companionWindow.getPosition();
  const start = { x, y, ...intendedSize() };
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
      moveWithFixedSize(
        Math.round(start.x + (targetPoint.x - start.x) * eased),
        start.y,
      );
      if (progress >= 1) {
        stopRoam();
        resolve();
      }
    }, 16);
  });
  return true;
});

ipcMain.handle("xiaodai:plan-roam", (_event, request = {}) => {
  if (!companionWindow) return { direction: null, dx: 0, distance: 0, duration: 0 };
  const [x, y] = companionWindow.getPosition();
  const bounds = { x, y, ...intendedSize() };
  const area = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y }).workArea;
  return planRoam(bounds, area, request);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
