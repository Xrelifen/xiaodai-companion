const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  const output = path.join(__dirname, '..', 'tmp', 'lie-transition');
  await fs.mkdir(output, { recursive: true });
  const window = new BrowserWindow({ width: 360, height: 390, show: false, webPreferences: {
    preload: path.join(__dirname, 'desktop-integration-preload.cjs'), backgroundThrottling: false, offscreen: true,
  } });
  const errors = [];
  window.webContents.on('render-process-gone', (_event, detail) => errors.push(detail.reason));
  await window.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'), { query: { mode: 'desktop' } });
  await pause(4000);
  await window.webContents.executeJavaScript(`(() => {
    window.__lieFrames = [];
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (image?.src?.includes('/motions/')) window.__lieFrames.push(image.src);
      return draw.call(this, image, ...args);
    };
    document.querySelector("[data-action='rest']").click();
  })()`);
  for (let i = 0; i < 24; i++) {
    await pause(160);
    const encoded = await window.webContents.executeJavaScript(`document.querySelector('#pet-canvas').toDataURL('image/png').split(',')[1]`);
    await fs.writeFile(path.join(output, `${String(i).padStart(2, '0')}.png`), Buffer.from(encoded, 'base64'));
  }
  const frames = await window.webContents.executeJavaScript('window.__lieFrames');
  const expected = ['frame-010-lean-forward', 'frame-012-lowering', 'frame-015-lowering', 'frame-020-chest-lowered', 'lie-idle-v1/frames/frame-000-neutral'];
  let cursor = -1;
  for (const name of expected) {
    cursor = frames.findIndex((url, index) => index > cursor && url.includes(name));
    assert.notEqual(cursor, -1, `Missing or out-of-order pose: ${name}`);
  }
  assert.deepEqual(errors, []);
  await window.webContents.executeJavaScript('window.__lieFrames = []');
  const point = await window.webContents.executeJavaScript(`(() => {
    const r = document.querySelector('#pet-canvas').getBoundingClientRect();
    return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
  })()`);
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...point });
  for (let i = 0; i < 50; i++) {
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 15, dy: 0, speed: 180})');
    await pause(80);
  }
  const gettingUp = await window.webContents.executeJavaScript('window.__lieFrames');
  const crouch = gettingUp.findIndex(url => url.includes('frame-020-chest-lowered'));
  const sit = gettingUp.findIndex((url, i) => i > crouch && url.includes('sit-idle-v1/frames/frame-000-neutral'));
  const rise = gettingUp.findIndex((url, i) => i > sit && url.includes('sit-stand-v1/frames/frame-010-rising'));
  const firstStep = gettingUp.findIndex((url, i) => i > rise && url.includes('start-step-v1'));
  assert.ok(crouch >= 0 && sit > crouch && rise > sit && firstStep > rise, 'dragging a lying cat must pass through crouch, sit and stand before stepping');
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...point });
  console.log(`Lie transition rendered ${expected.length} ordered poses; captures: ${output}`);
  window.webContents.stopPainting();
  window.close();
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
