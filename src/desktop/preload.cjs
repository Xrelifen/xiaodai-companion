"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("xiaodaiDesktop", {
  beginDrag: () => ipcRenderer.send("xiaodai:drag-start"),
  endDrag: () => ipcRenderer.send("xiaodai:drag-end"),
  onDragSample: (callback) => {
    const listener = (_event, sample) => callback(sample);
    ipcRenderer.on("xiaodai:drag-sample", listener);
    return () => ipcRenderer.removeListener("xiaodai:drag-sample", listener);
  },
  setExpanded: (expanded) => ipcRenderer.send("xiaodai:set-expanded", Boolean(expanded)),
  planRoam: (request) => ipcRenderer.invoke("xiaodai:plan-roam", request),
  roam: (request) => ipcRenderer.invoke("xiaodai:roam", request),
  close: () => ipcRenderer.send("xiaodai:close"),
});
