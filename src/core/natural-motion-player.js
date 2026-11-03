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
      this.variant = variant;
      this.frames = variant.frames.map((frame) => ({
        ...frame,
        sampledDurationMs: Math.max(1, sampleDuration(frame.durationMs, this.rng)),
      }));
      this.frameIndex = 0;
      this.enterFrame(0, now);
      return variant;
    }

    enterFrame(index, now) {
      const frame = this.frames[index];
      const nextUrl = frame?.url || this.neutralUrl;
      if (nextUrl && nextUrl !== this.currentUrl) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = nextUrl;
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
        this.currentUrl = this.neutralUrl;
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

      const blend = this.previousUrl
        ? clamp((now - this.transitionStartedAt) / Math.max(1, this.transitionMs), 0, 1)
        : 1;
      if (blend >= 1) this.previousUrl = null;
      const breathPhase = (now % 3600) / 3600 * Math.PI * 2;

      return {
        url: this.currentUrl || this.neutralUrl,
        previousUrl: this.previousUrl,
        blend,
        variantId: this.variant?.id || null,
        frameIndex: this.frameIndex,
        breathScale: 1 + Math.sin(breathPhase) * 0.0055,
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
      this.previousUrl = null;
      this.transitionStartedAt = options.now ?? 0;
      this.frameEndsAt = (options.now ?? 0) + (this.frames[0]?.sampledDurationMs || 1);
      this.complete = this.frames.length === 0;
    }

    enterFrame(index, now) {
      const frame = this.frames[index];
      const nextUrl = frame?.url || this.currentUrl;
      if (nextUrl && nextUrl !== this.currentUrl) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = nextUrl;
        this.transitionStartedAt = now;
      }
      this.frameIndex = index;
      this.frameEndsAt = now + (frame?.sampledDurationMs || 1);
    }

    tick(now) {
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
      const blend = this.previousUrl
        ? clamp((now - this.transitionStartedAt) / Math.max(1, this.transitionMs), 0, 1)
        : 1;
      if (blend >= 1) this.previousUrl = null;
      return {
        url: this.currentUrl,
        previousUrl: this.previousUrl,
        blend,
        frameIndex: this.frameIndex,
        breathScale: 1,
        complete: this.complete,
      };
    }
  }

  const api = { NaturalMotionPlayer, NaturalSequencePlayer, clamp, sampleDuration, weightedChoice };
  global.XiaodaiMotion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
