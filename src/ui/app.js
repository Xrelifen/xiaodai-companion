(function startXiaodaiCompanion() {
  "use strict";

  const core = globalThis.XiaodaiCore;
  if (!core) throw new Error("XiaodaiCore is unavailable");
  const motionCore = globalThis.XiaodaiMotion;

  const STORAGE_KEY = "xiaodai-companion:settings:v1";
  const AFFECTION_KEY = "xiaodai-companion:affection:v1";
  const ACTIVE_PET_KEY = "xiaodai-companion:active-pet:v1";
  const catalog = Array.isArray(globalThis.XIAODAI_PET_CATALOG) ? globalThis.XIAODAI_PET_CATALOG : [];
  const embeddedMotionAssets = globalThis.XIAODAI_MOTION_ASSETS || {};
  const isDesktop = Boolean(globalThis.xiaodaiDesktop) || new URLSearchParams(location.search).get("mode") === "desktop";
  document.body.classList.toggle("desktop-mode", isDesktop);

  const canvas = document.querySelector("#pet-canvas");
  const context = canvas.getContext("2d", { alpha: true });
  const stage = document.querySelector("#pet-stage");
  const statusPill = document.querySelector("#status-pill");
  const reaction = document.querySelector("#reaction");
  const settingsPanel = document.querySelector("#settings-panel");
  const settingsToggle = document.querySelector("#settings-toggle");
  const settingsClose = document.querySelector("#settings-close");
  const affectionLabel = document.querySelector("#affection");
  const desktopRoamRow = document.querySelector(".desktop-setting");
  const closeCompanion = document.querySelector("#close-companion");
  const petSelect = document.querySelector("#pet-select");

  desktopRoamRow.hidden = !isDesktop;
  closeCompanion.hidden = !isDesktop;

  function loadSavedSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    } catch {
      return {};
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(engine.config));
  }

  let affection = Number(localStorage.getItem(AFFECTION_KEY) || 0);
  let config = core.deepMerge(core.DEFAULT_CONFIG, loadSavedSettings());
  const engine = new core.BehaviorEngine({ config, now: performance.now() });
  let activePet = catalog.find((item) => item.id === localStorage.getItem(ACTIVE_PET_KEY)) || catalog[0] || {
    id: "placeholder",
    name: "寵物",
    placeholderEmoji: "🐾",
    accentColor: "#df8c43",
    frame: { width: 192, height: 208 },
    spriteUrl: null,
  };

  const sprite = new Image();
  sprite.decoding = "async";
  let spriteReady = false;
  const naturalImages = new Map();
  let naturalMotionPlayer = null;
  let naturalMotionReady = false;
  let naturalLoadToken = 0;
  const naturalMotionByPose = new Map();
  const naturalTransitionByKey = new Map();
  const naturalLocomotionByGait = new Map();
  let naturalTransitionPlayer = null;
  let naturalLocomotionPlayer = null;
  let activeNaturalGait = null;
  let lastDrawnNaturalUrl = null;
  let lastDrawnNaturalMirror = false;
  let lastEngineSequence = engine.current.name;
  let naturalPose = "sit";
  let naturalPoseUntil = 0;

  const pet = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 320,
    height: 346.6667,
    dragging: false,
    pointerId: null,
    lastPointer: null,
    dragDistance: 0,
    lookAngle: -Math.PI / 2,
    targetLookAngle: -Math.PI / 2,
    pointerInside: false,
    lastInteractionAt: performance.now(),
    nextRoamAt: 0,
    roamUntil: 0,
    gait: "walk",
  };

  const actionLabels = {
    idle: "安靜陪著你",
    lookAround: "正在四處看看",
    lieDown: "趴著休息一下",
    getUp: "慢慢坐起來",
    standTurnSit: "站起來巡視",
    wave: "跟你揮揮手",
    jump: "開心跳了一下",
    focused: "正在專心觀察",
    sad: "有一點沮喪",
    walkRight: "往右邊走",
    walkLeft: "往左邊走",
  };

  const naturalActionLabels = {
    "slow-blink": "慢慢眨眼",
    "look-viewer-left": "看看左邊",
    "look-viewer-right": "看看右邊",
    "ear-listen": "豎耳聽聽",
    "lie-slow-blink": "趴著慢慢眨眼",
    "lie-ear-listen": "趴著聽聽聲音",
    "lower-head-and-nap": "靠著前掌小睡",
  };

  function setStatus(text) {
    statusPill.textContent = text;
  }

  function showReaction(text) {
    reaction.textContent = text;
    reaction.classList.remove("show");
    void reaction.offsetWidth;
    reaction.classList.add("show");
  }

  function addAffection(amount = 1) {
    affection += amount;
    localStorage.setItem(AFFECTION_KEY, String(affection));
    affectionLabel.textContent = `親密度 ${affection}`;
  }

  function sequenceLabel() {
    return actionLabels[engine.current.name] || engine.current.name;
  }

  function drawFrame(frame) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!spriteReady || !sprite.complete || !sprite.naturalWidth) {
      drawPlaceholder();
      return;
    }

    const frameWidth = activePet.frame?.width || 192;
    const frameHeight = activePet.frame?.height || 208;
    const sourceX = frame.column * frameWidth;
    const sourceY = frame.row * frameHeight;
    const scale = Math.min(pet.width / frameWidth, pet.height / frameHeight);
    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;
    const drawX = pet.x - drawWidth / 2;
    const drawY = pet.y - drawHeight / 2;

    context.drawImage(sprite, sourceX, sourceY, frameWidth, frameHeight, drawX, drawY, drawWidth, drawHeight);
  }

  function drawNaturalLayer(image, alpha, breathScale, mirror = false) {
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return;
    const scale = Math.min(pet.width / image.naturalWidth, pet.height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const baseHeight = image.naturalHeight * scale;
    const drawHeight = baseHeight * breathScale;
    const groundY = pet.y + pet.height / 2;
    const drawX = pet.x - drawWidth / 2;
    const drawY = groundY - drawHeight;
    context.save();
    context.globalAlpha = alpha;
    if (mirror) {
      context.translate(drawX + drawWidth / 2, 0);
      context.scale(-1, 1);
      context.drawImage(image, -drawWidth / 2, drawY, drawWidth, drawHeight);
    } else {
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }
    context.restore();
  }

  function drawNaturalFrame(state) {
    const current = naturalImages.get(state?.url);
    if (!current) return false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const previous = naturalImages.get(state.previousUrl);
    if (previous) drawNaturalLayer(previous, 1 - state.blend, state.breathScale, state.mirror);
    drawNaturalLayer(current, previous ? state.blend : 1, state.breathScale, state.mirror);
    lastDrawnNaturalUrl = state.url;
    lastDrawnNaturalMirror = Boolean(state.mirror);
    return true;
  }

  function drawPlaceholder() {
    const color = activePet.accentColor || "#df8c43";
    context.save();
    context.translate(pet.x, pet.y);
    context.fillStyle = `${color}22`;
    context.beginPath();
    context.arc(0, 0, 132, 0, Math.PI * 2);
    context.fill();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "96px 'Segoe UI Emoji', sans-serif";
    context.fillText(activePet.placeholderEmoji || "🐾", 0, -22);
    context.fillStyle = color;
    context.font = "700 30px system-ui, sans-serif";
    context.fillText(activePet.name, 0, 78);
    context.restore();
  }

  function currentLookFrame(now) {
    const idleLongEnough = now - pet.lastInteractionAt > 600;
    if (!pet.pointerInside || pet.dragging || engine.current.name !== "idle" || !idleLongEnough) return null;
    pet.lookAngle = core.smoothAngle(pet.lookAngle, pet.targetLookAngle, engine.config.lookSmoothing);
    return core.lookFrameForAngle(pet.lookAngle);
  }

  function render(now) {
    if (naturalPose === "lie" && engine.current.name === "idle") {
      if (now >= naturalPoseUntil) {
        engine.trigger("getUp", now, { reason: "natural-pose-change" });
      } else {
        engine.nextIdleActionAt = Number.POSITIVE_INFINITY;
      }
    }
    const sequenceBeforeTick = engine.current.name;
    const frame = engine.tick(now);
    if (sequenceBeforeTick !== engine.current.name && engine.current.name === "idle") {
      if (sequenceBeforeTick === "lieDown" && naturalMotionByPose.has("lie")) {
        activateNaturalPose("lie", now);
        naturalPoseUntil = now + core.randomBetween(25_000, 75_000);
        engine.nextIdleActionAt = Number.POSITIVE_INFINITY;
      } else if (sequenceBeforeTick === "getUp") {
        activateNaturalPose("sit", now);
        engine.scheduleNextIdle(now);
      }
    }
    if (engine.current.name !== lastEngineSequence) {
      const previousEngineSequence = lastEngineSequence;
      if (engine.current.name === "lieDown") {
        activateNaturalTransition("sit", "lie", false, now);
      } else if (engine.current.name === "getUp") {
        activateNaturalTransition("sit", "lie", true, now);
      } else if (engine.current.name === "idle" && ["walkLeft", "walkRight"].includes(previousEngineSequence)) {
        activateNaturalPose("sit", now);
        if (naturalMotionPlayer && lastDrawnNaturalUrl && !lastDrawnNaturalMirror) {
          naturalMotionPlayer.previousUrl = lastDrawnNaturalUrl;
          naturalMotionPlayer.transitionStartedAt = now;
        }
      } else {
        naturalTransitionPlayer = null;
      }
      lastEngineSequence = engine.current.name;
    }
    const locomotionDirection = engine.current.name === "walkLeft"
      ? "left"
      : (engine.current.name === "walkRight" ? "right" : null);
    if (locomotionDirection) {
      if (!naturalLocomotionPlayer || activeNaturalGait !== pet.gait) {
        activateNaturalLocomotion(pet.gait, now);
      }
    } else {
      naturalLocomotionPlayer = null;
      activeNaturalGait = null;
    }
    const lookFrame = currentLookFrame(now);
    let naturalState = null;
    let drewNaturalFrame = false;
    if (naturalMotionReady && naturalLocomotionPlayer && locomotionDirection) {
      naturalState = naturalLocomotionPlayer.tick(now, { playbackRate: engine.current.playbackRate });
      naturalState.mirror = locomotionDirection === "right";
      drewNaturalFrame = drawNaturalFrame(naturalState);
    } else if (naturalMotionReady && naturalTransitionPlayer && ["lieDown", "getUp"].includes(engine.current.name)) {
      naturalState = naturalTransitionPlayer.tick(now);
      drewNaturalFrame = drawNaturalFrame(naturalState);
    } else if (engine.current.name === "idle" && naturalMotionReady && naturalMotionPlayer) {
      naturalState = naturalMotionPlayer.tick(now, { enabled: true });
      drewNaturalFrame = drawNaturalFrame(naturalState);
    } else if (naturalMotionPlayer) {
      naturalMotionPlayer.tick(now, { enabled: false });
    }
    if (!drewNaturalFrame) drawFrame(lookFrame || frame);
    const naturalLabel = naturalActionLabels[naturalState?.variantId];
    setStatus(`${activePet.name}・${naturalLabel || sequenceLabel()}`);
    maybeRoam(now);
    requestAnimationFrame(render);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function pointerVelocity(current, previous) {
    if (!previous) return { speed: 0, dx: 0, dy: 0 };
    const dt = Math.max(1, current.time - previous.time);
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    return { speed: Math.hypot(dx, dy) / dt * 1000, dx, dy };
  }

  canvas.addEventListener("pointerdown", (event) => {
    const point = canvasPoint(event);
    pet.dragging = true;
    pet.pointerId = event.pointerId;
    pet.lastPointer = { ...point, screenX: event.screenX, screenY: event.screenY, time: performance.now() };
    pet.dragDistance = 0;
    pet.lastInteractionAt = performance.now();
    canvas.setPointerCapture(event.pointerId);
    globalThis.xiaodaiDesktop?.beginDrag?.({ screenX: event.screenX, screenY: event.screenY });
  });

  canvas.addEventListener("pointermove", (event) => {
    const now = performance.now();
    const point = canvasPoint(event);
    const petScreenX = canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2;
    const petScreenY = canvas.getBoundingClientRect().top + canvas.getBoundingClientRect().height / 2;
    pet.targetLookAngle = Math.atan2(event.clientY - petScreenY, event.clientX - petScreenX);
    pet.pointerInside = true;

    if (!pet.dragging || event.pointerId !== pet.pointerId) return;
    const current = { ...point, screenX: event.screenX, screenY: event.screenY, time: now };
    const velocity = pointerVelocity(current, pet.lastPointer);
    pet.dragDistance += Math.hypot(velocity.dx, velocity.dy);
    const direction = velocity.dx < 0 ? "left" : "right";
    const dragState = engine.setDragState(direction, velocity.speed, now);
    pet.gait = dragState.gait;

    if (isDesktop) {
      globalThis.xiaodaiDesktop?.updateDrag?.({ screenX: event.screenX, screenY: event.screenY });
    } else {
      const dx = current.x - pet.lastPointer.x;
      const dy = current.y - pet.lastPointer.y;
      pet.x = core.clamp(pet.x + dx, pet.width / 2, canvas.width - pet.width / 2);
      pet.y = core.clamp(pet.y + dy, pet.height / 2, canvas.height - pet.height / 2);
    }
    pet.lastPointer = current;
  });

  function finishDrag(event) {
    if (!pet.dragging || event.pointerId !== pet.pointerId) return;
    const wasClick = pet.dragDistance < 8;
    pet.dragging = false;
    pet.pointerId = null;
    pet.lastPointer = null;
    globalThis.xiaodaiDesktop?.endDrag?.();
    engine.releaseDrag(performance.now());
    pet.gait = "walk";
    if (wasClick) {
      addAffection(1);
      engine.trigger(affection % 4 === 0 ? "jump" : "wave", performance.now(), { reason: "pet" });
      showReaction(affection % 4 === 0 ? "♡ 好開心" : "♡ 呼嚕");
    }
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!pet.dragging) pet.pointerInside = false;
  });
  stage.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pet.targetLookAngle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
    pet.pointerInside = true;
  });
  stage.addEventListener("pointerleave", () => {
    if (!pet.dragging) pet.pointerInside = false;
  });

  document.querySelector("[data-action='pet']").addEventListener("click", () => {
    addAffection(1);
    engine.trigger("wave", performance.now(), { reason: "button:pet" });
    showReaction("♡ 呼嚕呼嚕");
  });
  document.querySelector("[data-action='call']").addEventListener("click", () => {
    engine.trigger("jump", performance.now(), { reason: "button:call" });
    showReaction("喵？");
  });
  document.querySelector("[data-action='rest']").addEventListener("click", () => {
    engine.trigger("lieDown", performance.now(), { reason: "button:rest" });
    showReaction("好～休息一下");
  });

  function toggleSettings(force) {
    const open = force ?? settingsPanel.hidden;
    settingsPanel.hidden = !open;
    settingsToggle.setAttribute("aria-expanded", String(open));
    globalThis.xiaodaiDesktop?.setExpanded?.(open);
  }

  settingsToggle.addEventListener("click", () => toggleSettings());
  settingsClose.addEventListener("click", () => toggleSettings(false));
  closeCompanion.addEventListener("click", () => globalThis.xiaodaiDesktop?.close?.());

  const inputs = {
    idleMin: document.querySelector("#idle-min"),
    idleMax: document.querySelector("#idle-max"),
    look: document.querySelector("#look-smoothing"),
    repeat: document.querySelector("#prevent-repeat"),
    roam: document.querySelector("#desktop-roam"),
  };

  function syncInputs() {
    inputs.idleMin.value = String(engine.config.idleDelay.minMs / 1000);
    inputs.idleMax.value = String(engine.config.idleDelay.maxMs / 1000);
    inputs.look.value = String(engine.config.lookSmoothing);
    inputs.repeat.checked = engine.config.preventImmediateRepeat;
    inputs.roam.checked = engine.config.desktop.roamEnabled;
    document.querySelector("#idle-min-output").value = `${inputs.idleMin.value} 秒`;
    document.querySelector("#idle-max-output").value = `${inputs.idleMax.value} 秒`;
    document.querySelector("#look-output").value = Number(inputs.look.value).toFixed(2);
    affectionLabel.textContent = `親密度 ${affection}`;
  }

  function readInputs() {
    const minMs = Number(inputs.idleMin.value) * 1000;
    const maxMs = Math.max(minMs + 500, Number(inputs.idleMax.value) * 1000);
    engine.updateConfig({
      idleDelay: { minMs, maxMs },
      lookSmoothing: Number(inputs.look.value),
      preventImmediateRepeat: inputs.repeat.checked,
      desktop: { roamEnabled: inputs.roam.checked },
    });
    engine.scheduleNextIdle(performance.now());
    saveSettings();
    syncInputs();
  }

  Object.values(inputs).forEach((input) => input.addEventListener("input", readInputs));
  document.querySelector("#reset-settings").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    engine.config = core.deepMerge(core.DEFAULT_CONFIG, {});
    engine.scheduleNextIdle(performance.now());
    syncInputs();
  });

  function activateNaturalPose(pose, now = performance.now()) {
    const motion = naturalMotionByPose.get(pose) || naturalMotionByPose.get("sit") || naturalMotionByPose.values().next().value;
    naturalPose = motion?.fromPose || "sit";
    naturalMotionPlayer = motion && motionCore
      ? new motionCore.NaturalMotionPlayer(motion, { now })
      : null;
  }

  function transitionKey(fromPose, toPose) {
    return `${fromPose}->${toPose}`;
  }

  function activateNaturalTransition(fromPose, toPose, reverse, now = performance.now()) {
    const motion = naturalTransitionByKey.get(transitionKey(fromPose, toPose));
    naturalTransitionPlayer = motion && motionCore?.NaturalSequencePlayer
      ? new motionCore.NaturalSequencePlayer(motion, { now, reverse })
      : null;
  }

  function activateNaturalLocomotion(gait, now = performance.now()) {
    const motion = naturalLocomotionByGait.get(gait) || naturalLocomotionByGait.get("walk");
    activeNaturalGait = motion?.gait || gait;
    naturalLocomotionPlayer = motion && motionCore?.NaturalCyclePlayer
      ? new motionCore.NaturalCyclePlayer(motion, {
        now,
        previousUrl: lastDrawnNaturalUrl || naturalMotionPlayer?.currentUrl || null,
      })
      : null;
  }

  function prepareNaturalMotions(motions) {
    const token = ++naturalLoadToken;
    naturalImages.clear();
    lastDrawnNaturalUrl = null;
    lastDrawnNaturalMirror = false;
    naturalMotionByPose.clear();
    naturalTransitionByKey.clear();
    naturalLocomotionByGait.clear();
    naturalMotionReady = false;
    for (const motion of motions || []) {
      if (motion?.intent === "transition" && motion?.fromPose && motion?.toPose) {
        naturalTransitionByKey.set(transitionKey(motion.fromPose, motion.toPose), motion);
      } else if (motion?.intent === "locomotion" && motion?.gait) {
        naturalLocomotionByGait.set(motion.gait, motion);
      } else if (motion?.fromPose) {
        naturalMotionByPose.set(motion.fromPose, motion);
      }
    }
    activateNaturalPose("sit");
    if (!naturalMotionPlayer) return;

    const urls = new Set([
      ...(motions || []).flatMap((motion) => [
        motion.neutralFrameUrl,
        ...(motion.variants || []).flatMap((variant) => (variant.frames || []).map((frame) => frame.url)),
      ]),
    ].filter(Boolean));
    Promise.all([...urls].map((url) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => {
        naturalImages.set(url, image);
        resolve();
      }, { once: true });
      image.addEventListener("error", reject, { once: true });
      image.src = embeddedMotionAssets[url] || url;
    }))).then(() => {
      if (token === naturalLoadToken) naturalMotionReady = true;
    }).catch(() => {
      if (token === naturalLoadToken) naturalMotionReady = false;
    });
  }

  function loadPet(petId) {
    activePet = catalog.find((item) => item.id === petId) || catalog[0] || activePet;
    localStorage.setItem(ACTIVE_PET_KEY, activePet.id);
    document.documentElement.style.setProperty("--orange", activePet.accentColor || "#df8c43");
    prepareNaturalMotions(activePet.naturalMotions || [activePet.naturalMotion].filter(Boolean));
    spriteReady = false;
    if (activePet.spriteUrl) {
      sprite.src = activePet.spriteUrl;
      setStatus(`正在叫醒${activePet.name}…`);
    } else {
      sprite.removeAttribute("src");
      setStatus(`${activePet.name}等待動畫圖檔`);
    }
  }

  for (const item of catalog) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    petSelect.append(option);
  }
  petSelect.value = activePet.id;
  petSelect.addEventListener("change", () => {
    loadPet(petSelect.value);
    engine.trigger("idle", performance.now(), { reason: "pet-change" });
    showReaction(`${activePet.name}來了`);
  });

  function scheduleDesktopRoam(now) {
    pet.nextRoamAt = now + core.randomBetween(
      engine.config.desktop.roamMinDelayMs,
      engine.config.desktop.roamMaxDelayMs,
    );
  }

  async function maybeRoam(now) {
    if (!isDesktop || !engine.config.desktop.roamEnabled || pet.dragging || !globalThis.xiaodaiDesktop?.roam) return;
    if (!pet.nextRoamAt) scheduleDesktopRoam(now);
    if (now < pet.nextRoamAt || now < pet.roamUntil || engine.current.name !== "idle") return;
    const direction = Math.random() < 0.5 ? "left" : "right";
    const distance = Math.round(core.randomBetween(90, 260));
    const duration = Math.round(core.randomBetween(2400, 5200));
    pet.roamUntil = now + duration;
    pet.gait = "walk";
    engine.trigger(direction === "left" ? "walkLeft" : "walkRight", now, {
      reason: "desktop-roam",
      playbackRate: 0.72,
    });
    try {
      await globalThis.xiaodaiDesktop.roam({ dx: direction === "left" ? -distance : distance, duration });
    } finally {
      engine.releaseDrag(performance.now());
      scheduleDesktopRoam(performance.now());
    }
  }

  sprite.addEventListener("load", () => {
    spriteReady = true;
    setStatus(`${activePet.name}醒來了`);
  });
  sprite.addEventListener("error", () => {
    spriteReady = false;
    setStatus(`${activePet.name}等待動畫圖檔`);
  });

  syncInputs();
  scheduleDesktopRoam(performance.now());
  loadPet(activePet.id);
  requestAnimationFrame(render);
})();

