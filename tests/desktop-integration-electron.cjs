const { app, BrowserWindow } = require('electron');
const path = require('path');
const assert = require('assert/strict');
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomValue = Number(process.env.XIAODAI_TEST_RANDOM ?? 0.99);

app.whenReady().then(async () => {
  const window = new BrowserWindow({ width: 360, height: 390, show: false, webPreferences: {
    preload: path.join(__dirname, 'desktop-integration-preload.cjs'), backgroundThrottling: false, offscreen: true,
  } });
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  window.webContents.on('render-process-gone', (_event, detail) => errors.push(`renderer exited: ${detail.reason}`));
  await window.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'), { query: { mode: 'desktop' } });
  await pause(4000);
  console.log('Turn pack:', await window.webContents.executeJavaScript(`XIAODAI_PET_CATALOG[0].naturalMotions.filter(m => m.intent === 'turn').map(m => ({id:m.id, count:m.variants[0].frames.length}))`));
  await window.webContents.executeJavaScript(`(() => {
    Math.random = () => ${JSON.stringify(randomValue)};
    window.__drawnFrames = [];
    window.__pointerEvents = [];
    for (const name of ['pointerdown', 'pointerup']) document.addEventListener(name, event => window.__pointerEvents.push({name, target: event.target.id}), true);
    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (image?.src && image.src.includes('/motions/')) window.__drawnFrames.push({ url: image.src, mirror: this.getTransform().a < 0 });
      return original.call(this, image, ...args);
    };
  })()`);
  const rect = await window.webContents.executeJavaScript(`(() => {const r=document.querySelector('#pet-canvas').getBoundingClientRect(); return {x: Math.floor(r.left+r.width/2), y: Math.floor(r.top+r.height/2)};})()`);
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...rect });
  await pause(500);
  for (let i = 0; i < 30; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: 20, dy: 0, speed: 200})`);
    await pause(120);
    if ((await window.webContents.executeJavaScript(`document.querySelector('#status-pill').textContent`)).includes('往右邊走')) break;
  }
  console.log('Forward status:', await window.webContents.executeJavaScript(`document.querySelector('#status-pill').textContent`));
  console.log('Pointer events:', await window.webContents.executeJavaScript('window.__pointerEvents'));
  assert.ok((await window.webContents.executeJavaScript(`document.querySelector('#status-pill').textContent`)).includes('往右邊走'), 'forward drag was not started');
  await pause(1100);
  const startFrames = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(startFrames.some(f => f.url.includes('frame-010-rising')), 'startup did not show the rising pose');
  assert.ok(startFrames.some(f => f.url.includes('frame-015-halfway')), 'startup skipped the intermediate posture');
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  for (let i = 0; i < 11; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: -20, dy: 0, speed: 200})`);
    await pause(120);
  }
  console.log('Reverse status:', await window.webContents.executeJavaScript(`document.querySelector('#status-pill').textContent`));
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...rect });
  await pause(3500);
  const frames = await window.webContents.executeJavaScript('window.__drawnFrames');
  console.log('Observed images:', [...new Set(frames.map(f => f.url.split('/').pop()))], 'errors:', errors);
  assert.ok(frames.some(f => f.url.includes('frame-010-quarter')), 'turn quarter frame was never drawn');
  assert.ok(frames.some(f => f.url.includes('frame-020-front')), 'turn front frame was never drawn');
  const turnIndex = frames.findIndex(f => f.url.includes('turn-v1/frames/frame-020-front'));
  const firstStepIndex = frames.findIndex((f, i) => i > turnIndex && f.url.includes('start-step-v1'));
  const walkIndex = frames.findIndex((f, i) => i > firstStepIndex && f.url.includes('walk-cycle-v1/frames/frame-000-contact'));
  assert.ok(turnIndex >= 0 && firstStepIndex > turnIndex && walkIndex > firstStepIndex, 'turn must lead through first-step into walk contact');
  assert.ok(frames.some(f => f.url.includes('stand-settle-v1')), 'release did not enter standing sequence');
  assert.ok(frames.some(f => f.url.includes('frame-020-look-front')), 'settling did not reach the front-facing pose');
  if (randomValue >= 3 / 9) assert.ok(frames.some(f => f.url.includes('frame-030-tail-relax')), 'tail did not settle after standing');
  else assert.ok(!frames.some(f => f.url.includes('frame-030-tail-relax')), 'quiet settling unexpectedly included the tail motion');
  if (randomValue >= 7 / 9) assert.ok(frames.some(f => f.url.includes('frame-040-ear-relax')), 'ear did not settle after the tail');
  else assert.ok(!frames.some(f => f.url.includes('frame-040-ear-relax')), 'short settling unexpectedly included the ear motion');
  assert.ok(frames.some(f => f.url.includes('frame-010-rising')), 'stopping did not use the lowering pose');
  assert.ok(frames.some(f => f.url.includes('frame-015-halfway')), 'sitting skipped the intermediate posture');
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...rect });
  await pause(100);
  for (let i = 0; i < 4; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: 20, dy: 0, speed: 200})`);
    await pause(80);
  }
  await pause(1000);
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  for (let i = 0; i < 5; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: -20, dy: 0, speed: 200})`);
    await pause(80);
  }
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...rect });
  await pause(1500);
  const midTurnFrames = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(midTurnFrames.some(f => f.url.includes('frame-010-quarter')), 'mid-turn test did not reach a turning frame');
  assert.ok(midTurnFrames.some(f => f.url.includes('stand-settle-v1')), 'release during turn did not settle');
  await pause(600);
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...rect });
  await pause(100);
  await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: 20, dy: 0, speed: 200})`);
  await pause(80);
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...rect });
  await pause(1600);
  const earlyRelease = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(earlyRelease.some(f => f.url.includes('stand-settle-v1')), 'release during startup did not settle');
  await pause(1800);
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...rect });
  await pause(100);
  for (let i = 0; i < 20; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: 40, dy: 0, speed: 700})`);
    await pause(100);
  }
  const fastFrames = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(fastFrames.some(f => f.url.includes('start-step-v1')), 'fast startup skipped the first step');
  assert.ok(fastFrames.some(f => f.url.includes('run-cycle-v1')), 'sustained fast drag never entered the running cycle');
  assert.ok(fastFrames.some(f => f.url.includes('frame-022-unfolding')), 'running skipped the unfolding pose');
  assert.ok(fastFrames.some(f => f.url.includes('frame-023-rising')), 'running skipped the rising pose');
  const accelerateFirst = fastFrames.findIndex(f => f.url.includes('gait-bridge-v1/frames/01-raised'));
  const accelerateSecond = fastFrames.findIndex((f, i) => i > accelerateFirst && f.url.includes('gait-bridge-v1/frames/02-lowering'));
  const runAfterBridge = fastFrames.findIndex((f, i) => i > accelerateSecond && f.url.includes('run-cycle-v1/frames/frame-010-front-landing'));
  assert.ok(accelerateFirst >= 0 && accelerateSecond > accelerateFirst && runAfterBridge > accelerateSecond, 'walk to run must use the bridge before run landing');
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  for (let i = 0; i < 20; i++) {
    await window.webContents.executeJavaScript(`xiaodaiDesktop.sampleForTest({dx: 8, dy: 0, speed: 100})`);
    await pause(100);
  }
  const slowFrames = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(slowFrames.some(f => f.url.includes('walk-cycle-v1')), 'sustained slow drag never returned to walking');
  const decelerateFirst = slowFrames.findIndex(f => f.url.includes('gait-bridge-v1/frames/02-lowering'));
  const decelerateSecond = slowFrames.findIndex((f, i) => i > decelerateFirst && f.url.includes('gait-bridge-v1/frames/01-raised'));
  const walkAfterBridge = slowFrames.findIndex((f, i) => i > decelerateSecond && f.url.includes('walk-cycle-v1/frames/frame-020-opposite-contact'));
  assert.ok(decelerateFirst >= 0 && decelerateSecond > decelerateFirst && walkAfterBridge > decelerateSecond, 'run to walk must reverse the bridge before walk contact');
  await window.webContents.executeJavaScript(`(() => {
    const original = XiaodaiMotion.NaturalCyclePlayer.prototype.canSwitchGait;
    window.__restoreGaitCheck = () => { XiaodaiMotion.NaturalCyclePlayer.prototype.canSwitchGait = original; };
    window.__allowGaitSwitch = false;
    XiaodaiMotion.NaturalCyclePlayer.prototype.canSwitchGait = () => window.__allowGaitSwitch;
  })()`);
  await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 40, dy: 0, speed: 700})');
  for (let i = 0; i < 8; i++) {
    await pause(50);
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 0, dy: 0, speed: 0})');
  }
  const beforeAllowed = await window.webContents.executeJavaScript("document.querySelector('#pet-canvas').toDataURL()");
  await window.webContents.executeJavaScript('window.__allowGaitSwitch = true');
  await pause(300);
  const whileHeld = await window.webContents.executeJavaScript("document.querySelector('#pet-canvas').toDataURL()");
  assert.ok(whileHeld === beforeAllowed, 'a pending gait change must not alter a stationary held pose');
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  for (let i = 0; i < 8; i++) {
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 40, dy: 0, speed: 700})');
    await pause(80);
  }
  const resumedRun = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(resumedRun.some(f => f.url.includes('run-cycle-v1')), 'a pending gait change must resume after the pointer moves');
  await window.webContents.executeJavaScript('window.__restoreGaitCheck()');
  await pause(400);
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  let bridgeStarted = false;
  for (let i = 0; i < 80; i++) {
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 8, dy: 0, speed: 100})');
    await pause(25);
    bridgeStarted = await window.webContents.executeJavaScript(`window.__drawnFrames.some(f => f.url.includes('gait-bridge-v1'))`);
    if (bridgeStarted) break;
  }
  assert.ok(bridgeStarted, 'release test did not reach a gait transition');
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...rect });
  await pause(1200);
  const afterBridgeRelease = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(afterBridgeRelease.some(f => f.url.includes('stand-settle-v1')), 'releasing during a gait transition must settle');
  await pause(3000);
  window.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...rect });
  for (let i = 0; i < 25; i++) {
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 40, dy: 0, speed: 700})');
    await pause(100);
  }
  await window.webContents.executeJavaScript('window.__drawnFrames = []');
  bridgeStarted = false;
  for (let i = 0; i < 80; i++) {
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: 8, dy: 0, speed: 100})');
    await pause(25);
    bridgeStarted = await window.webContents.executeJavaScript(`window.__drawnFrames.some(f => f.url.includes('gait-bridge-v1'))`);
    if (bridgeStarted) break;
  }
  assert.ok(bridgeStarted, 'reverse test did not reach a gait transition');
  for (let i = 0; i < 26; i++) {
    await window.webContents.executeJavaScript('xiaodaiDesktop.sampleForTest({dx: -15, dy: 0, speed: 180})');
    await pause(80);
  }
  const afterBridgeReverse = await window.webContents.executeJavaScript('window.__drawnFrames');
  assert.ok(afterBridgeReverse.some(f => f.url.includes('turn-v1/frames/frame-020-front')), 'reversing during a gait transition must turn');
  window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...rect });
  assert.deepEqual(errors, []);
  console.log(`Desktop reversal and release: ${frames.length} rendered layers; no renderer errors`);
  window.webContents.stopPainting();
  window.close();
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
