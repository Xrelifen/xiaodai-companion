(function attachXiaodaiMotion(global) {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sampleDuration(value, rng = Math.random) {
    if (Array.isArray(value)) {
      const min = Number(value[0]) || 0;
      const max = Number(value[1]) || min;
      return min + (Math.max(min, max) - min) * rng();
    }
    return Math.max(0, Number(value) || 0);
  }

  function weightedChoice(items, rng = Math.random) {
    if (!items.length) return null;
    const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);
    if (total <= 0) return items[Math.floor(rng() * items.length)] ?? items[0];
    let cursor = rng() * total;
    for (const item of items) {
      cursor -= Math.max(0, Number(item.weight) || 0);
      if (cursor < 0) return item;
    }
    return items.at(-1);
  }

  function easeInOut(value) {
    const progress = clamp(value, 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  function chooseSequenceVariant(motion, lastId, rng = Math.random) {
    const usable = (motion?.variants || []).filter((variant) => variant?.frames?.length);
    const alternatives = usable.filter((variant) => variant.id !== lastId);
    return weightedChoice(alternatives.length ? alternatives : usable, rng);
  }

  class NaturalMotionPlayer {
    constructor(motion, options = {}) {
      this.rng = options.rng ?? Math.random;
      this.cooldowns = new Map();
      this.lastVariantId = null;
      this.variant = null;
      this.frames = [];
      this.frameIndex = -1;
      this.frameEndsAt = 0;
      this.currentUrl = null;
      this.previousUrl = null;
      this.previousMirror = false;
      this.currentDisplayScale = 1;
      this.previousDisplayScale = 1;
      this.transitionStartedAt = 0;
      this.setMotion(motion, options.now ?? 0);
    }

    setMotion(motion, now = 0) {
      this.motion = motion || null;
      this.neutralUrl = motion?.neutralFrameUrl || motion?.variants?.[0]?.frames?.[0]?.url || null;
      this.transitionMs = Math.max(0, Number(motion?.transitionMs) || 135);
      this.cooldowns.clear();
      this.lastVariantId = null;
      this.variant = null;
      this.frames = [];
      this.frameIndex = -1;
      this.currentUrl = this.neutralUrl;
      this.previousUrl = null;
      this.previousMirror = false;
      this.currentDisplayScale = Number(motion?.displayScale) || 1;
      this.previousDisplayScale = 1;
      this.transitionStartedAt = now;
      this.scheduleNext(now);
    }

    scheduleNext(now) {
      this.nextVariantAt = now + sampleDuration(this.motion?.idleGapMs ?? [800, 3200], this.rng);
      return this.nextVariantAt;
    }

    availableVariants(now) {
      const variants = this.motion?.variants || [];
      let candidates = variants.filter((variant) => (this.cooldowns.get(variant.id) || 0) <= now);
      if (candidates.length > 1 && this.lastVariantId) {
        candidates = candidates.filter((variant) => variant.id !== this.lastVariantId);
      }
      if (!candidates.length) {
        candidates = variants.filter((variant) => variant.id !== this.lastVariantId);
      }
      return candidates.length ? candidates : variants;
    }

    startVariant(now) {
      const variant = weightedChoice(this.availableVariants(now), this.rng);
      if (!variant?.frames?.length) {
        this.scheduleNext(now);
        return null;
      }
      return this.beginVariant(variant, now);
    }

    beginVariant(variant, now, options = {}) {
      this.variant = variant;
      this.frames = variant.frames.map((frame) => ({
        ...frame,
        sampledDurationMs: Math.max(1, sampleDuration(frame.durationMs, this.rng)),
      }));
      const startIndex = clamp(Number(options.startIndex) || 0, 0, this.frames.length - 1);
      this.frameIndex = startIndex;
      this.enterFrame(startIndex, now);
      return variant;
    }

    startVariantById(variantId, now, options = {}) {
      const variant = (this.motion?.variants || []).find((item) => item.id === variantId);
      if (!variant?.frames?.length) return null;
      return this.beginVariant(variant, now, options);
    }

    enterFrame(index, now) {
      const frame = this.frames[index];
      const nextUrl = frame?.url || this.neutralUrl;
      const nextDisplayScale = Number(frame?.displayScale) || Number(this.motion?.displayScale) || 1;
      if (nextUrl && nextUrl !== this.currentUrl) {
        this.previousUrl = this.currentUrl;
        this.previousMirror = false;
        this.previousDisplayScale = this.currentDisplayScale;
        this.currentUrl = nextUrl;
        this.currentDisplayScale = nextDisplayScale;
        this.transitionStartedAt = now;
      }
      this.frameIndex = index;
      this.frameEndsAt = now + (frame?.sampledDurationMs || 1);
    }

    completeVariant(now) {
      if (this.variant) {
        this.lastVariantId = this.variant.id;
        this.cooldowns.set(this.variant.id, now + Math.max(0, Number(this.variant.cooldownMs) || 0));
      }
      this.variant = null;
      this.frames = [];
      this.frameIndex = -1;
      if (this.currentUrl !== this.neutralUrl) {
        this.previousUrl = this.currentUrl;
        this.previousMirror = false;
        this.previousDisplayScale = this.currentDisplayScale;
        this.currentUrl = this.neutralUrl;
        this.currentDisplayScale = Number(this.motion?.displayScale) || 1;
        this.transitionStartedAt = now;
      }
      this.scheduleNext(now);
    }

    pause(now) {
      this.variant = null;
      this.frames = [];
      this.frameIndex = -1;
      this.currentUrl = this.neutralUrl;
      this.previousUrl = null;
      this.currentDisplayScale = Number(this.motion?.displayScale) || 1;
      this.previousDisplayScale = 1;
      this.transitionStartedAt = now;
      this.scheduleNext(now);
    }

    tick(now, options = {}) {
      if (!this.motion || options.enabled === false) {
        if (this.variant) this.pause(now);
        return null;
      }

      if (!this.variant && now >= this.nextVariantAt) this.startVariant(now);
      let safety = 0;
      while (this.variant && now >= this.frameEndsAt && safety < 32) {
        safety += 1;
        const nextIndex = this.frameIndex + 1;
        if (nextIndex >= this.frames.length) {
          this.completeVariant(this.frameEndsAt);
          break;
        }
        this.enterFrame(nextIndex, this.frameEndsAt);
      }

      const linearBlend = this.previousUrl
        ? clamp((now - this.transitionStartedAt) / Math.max(1, this.transitionMs), 0, 1)
        : 1;
      const blend = easeInOut(linearBlend);
      if (blend >= 1) this.previousUrl = null;
      const breathPhase = (now % 3600) / 3600 * Math.PI * 2;

      return {
        url: this.currentUrl || this.neutralUrl,
        previousUrl: this.previousUrl,
        previousMirror: this.previousMirror,
        blend,
        variantId: this.variant?.id || null,
        frameIndex: this.frameIndex,
        breathScale: 1 + Math.sin(breathPhase) * 0.0055,
        displayScale: this.currentDisplayScale,
        previousDisplayScale: this.previousDisplayScale,
      };
    }
  }

  class NaturalSequencePlayer {
    constructor(motion, options = {}) {
      this.rng = options.rng ?? Math.random;
      this.motion = motion || null;
      this.transitionMs = Math.max(0, Number(motion?.transitionMs) || 150);
      const sourceFrames = motion?.variants?.[0]?.frames || [];
      const orderedFrames = options.reverse ? [...sourceFrames].reverse() : sourceFrames;
      this.frames = orderedFrames.map((frame) => ({
        ...frame,
        sampledDurationMs: Math.max(1, sampleDuration(frame.durationMs, this.rng)),
      }));
      this.frameIndex = 0;
      this.currentUrl = this.frames[0]?.url || motion?.neutralFrameUrl || null;
      this.previousUrl = options.previousUrl || null;
      this.currentMirror = Boolean(this.frames[0]?.mirror);
      this.previousMirror = Boolean(options.previousMirror);
      this.currentAnchorX = this.frames[0]?.anchorX;
      this.previousAnchorX = options.previousAnchorX;
      this.currentDisplayScale = Number(this.frames[0]?.displayScale) || Number(motion?.displayScale) || 1;
      this.previousDisplayScale = Number(options.previousDisplayScale) || 1;
      this.currentOffsetY = Number(this.frames[0]?.offsetY) || 0;
      this.previousOffsetY = Number(options.previousOffsetY) || 0;
      this.transitionStartedAt = options.now ?? 0;
      this.frameEndsAt = (options.now ?? 0) + (this.frames[0]?.sampledDurationMs || 1);
      this.lastTickAt = options.now ?? 0;
      this.complete = this.frames.length === 0;
    }

    enterFrame(index, now) {
      const frame = this.frames[index];
      const nextUrl = frame?.url || this.currentUrl;
      const nextDisplayScale = Number(frame?.displayScale) || Number(this.motion?.displayScale) || 1;
      const nextOffsetY = Number(frame?.offsetY) || 0;
      if (nextUrl && (nextUrl !== this.currentUrl || Boolean(frame?.mirror) !== this.currentMirror || nextDisplayScale !== this.currentDisplayScale || nextOffsetY !== this.currentOffsetY)) {
        this.previousUrl = this.currentUrl;
        this.previousMirror = this.currentMirror;
        this.previousAnchorX = this.currentAnchorX;
        this.previousDisplayScale = this.currentDisplayScale;
        this.previousOffsetY = this.currentOffsetY;
        this.currentUrl = nextUrl;
        this.currentMirror = Boolean(frame?.mirror);
        this.currentAnchorX = frame?.anchorX;
        this.currentDisplayScale = nextDisplayScale;
        this.currentOffsetY = nextOffsetY;
        this.transitionStartedAt = now;
      }
      this.frameIndex = index;
      this.frameEndsAt = now + (frame?.sampledDurationMs || 1);
    }

    tick(now, options = {}) {
      const elapsed = Math.max(0, now - this.lastTickAt);
      this.lastTickAt = now;
      if (options.paused) {
        this.frameEndsAt += elapsed;
        this.transitionStartedAt += elapsed;
      }
      let safety = 0;
      while (!this.complete && now >= this.frameEndsAt && safety < 32) {
        safety += 1;
        const nextIndex = this.frameIndex + 1;
        if (nextIndex >= this.frames.length) {
          this.complete = true;
          break;
        }
        this.enterFrame(nextIndex, this.frameEndsAt);
      }
      const linearBlend = this.previousUrl
        ? clamp((now - this.transitionStartedAt) / Math.max(1, this.transitionMs), 0, 1)
        : 1;
      const blend = easeInOut(linearBlend);
      if (blend >= 1) this.previousUrl = null;
      return {
        url: this.currentUrl,
        previousUrl: this.previousUrl,
        mirror: this.currentMirror,
        previousMirror: this.previousMirror,
        anchorX: this.currentAnchorX,
        previousAnchorX: this.previousAnchorX,
        blend,
        frameIndex: this.frameIndex,
        breathScale: 1,
        displayScale: this.currentDisplayScale,
        previousDisplayScale: this.previousDisplayScale,
        offsetY: this.currentOffsetY,
        previousOffsetY: this.previousOffsetY,
        complete: this.complete,
      };
    }
  }

  class NaturalCyclePlayer {
    constructor(motion, options = {}) {
      this.rng = options.rng ?? Math.random;
      this.motion = motion || null;
      this.transitionMs = Math.max(0, Number(motion?.transitionMs) || 70);
      this.frames = (motion?.variants?.[0]?.frames || []).map((frame) => ({
        ...frame,
        sampledDurationMs: Math.max(1, sampleDuration(frame.durationMs, this.rng)),
      }));
      this.totalDurationMs = this.frames.reduce((sum, frame) => sum + frame.sampledDurationMs, 0);
      this.frameIndex = 0;
      this.currentUrl = this.frames[0]?.url || motion?.neutralFrameUrl || null;
      this.previousUrl = options.previousUrl || null;
      this.currentDisplayScale = Number(this.frames[0]?.displayScale) || Number(motion?.displayScale) || 1;
      this.previousDisplayScale = Number(options.previousDisplayScale) || 1;
      this.currentOffsetY = Number(this.frames[0]?.offsetY) || 0;
      this.previousOffsetY = Number(options.previousOffsetY) || 0;
      this.transitionStartedAt = options.now ?? 0;
      // Preserve the relative position in a gait cycle when changing speed.
      const phase = clamp(Number(options.initialPhase) || 0, 0, 0.999999);
      const allowedEntries = (options.entryFrames || []).filter((index) => Number.isInteger(index) && index >= 0 && index < this.frames.length);
      let nearestEntry = null;
      let nearestDistance = Infinity;
      for (const index of allowedEntries) {
        const candidate = this.frames.slice(0, index).reduce((sum, frame) => sum + frame.sampledDurationMs, 0) / this.totalDurationMs;
        const difference = Math.abs(candidate - phase);
        const distance = Math.min(difference, 1 - difference);
        if (distance < nearestDistance) {
          nearestEntry = index;
          nearestDistance = distance;
        }
      }
      const requestedEntry = Number(nearestEntry ?? options.entryFrame);
      const hasEntry = (nearestEntry != null || options.entryFrame != null) && Number.isInteger(requestedEntry) && requestedEntry >= 0 && requestedEntry < this.frames.length;
      this.phaseMs = hasEntry
        ? this.frames.slice(0, requestedEntry).reduce((sum, frame) => sum + frame.sampledDurationMs, 0)
        : phase * this.totalDurationMs;
      this.lastTickAt = options.now ?? 0;
      const initial = this.frameAtPhase();
      if (initial.frame) {
        this.frameIndex = initial.index;
        this.currentUrl = initial.frame.url || this.currentUrl;
        this.currentDisplayScale = Number(initial.frame.displayScale) || Number(this.motion?.displayScale) || 1;
        this.currentOffsetY = Number(initial.frame.offsetY) || 0;
      }
    }

    getPhase() {
      return this.totalDurationMs > 0 ? (this.phaseMs % this.totalDurationMs) / this.totalDurationMs : 0;
    }

    canSwitchGait() {
      const frames = this.motion?.gaitSwitchFrames;
      return !Array.isArray(frames) || frames.length === 0 || frames.includes(this.frameIndex);
    }

    frameAtPhase() {
      if (!this.frames.length || this.totalDurationMs <= 0) return { frame: null, index: 0 };
      let cursor = this.phaseMs % this.totalDurationMs;
      for (let index = 0; index < this.frames.length; index += 1) {
        const frame = this.frames[index];
        if (cursor < frame.sampledDurationMs) return { frame, index, offsetMs: cursor };
        cursor -= frame.sampledDurationMs;
      }
      return { frame: this.frames.at(-1), index: this.frames.length - 1 };
    }

    tick(now, options = {}) {
      const playbackRate = clamp(Number(options.playbackRate) || 1, 0.2, 3);
      const elapsed = Math.max(0, now - this.lastTickAt);
      this.lastTickAt = now;
      if (!options.paused) this.phaseMs += elapsed * playbackRate;
      if (options.paused) {
        this.previousUrl = null;
        this.previousDisplayScale = this.currentDisplayScale;
        this.previousOffsetY = this.currentOffsetY;
        this.transitionStartedAt = now;
      }
      const { frame, index, offsetMs = 0 } = this.frameAtPhase();
      const nextUrl = frame?.url || this.currentUrl;
      const nextOffsetY = Number(frame?.offsetY) || 0;
      if (nextUrl && (nextUrl !== this.currentUrl || nextOffsetY !== this.currentOffsetY)) {
        // A delayed render can skip several frames. Blend from what was actually
        // displayed, rather than briefly introducing an unseen intermediate pose.
        this.previousUrl = this.currentUrl;
        this.previousDisplayScale = this.currentDisplayScale;
        this.previousOffsetY = this.currentOffsetY;
        this.currentUrl = nextUrl;
        this.currentDisplayScale = Number(frame?.displayScale) || Number(this.motion?.displayScale) || 1;
        this.currentOffsetY = nextOffsetY;
        this.transitionStartedAt = now - offsetMs / playbackRate;
      }
      this.frameIndex = index;
      // Keep part of even a short frame fully visible at the current speed.
      const blendDuration = Math.min(this.transitionMs, (frame?.sampledDurationMs || this.transitionMs) / playbackRate * 0.5);
      const linearBlend = this.previousUrl
        ? clamp((now - this.transitionStartedAt) / Math.max(1, blendDuration), 0, 1)
        : 1;
      const blend = easeInOut(linearBlend);
      if (blend >= 1) this.previousUrl = null;
      return {
        url: this.currentUrl,
        previousUrl: this.previousUrl,
        blend,
        frameIndex: this.frameIndex,
        breathScale: 1,
        displayScale: this.currentDisplayScale,
        previousDisplayScale: this.previousDisplayScale,
        offsetY: this.currentOffsetY,
        previousOffsetY: this.previousOffsetY,
      };
    }
  }

  class NaturalStopPlayer {
    constructor(cycle, now, options = {}) {
      this.cycle = cycle;
      this.startedAt = now;
      this.minimumMs = options.minimumMs ?? 60;
      this.maximumMs = options.maximumMs ?? 300;
      this.initialRate = clamp(Number(options.playbackRate) || 1, 0.2, 1.8);
    }

    tick(now) {
      const elapsed = Math.max(0, now - this.startedAt);
      const progress = clamp(elapsed / Math.max(1, this.maximumMs), 0, 1);
      const playbackRate = Math.max(0.2, this.initialRate * (1 - 0.7 * easeInOut(progress)));
      const state = this.cycle.tick(now, { playbackRate });
      return {
        ...state,
        complete: elapsed >= this.maximumMs || (elapsed >= this.minimumMs && this.cycle.canSwitchGait() && state.blend >= 0.9),
      };
    }
  }

  const api = {
    NaturalMotionPlayer,
    NaturalSequencePlayer,
    NaturalCyclePlayer,
    NaturalStopPlayer,
    clamp,
    sampleDuration,
    weightedChoice,
    chooseSequenceVariant,
  };
  global.XiaodaiMotion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
