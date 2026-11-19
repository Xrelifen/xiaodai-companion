const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const path = require('node:path');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ width: 360, height: 390, show: false, webPreferences: {
    preload: path.join(__dirname, 'desktop-integration-preload.cjs'), backgroundThrottling: false, offscreen: true,
  } });
  await window.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'), { query: { mode: 'desktop' } });
  await pause(4000);
  const point = await window.webContents.executeJavaScript(`(() => {
    const r = document.querySelector('#pet-canvas').getBoundingClientRect();
    return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
  })()`);
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...point });
  await pause(100);
  await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 20, dy: 0, speed: 200})');
  for (let i = 0; i < 8; i++) {
    await pause(50);
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 0, dy: 0, speed: 0})');
  }
  const before = await window.webContents.executeJavaScript("document.querySelector('#pet-canvas').toDataURL()");
  for (let i = 0; i < 12; i++) {
    await pause(50);
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 0, dy: 0, speed: 0})');
  }
  const held = await window.webContents.executeJavaScript("document.querySelector('#pet-canvas').toDataURL()");
  assert.equal(held, before, 'the startup pose changed while the pointer was stationary');
  for (let i = 0; i < 8; i++) {
    await pause(100);
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 20, dy: 0, speed: 200})');
  }
  const resumed = await window.webContents.executeJavaScript("document.querySelector('#pet-canvas').toDataURL()");
  assert.notEqual(resumed, held, 'the transition did not resume after the pointer moved');
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...point });
  window.webContents.stopPainting();
  window.close();
  console.log('Startup pose held steady and resumed with pointer movement');
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
