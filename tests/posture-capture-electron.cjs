const { app, BrowserWindow } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const output = path.join(__dirname, '..', 'tmp', 'posture-capture');

app.whenReady().then(async () => {
  await fs.mkdir(output, { recursive: true });
  const window = new BrowserWindow({ width: 360, height: 390, show: false, webPreferences: {
    preload: path.join(__dirname, 'desktop-integration-preload.cjs'), backgroundThrottling: false, offscreen: true,
  } });
  await window.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'), { query: { mode: 'desktop' } });
  await pause(4000);
  await window.webContents.executeJavaScript('Math.random = () => 0.99; void 0');
  const rect = await window.webContents.executeJavaScript(`(() => {const r=document.querySelector('#pet-canvas').getBoundingClientRect(); return {x: Math.floor(r.left+r.width/2), y: Math.floor(r.top+r.height/2)};})()`);
  const capture = async (name) => {
    const encoded = await window.webContents.executeJavaScript(`document.querySelector('#pet-canvas').toDataURL('image/png').split(',')[1]`);
    await fs.writeFile(path.join(output, `${name}.png`), Buffer.from(encoded, 'base64'));
  };
  await capture('start-00');
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...rect });
  await pause(150);
  for (let i = 1; i <= 8; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: 12, dy: 0, speed: 200})`);
    await pause(125);
    await capture(`start-${String(i).padStart(2, '0')}`);
  }
  for (let i = 0; i < 24; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: -12, dy: 0, speed: 200})`);
    await pause(40);
    await capture(`turn-${String(i).padStart(2, '0')}`);
  }
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...rect });
  for (let i = 0; i < 21; i++) {
    await pause(180);
    await capture(`stop-${String(i).padStart(2, '0')}`);
  }
  console.log('Captured start and stop frames in', output);
  window.webContents.stopPainting();
  window.close();
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
