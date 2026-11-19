(function startXiaodaiCompanion() {
  "use strict";

  const core = globalThis.XiaodaiCore;
  if (!core) throw new Error("XiaodaiCore is unavailable");
  const motionCore = globalThis.XiaodaiMotion;

  const STORAGE_KEY = "xiaodai-companion:settings:v3";
  const AFFECTION_KEY = "xiaodai-companion:affection:v1";
  const ACTIVE_PET_KEY = "xiaodai-companion:active-pet:v1";
  const catalog = Array.isArray(globalThis.XIAODAI_PET_CATALOG) ? globalThis.XIAODAI_PET_CATALOG : [];
  const embeddedMotionAssets = globalThis.XIAODAI_MOTION_ASSETS || {};
  const isDesktop = Boolean(globalThis.xiaodaiDesktop) || new URLSearchParams(location.search).get("mode") === "desktop";
  document.body.classList.toggle("desktop-mode", isDesktop);

  const canvas = document.querySelector("#pet-canvas");
  const context = canvas.getContext("2d", { alpha: true });
  const stage = document.querySelector("#pet-stage");
  if (isDesktop) {
    const fitCanvasWithoutDistortion = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const aspect = canvas.width / canvas.height;
      const displayWidth = Math.min(width * 0.88, height * 0.82 * aspect);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayWidth / aspect}px`;
    };
    new ResizeObserver(fitCanvasWithoutDistortion).observe(stage);
    fitCanvasWithoutDistortion();
  }
  const statusPill = document.querySelector("#status-pill");
  const reaction = document.querySelector("#reaction");
  const settingsPanel = document.querySelector("#settings-panel");
  const settingsToggle = document.querySelector("#settings-toggle");
  const settingsClose = document.querySelector("#settings-close");
  const affectionLabel = document.querySelector("#affection");
  const desktopRoamRow = document.querySelector(".desktop-setting");
  const closeCompanion = document.querySelector("#close-companion");
  const settingsCloseApp = document.querySelector("#settings-close-app");
  const petSelect = document.querySelector("#pet-select");
  const settingsPetSelect = document.querySelector("#settings-pet-select");

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
  let naturalSettleMotion = null;
  let lastSettleVariant = null;
  let naturalSettle = null;
  let naturalStop = null;
  let naturalTurnMotion = null;
  let naturalTurn = null;
  let naturalPostureMotion = null;
  let naturalStepMotion = null;
  let naturalStep = null;
  let naturalStart = null;
  let naturalSitDown = null;
  let locomotionMirror = null;
  let turnCandidateAt = 0;
  let activeNaturalGait = null;
  let gaitSwitchAfter = 0;
  let lastDrawnNaturalUrl = null;
  let lastDrawnNaturalMirror = false;
  let lastDrawnNaturalScale = 1;
  let lastEngineSequence = engine.current.name;
  let naturalPose = "sit";
  let naturalPoseUntil = 0;
  let pendingNaturalReaction = null;

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
    roamMotion: null,
    gait: "walk",
    dragDirection: "right",
    dragLastMovedAt: 0,
    dragStationary: true,
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

  function drawNaturalLayer(image, alpha, breathScale, mirror = false, displayScale = 1, offsetX = 0) {
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return;
    const scale = Math.min(pet.width / image.naturalWidth, pet.height / image.naturalHeight) * displayScale;
    const drawWidth = image.naturalWidth * scale;
    const baseHeight = image.naturalHeight * scale;
    const drawHeight = baseHeight * breathScale;
    const groundY = pet.y + pet.height / 2;
    const drawX = pet.x - drawWidth / 2 + offsetX;
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
    const previousMirror = state.previousMirror ?? state.mirror;
    const anchorPosition = (image, anchor, mirror, scale) => {
      if (!image?.naturalWidth || !Number.isFinite(anchor)) return undefined;
      const width = image.naturalWidth * Math.min(pet.width / image.naturalWidth, pet.height / image.naturalHeight) * scale;
      return pet.x + width * ((mirror ? 1 - anchor : anchor) - 0.5);
    };
    const offsets = globalThis.XiaodaiCrossfade.anchorOffsets(
      anchorPosition(previous, state.previousAnchorX, previousMirror, state.previousDisplayScale || 1),
      anchorPosition(current, state.anchorX, state.mirror, state.displayScale || 1),
      state.blend,
    );
    globalThis.XiaodaiCrossfade.drawCrossfade(
      context,
      previous ? (alpha) => drawNaturalLayer(previous, alpha, state.breathScale,
        previousMirror, state.previousDisplayScale || 1, offsets.previous) : null,
      (alpha) => drawNaturalLayer(current, alpha, state.breathScale,
        state.mirror, state.displayScale || 1, offsets.current),
      state.blend,
    );
    lastDrawnNaturalUrl = state.url;
    lastDrawnNaturalMirror = Boolean(state.mirror);
    lastDrawnNaturalScale = state.displayScale || 1;
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
    if (naturalSettle && engine.current.name !== "idle") naturalSettle = null;
    if (naturalStop && engine.current.name !== "idle") naturalStop = null;
    if (naturalSitDown && engine.current.name !== "idle") naturalSitDown = null;
    if (pet.roamMotion && !pet.dragging && engine.current.reason === "desktop-roam") {
      const roam = pet.roamMotion;
      engine.current.playbackRate = core.roamPlaybackRate(roam.distance, roam.duration, now - roam.startedAt);
    }
    if (naturalPose === "lie" && engine.current.name === "idle") {
      if (now >= naturalPoseUntil) {
        engine.trigger("getUp", now, { reason: "natural-pose-change" });
      } else {
        engine.nextIdleActionAt = Number.POSITIVE_INFINITY;
      }
    }
    const sequenceBeforeTick = engine.current.name;
    const transitionActive = naturalTransitionPlayer && ["lieDown", "getUp"].includes(sequenceBeforeTick);
    const holdSequence = transitionActive && !naturalTransitionPlayer.tick(now).complete;
    const frame = engine.tick(now, { holdSequence });
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
      if (["walkLeft", "walkRight"].includes(engine.current.name)
          && ["idle", "lieDown", "getUp"].includes(previousEngineSequence) && naturalMotionReady) {
        const fromLie = naturalPose === "lie";
        let recoveryFrames = null;
        if (naturalTransitionPlayer && ["lieDown", "getUp"].includes(previousEngineSequence)) {
          const { frames, frameIndex } = naturalTransitionPlayer;
          recoveryFrames = previousEngineSequence === "lieDown"
            ? frames.slice(0, frameIndex + 1).reverse()
            : frames.slice(frameIndex);
        }
        startNaturalPosture("rise", engine.current.name === "walkRight", now, { fromLie, recoveryFrames });
        if (fromLie || recoveryFrames) activateNaturalPose("sit", now);
      }
      if (engine.current.name === "lieDown") {
        activateNaturalTransition("sit", "lie", false, now);
      } else if (engine.current.name === "getUp") {
        activateNaturalTransition("sit", "lie", true, now);
      } else if (engine.current.name === "idle" && ["walkLeft", "walkRight"].includes(previousEngineSequence)) {
        activateNaturalPose("sit", now);
        if (naturalMotionPlayer && lastDrawnNaturalUrl && !naturalSettle) {
          naturalMotionPlayer.previousUrl = lastDrawnNaturalUrl;
          naturalMotionPlayer.previousMirror = lastDrawnNaturalMirror;
          naturalMotionPlayer.previousDisplayScale = lastDrawnNaturalScale;
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
      const desiredMirror = locomotionDirection === "right";
      if (locomotionMirror == null) locomotionMirror = desiredMirror;
      if (!naturalTurnMotion) locomotionMirror = desiredMirror;
      if (!naturalTurn && !naturalStart && !naturalStep && desiredMirror === locomotionMirror) turnCandidateAt = 0;
      else if (!naturalTurn && !naturalStart && !naturalStep && naturalTurnMotion && desiredMirror !== locomotionMirror) {
        if (!turnCandidateAt) turnCandidateAt = now;
        if (now - turnCandidateAt >= 120) {
          startNaturalTurn(locomotionMirror, desiredMirror, now);
          turnCandidateAt = 0;
        }
      }
      if (!naturalLocomotionPlayer || (!naturalStep && now >= gaitSwitchAfter && activeNaturalGait !== pet.gait && naturalLocomotionPlayer.canSwitchGait())) {
        activateNaturalLocomotion(pet.gait, now);
      }
    } else {
      naturalLocomotionPlayer = null;
      activeNaturalGait = null;
      naturalTurn = null;
      naturalStart = null;
      naturalStep = null;
      locomotionMirror = null;
      turnCandidateAt = 0;
    }
    if (pendingNaturalReaction && engine.current.name === "idle" && naturalMotionReady && naturalMotionPlayer) {
      naturalMotionPlayer.startVariantById?.(pendingNaturalReaction, now, { startIndex: 1 });
      pendingNaturalReaction = null;
    }
    const lookFrame = currentLookFrame(now);
    let naturalState = null;
    let drewNaturalFrame = false;
    if (naturalMotionReady && naturalLocomotionPlayer && locomotionDirection && naturalStart) {
      naturalLocomotionPlayer.tick(now, { paused: true });
      naturalState = naturalStart.player.tick(now, { paused: isDesktop && pet.dragging && pet.dragStationary });
      drewNaturalFrame = drawNaturalFrame(naturalState);
      if (naturalState.complete) {
        if (!startNaturalStep(locomotionMirror, now)) {
          naturalLocomotionPlayer.previousUrl = naturalState.url;
          naturalLocomotionPlayer.previousDisplayScale = naturalState.displayScale;
          naturalLocomotionPlayer.transitionStartedAt = now;
        }
        naturalStart = null;
      }
    } else if (naturalMotionReady && naturalLocomotionPlayer && locomotionDirection && naturalTurn) {
      naturalLocomotionPlayer.tick(now, { paused: true });
      naturalState = naturalTurn.player.tick(now, { paused: isDesktop && pet.dragging && pet.dragStationary });
      drewNaturalFrame = drawNaturalFrame(naturalState);
      if (naturalState.complete) {
        locomotionMirror = naturalTurn.targetMirror;
        if (!startNaturalStep(locomotionMirror, now)) {
          naturalLocomotionPlayer.previousUrl = naturalState.url;
          naturalLocomotionPlayer.previousDisplayScale = naturalState.displayScale;
          naturalLocomotionPlayer.transitionStartedAt = now;
        }
        naturalTurn = null;
      }
    } else if (naturalMotionReady && naturalLocomotionPlayer && locomotionDirection && naturalStep) {
      naturalLocomotionPlayer.tick(now, { paused: true });
      naturalState = naturalStep.player.tick(now, { paused: isDesktop && pet.dragging && pet.dragStationary });
      drewNaturalFrame = drawNaturalFrame(naturalState);
      if (naturalState.complete) {
        naturalStep = null;
        activateNaturalLocomotion("walk", now, { entryFrame: 0 });
        gaitSwitchAfter = now + 150;
      }
    } else if (naturalMotionReady && naturalLocomotionPlayer && locomotionDirection) {
      naturalState = naturalLocomotionPlayer.tick(now, {
        playbackRate: engine.current.playbackRate,
        paused: pet.dragging && pet.dragStationary,
      });
      naturalState.mirror = locomotionMirror ?? (locomotionDirection === "right");
      drewNaturalFrame = drawNaturalFrame(naturalState);
    } else if (naturalMotionReady && naturalTransitionPlayer && ["lieDown", "getUp"].includes(engine.current.name)) {
      naturalState = naturalTransitionPlayer.tick(now);
      drewNaturalFrame = drawNaturalFrame(naturalState);
    } else if (engine.current.name === "idle" && naturalMotionReady && naturalMotionPlayer && naturalStop) {
      naturalState = naturalStop.player.tick(now);
      naturalState.mirror = naturalStop.mirror;
      drewNaturalFrame = drawNaturalFrame(naturalState);
      if (naturalState.complete) {
        naturalStop = null;
        startNaturalSettle(now);
      }
    } else if (engine.current.name === "idle" && naturalMotionReady && naturalMotionPlayer && naturalSettle) {
      naturalState = naturalSettle.player.tick(now);
      naturalState.mirror = naturalSettle.mirror;
      naturalState.previousMirror = naturalSettle.mirror;
      if (!naturalState.complete) {
        drewNaturalFrame = drawNaturalFrame(naturalState);
      } else {
        const settleMirror = naturalSettle.mirror;
        naturalSettle = null;
        if (startNaturalPosture("sit", settleMirror, now)) {
          naturalState = naturalSitDown.player.tick(now);
          drewNaturalFrame = drawNaturalFrame(naturalState);
        } else {
          naturalMotionPlayer.previousUrl = naturalState.url;
          naturalMotionPlayer.previousMirror = settleMirror;
          naturalMotionPlayer.previousDisplayScale = naturalState.displayScale;
          naturalMotionPlayer.transitionStartedAt = now;
          naturalState = naturalMotionPlayer.tick(now, { enabled: true });
          drewNaturalFrame = drawNaturalFrame(naturalState);
        }
      }
    } else if (engine.current.name === "idle" && naturalMotionReady && naturalMotionPlayer && naturalSitDown) {
      naturalState = naturalSitDown.player.tick(now);
      drewNaturalFrame = drawNaturalFrame(naturalState);
      if (naturalState.complete) naturalSitDown = null;
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

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const point = canvasPoint(event);
    pet.dragging = true;
    naturalSettle = null;
    pet.roamMotion = null;
    pet.pointerId = event.pointerId;
    pet.lastPointer = { ...point, screenX: event.screenX, screenY: event.screenY, time: performance.now() };
    pet.dragDistance = 0;
    pet.lastInteractionAt = performance.now();
    pet.dragLastMovedAt = pet.lastInteractionAt;
    pet.dragStationary = true;
    canvas.setPointerCapture(event.pointerId);
    globalThis.xiaodaiDesktop?.beginDrag?.();
  });

  canvas.addEventListener("pointermove", (event) => {
    const now = performance.now();
    const point = canvasPoint(event);
    const petScreenX = canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2;
    const petScreenY = canvas.getBoundingClientRect().top + canvas.getBoundingClientRect().height / 2;
    pet.targetLookAngle = Math.atan2(event.clientY - petScreenY, event.clientX - petScreenX);
    pet.pointerInside = true;

    if (!pet.dragging || event.pointerId !== pet.pointerId) return;
    if (!isDesktop) {
      const current = { ...point, time: now };
      const velocity = core.pointerVelocity(current, pet.lastPointer);
      pet.dragDistance += Math.hypot(velocity.dx, velocity.dy);
      pet.dragDirection = core.stableDragDirection(pet.dragDirection, velocity.dx);
      const dragState = engine.setDragState(pet.dragDirection, velocity.speed, now);
      pet.gait = dragState.gait;
      const dx = current.x - pet.lastPointer.x;
      const dy = current.y - pet.lastPointer.y;
      pet.x = core.clamp(pet.x + dx, pet.width / 2, canvas.width - pet.width / 2);
      pet.y = core.clamp(pet.y + dy, pet.height / 2, canvas.height - pet.height / 2);
      pet.lastPointer = current;
    }
  });

  globalThis.xiaodaiDesktop?.onDragSample?.((sample) => {
    if (!pet.dragging) return;
    const now = performance.now();
    const distance = Math.hypot(sample.dx, sample.dy);
    pet.dragDistance += distance;
    if (distance > 0.15) {
      pet.dragLastMovedAt = now;
      pet.dragStationary = false;
      pet.dragDirection = core.stableDragDirection(pet.dragDirection, sample.dx);
      const dragState = engine.setDragState(pet.dragDirection, sample.speed, now);
      pet.gait = dragState.gait;
    } else if (now - pet.dragLastMovedAt >= 220) {
      pet.dragStationary = true;
    }
  });

  function finishDrag(event) {
    if (!pet.dragging || event.pointerId !== pet.pointerId) return;
    const wasClick = pet.dragDistance < 8;
    pet.dragging = false;
    pet.dragStationary = true;
    pet.pointerId = null;
    pet.lastPointer = null;
    globalThis.xiaodaiDesktop?.endDrag?.();
    if (!wasClick && (naturalTurn || naturalStart || naturalStep)) {
      naturalTurn = null;
      naturalStart = null;
      naturalStep = null;
      startNaturalSettle(performance.now());
    } else if (!wasClick) requestNaturalStop(performance.now());
    engine.releaseDrag(performance.now());
    pet.gait = "walk";
    pet.dragDirection = lastDrawnNaturalMirror ? "right" : "left";
    if (wasClick) {
      addAffection(1);
      pendingNaturalReaction = naturalPose === "lie" ? "lie-slow-blink" : "slow-blink";
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

  canvas.addEventListener("contextmenu", (event) => {
    if (!isDesktop) return;
    event.preventDefault();
    toggleSettings(true);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !settingsPanel.hidden) toggleSettings(false);
  });

  document.querySelector("[data-action='pet']").addEventListener("click", () => {
    addAffection(1);
    engine.trigger("wave", performance.now(), { reason: "button:pet" });
    showReaction("♡ 呼嚕呼嚕");
  });
  document.querySelector("[data-action='call']").addEventListener("click", () => {
    engine.trigger("lookAround", performance.now(), { reason: "button:call" });
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
  settingsCloseApp.addEventListener("click", () => globalThis.xiaodaiDesktop?.close?.());

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

  function activateNaturalLocomotion(gait, now = performance.now(), options = {}) {
    const motion = naturalLocomotionByGait.get(gait) || naturalLocomotionByGait.get("walk");
    const initialPhase = naturalLocomotionPlayer?.getPhase?.() ?? 0;
    activeNaturalGait = motion?.gait || gait;
    naturalLocomotionPlayer = motion && motionCore?.NaturalCyclePlayer
      ? new motionCore.NaturalCyclePlayer(motion, {
        now,
        initialPhase,
        entryFrame: options.entryFrame ?? (naturalLocomotionPlayer ? motion?.gaitEntryFrame : undefined),
        entryFrames: options.entryFrame == null && naturalLocomotionPlayer ? motion?.gaitEntryFrames : undefined,
        previousUrl: lastDrawnNaturalUrl || naturalMotionPlayer?.currentUrl || null,
        previousDisplayScale: lastDrawnNaturalScale,
      })
      : null;
  }

  function startNaturalSettle(now) {
    if (!naturalMotionReady || !naturalSettleMotion?.neutralFrameUrl || !lastDrawnNaturalUrl || !motionCore?.NaturalSequencePlayer) return;
    const variant = motionCore.chooseSequenceVariant(naturalSettleMotion, lastSettleVariant);
    if (!variant) return;
    lastSettleVariant = variant.id;
    naturalSettle = {
      mirror: lastDrawnNaturalMirror,
      player: new motionCore.NaturalSequencePlayer({ ...naturalSettleMotion, variants: [variant] }, {
        now,
        previousUrl: lastDrawnNaturalUrl,
        previousDisplayScale: lastDrawnNaturalScale,
      }),
    };
  }

  function startNaturalStep(mirror, now) {
    const source = naturalStepMotion?.variants?.[0]?.frames;
    if (!source?.length || !motionCore?.NaturalSequencePlayer) return false;
    const motion = { ...naturalStepMotion, variants: [{ frames: source.map((frame) => ({ ...frame, mirror })) }] };
    naturalStep = { player: new motionCore.NaturalSequencePlayer(motion, {
      now, previousUrl: lastDrawnNaturalUrl, previousMirror: lastDrawnNaturalMirror,
      previousDisplayScale: lastDrawnNaturalScale, previousAnchorX: 0.12,
    }) };
    return true;
  }

  function startNaturalTurn(fromMirror, targetMirror, now) {
    const frames = naturalTurnMotion?.variants?.[0]?.frames;
    if (!frames || frames.length < 4 || !motionCore?.NaturalSequencePlayer) return;
    const [side, nearSide, quarter, front] = frames;
    const turnMotion = {
      transitionMs: naturalTurnMotion.transitionMs,
      variants: [{ frames: [
        { ...side, mirror: fromMirror },
        { ...nearSide, mirror: fromMirror },
        { ...quarter, mirror: fromMirror },
        { ...front, mirror: false },
        { ...quarter, mirror: targetMirror },
        { ...nearSide, mirror: targetMirror },
        { ...side, mirror: targetMirror },
      ] }],
    };
    naturalTurn = {
      targetMirror,
      player: new motionCore.NaturalSequencePlayer(turnMotion, {
        now, previousUrl: lastDrawnNaturalUrl, previousMirror: lastDrawnNaturalMirror,
        previousDisplayScale: lastDrawnNaturalScale, previousAnchorX: 0.12,
      }),
    };
  }

  function startNaturalPosture(kind, mirror, now, options = {}) {
    const source = naturalPostureMotion?.variants?.[0]?.frames;
    const seated = naturalMotionByPose.get("sit")?.neutralFrameUrl;
    if (!source || source.length < 6 || !seated || !motionCore?.NaturalSequencePlayer) return false;
    const [rising, halfway, front, quarter, nearSide, side] = source;
    const riseFrames = [
      { ...rising, mirror: false },
      { ...halfway, mirror: false },
      { ...front, mirror: false },
      { ...quarter, mirror },
      { ...nearSide, mirror },
      { ...side, mirror },
    ];
    let frames = kind === "rise" ? riseFrames : [
      ...riseFrames.slice(0, -1).reverse(),
      { url: seated, durationMs: 180, displayScale: 1, mirror: false, anchorX: 0.74 },
    ];
    if (kind === "rise" && options.recoveryFrames?.length) {
      frames = [...options.recoveryFrames.map((frame) => ({ ...frame, durationMs: 140 })), ...riseFrames];
    } else if (kind === "rise" && options.fromLie) {
      const transition = naturalTransitionByKey.get(transitionKey("sit", "lie"))?.variants?.[0]?.frames;
      if (transition?.length > 1) {
        const gettingUp = transition.slice(0, -1).reverse().map((frame) => ({ ...frame, durationMs: 140 }));
        frames = [...gettingUp, ...riseFrames];
      }
    }
    const postureMotion = { transitionMs: naturalPostureMotion.transitionMs, variants: [{ frames }] };
    const player = new motionCore.NaturalSequencePlayer(postureMotion, {
      now, previousUrl: lastDrawnNaturalUrl, previousMirror: lastDrawnNaturalMirror,
      previousDisplayScale: lastDrawnNaturalScale,
      previousAnchorX: (options.fromLie || options.recoveryFrames) ? undefined : (kind === "rise" ? 0.74 : 0.12),
    });
    if (kind === "rise") naturalStart = { player };
    else naturalSitDown = { player };
    return true;
  }

  function requestNaturalStop(now) {
    if (!naturalLocomotionPlayer || !motionCore?.NaturalStopPlayer) {
      startNaturalSettle(now);
      return;
    }
    naturalStop = {
      mirror: lastDrawnNaturalMirror,
      player: new motionCore.NaturalStopPlayer(naturalLocomotionPlayer, now, {
        playbackRate: engine.current.playbackRate,
      }),
    };
  }

  function prepareNaturalMotions(motions) {
    const token = ++naturalLoadToken;
    naturalImages.clear();
    lastDrawnNaturalUrl = null;
    lastDrawnNaturalMirror = false;
    lastDrawnNaturalScale = 1;
    naturalMotionByPose.clear();
    naturalTransitionByKey.clear();
    naturalLocomotionByGait.clear();
    naturalSettleMotion = null;
    lastSettleVariant = null;
    naturalTurnMotion = null;
    naturalPostureMotion = null;
    naturalStepMotion = null;
    naturalStep = null;
    gaitSwitchAfter = 0;
    naturalStart = null;
    naturalSitDown = null;
    naturalTurn = null;
    locomotionMirror = null;
    turnCandidateAt = 0;
    naturalSettle = null;
    naturalStop = null;
    naturalMotionReady = false;
    for (const motion of motions || []) {
      if (motion?.intent === "startStep") {
        naturalStepMotion = motion;
      } else if (motion?.intent === "posture") {
        naturalPostureMotion = motion;
      } else if (motion?.intent === "turn") {
        naturalTurnMotion = motion;
      } else if (motion?.intent === "settle") {
        naturalSettleMotion = motion;
      } else if (motion?.intent === "transition" && motion?.fromPose && motion?.toPose) {
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
    const naturalMotions = activePet.naturalMotions || [activePet.naturalMotion].filter(Boolean);
    const naturalOnlyActions = core.DEFAULT_CONFIG.actions.filter((action) => action.sequence === "lieDown");
    engine.updateConfig({
      actions: naturalMotions.length ? naturalOnlyActions : structuredClone(core.DEFAULT_CONFIG.actions),
    });
    engine.scheduleNextIdle(performance.now());
    prepareNaturalMotions(naturalMotions);
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
    settingsPetSelect.append(option.cloneNode(true));
  }
  petSelect.value = activePet.id;
  settingsPetSelect.value = activePet.id;
  function changePet(petId) {
    loadPet(petId);
    petSelect.value = activePet.id;
    settingsPetSelect.value = activePet.id;
    engine.trigger("idle", performance.now(), { reason: "pet-change" });
    showReaction(`${activePet.name}來了`);
  }
  petSelect.addEventListener("change", () => changePet(petSelect.value));
  settingsPetSelect.addEventListener("change", () => changePet(settingsPetSelect.value));

  function scheduleDesktopRoam(now) {
    pet.nextRoamAt = now + core.randomBetween(
      engine.config.desktop.roamMinDelayMs,
      engine.config.desktop.roamMaxDelayMs,
    );
  }

  let roamPlanning = false;
  async function maybeRoam(now) {
    if (!isDesktop || !engine.config.desktop.roamEnabled || pet.dragging || roamPlanning || !globalThis.xiaodaiDesktop?.roam || !globalThis.xiaodaiDesktop?.planRoam) return;
    if (!pet.nextRoamAt) scheduleDesktopRoam(now);
    if (now < pet.nextRoamAt || now < pet.roamUntil || engine.current.name !== "idle") return;
    const preferredDirection = Math.random() < 0.5 ? "left" : "right";
    roamPlanning = true;
    let plan;
    try {
      plan = await globalThis.xiaodaiDesktop.planRoam({
      direction: preferredDirection,
      distance: Math.round(core.randomBetween(240, 720)),
      duration: Math.round(core.randomBetween(6000, 14000)),
      minimumDistance: 36,
      });
    } finally {
      roamPlanning = false;
    }
    if (pet.dragging || !engine.config.desktop.roamEnabled || engine.current.name !== "idle") return;
    if (!plan?.direction || !plan.duration || !plan.dx) {
      scheduleDesktopRoam(performance.now());
      return;
    }
    const roamStartedAt = performance.now();
    pet.roamMotion = { startedAt: roamStartedAt, duration: plan.duration, distance: Math.abs(plan.dx) };
    pet.roamUntil = roamStartedAt + plan.duration;
    pet.gait = "walk";
    engine.trigger(plan.direction === "left" ? "walkLeft" : "walkRight", roamStartedAt, {
      reason: "desktop-roam",
      playbackRate: 0.2,
    });
    try {
      await globalThis.xiaodaiDesktop.roam({ dx: plan.dx, duration: plan.duration });
    } finally {
      pet.roamMotion = null;
      if (!pet.dragging && engine.current.reason === "desktop-roam") {
        requestNaturalStop(performance.now());
        engine.releaseDrag(performance.now());
      }
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

