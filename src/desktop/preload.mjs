import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("xiaodaiDesktop", {
  beginDrag: (point) => ipcRenderer.send("xiaodai:drag-start", point),
  updateDrag: (point) => ipcRenderer.send("xiaodai:drag-move", point),
  endDrag: () => ipcRenderer.send("xiaodai:drag-end"),
  setExpanded: (expanded) => ipcRenderer.send("xiaodai:set-expanded", Boolean(expanded)),
  roam: (request) => ipcRenderer.invoke("xiaodai:roam", request),
  close: () => ipcRenderer.send("xiaodai:close"),
});
