const { contextBridge } = require('electron');
let onSample = () => {};
contextBridge.exposeInMainWorld('xiaodaiDesktop', {
  beginDrag() {},
  endDrag() {},
  onDragSample(callback) { onSample = callback; },
  sampleForTest(sample) { onSample(sample); },
  close() {},
});
