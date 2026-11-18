const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } });
  await window.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'));
  const result = await window.webContents.executeJavaScript(`(() => {
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const ctx = c.getContext('2d');
    const fill = color => alpha => { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0,0,1,1); ctx.restore(); };
    XiaodaiCrossfade.drawCrossfade(ctx, fill('#ff0000'), fill('#0000ff'), 0.5);
    return Array.from(ctx.getImageData(0,0,1,1).data);
  })()`);
  window.destroy();
  if (result[3] !== 255 || Math.abs(result[0] - 128) > 1 || Math.abs(result[2] - 128) > 1) {
    console.error('Unexpected blended pixel:', result);
    app.exit(1);
  } else {
    console.log('Crossfade pixel:', result);
    app.exit(0);
  }
}).catch(error => { console.error(error); app.exit(1); });
