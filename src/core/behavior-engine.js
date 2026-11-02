(function attachXiaodaiCore(global) {
  "use strict";

  const DEFAULT_CONFIG = {
    idleDelay: { minMs: 3500, maxMs: 11000 },
    preventImmediateRepeat: true,
    lookSmoothing: 0.11,
    drag: {
      walkThreshold: 80,
      runThreshold: 350,
      maximumPlaybackRate: 1.8,
    },
    desktop: {
      roamEnabled: false,
      roamMinDelayMs: 18000,
      roamMaxDelayMs: 42000,
    },
    actions: [
      { id: "look-around", label: "四處看看", weight: 34, cooldownMs: 4500, sequence: "lookAround" },
      { id: "lie-down", label: "趴著休息", weight: 24, cooldownMs: 12000, sequence: "lieDown" },
      { id: "stand-turn-sit", label: "站起來轉一圈", weight: 14, cooldownMs: 18000, sequence: "standTurnSit" },
      { id: "wave", label: "揮揮手", weight: 12, cooldownMs: 14000, sequence: "wave" },
      { id: "small-jump", label: "開心跳一下", weight: 8, cooldownMs: 22000, sequence: "jump" },
      { id: "focused", label: "專心觀察", weight: 8, cooldownMs: 16000, sequence: "focused" },
    ],
  };

  const state = (row, columns, durations, options = {}) => ({
    row,
    columns,
    durations,
    loop: options.loop ?? true,
    returnToIdle: options.returnToIdle ?? false,
  });

  const SEQUENCES = {
    idle: state(0, [0, 1, 2, 3, 4, 5], [720, 180, 260, 520, 220, 820]),
    walkRight: state(1, [0, 1, 2, 3, 4, 5, 6, 7], [145, 145, 145, 145, 145, 145, 145, 190]),
    walkLeft: state(2, [0, 1, 2, 3, 4, 5, 6, 7], [145, 145, 145, 145, 145, 145, 145, 190]),
    wave: state(3, [0, 1, 2, 3], [220, 250, 250, 520], { loop: false, returnToIdle: true }),
    jump: state(4, [0, 1, 2, 3, 4], [180, 150, 240, 170, 520], { loop: false, returnToIdle: true }),
    sad: state(5, [0, 1, 2, 3, 4, 5, 6, 7], [220, 220, 220, 220, 220, 220, 220, 600], { loop: false, returnToIdle: true }),
    lieDown: state(6, [0, 1, 2, 3, 4, 5], [520, 380, 760, 300, 840, 680], { loop: false, returnToIdle: true }),
    getUp: state(6, [5, 4, 3, 2, 1, 0], [680, 840, 300, 760, 380, 520], { loop: false, returnToIdle: true }),
    focused: state(7, [0, 1, 2, 3, 4, 5], [360, 240, 620, 260, 500, 680], { loop: false, returnToIdle: true }),
    standTurnSit: state(8, [0, 1, 2, 3, 4, 5], [420, 380, 520, 520, 420, 900], { loop: false, returnToIdle: true }),
    lookAround: {
      frames: [
        { row: 9, column: 2, duration: 520 },
        { row: 9, column: 4, duration: 760 },
        { row: 9, column: 2, duration: 430 },
        { row: 10, column: 6, duration: 520 },
        { row: 10, column: 4, duration: 760 },
        { row: 10, column: 6, duration: 430 },
        { row: 0, column: 0, duration: 900 },
      ],
      loop: false,
      returnToIdle: true,
    },
  };

  function deepMerge(base, override) {
    if (!override || typeof override !== "object") return structuredClone(base);
    const output = Array.isArray(base) ? [...base] : { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        base?.[key] &&
        typeof base[key] === "object" &&
        !Array.isArray(base[key])
      ) {
        output[key] = deepMerge(base[key], value);
      } else {
        output[key] = value;
      }
    }
    return output;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max, rng = Math.random) {
    return min + (max - min) * rng();
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

  function normalizeSequence(sequence) {
    if (sequence.frames) return sequence;
    return {
      ...sequence,
      frames: sequence.columns.map((column, index) => ({
        row: sequence.row,
        column,
        duration: sequence.durations[index] ?? sequence.durations.at(-1) ?? 160,
      })),
    };
  }

  function sequenceDuration(sequence) {
    return normalizeSequence(sequence).frames.reduce((sum, frame) => sum + frame.duration, 0);
  }

  function frameAt(sequence, elapsedMs, playbackRate = 1) {
    const normalized = normalizeSequence(sequence);
    const total = sequenceDuration(normalized);
    const scaledElapsed = Math.max(0, elapsedMs * Math.max(0.05, playbackRate));
    const position = normalized.loop ? scaledElapsed % total : Math.min(scaledElapsed, Math.max(0, total - 1));
    let cursor = position;
    for (let index = 0; index < normalized.frames.length; index += 1) {
      const frame = normalized.frames[index];
      if (cursor < frame.duration) {
        return { ...frame, index, progress: frame.duration ? cursor / frame.duration : 0 };
      }
      cursor -= frame.duration;
    }
    return { ...normalized.frames.at(-1), index: normalized.frames.length - 1, progress: 1 };
  }

  function angleDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function smoothAngle(current, target, smoothing) {
    return current + angleDelta(current, target) * clamp(smoothing, 0, 1);
  }

  function lookFrameForAngle(angle) {
    const clockwiseFromUp = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    const index = Math.round(clockwiseFromUp / (Math.PI * 2 / 16)) % 16;
    if (index < 8) return { row: 9, column: index, directionIndex: index };
    return { row: 10, column: index - 8, directionIndex: index };
  }

  class BehaviorEngine {
    constructor(options = {}) {
      this.rng = options.rng ?? Math.random;
      this.config = deepMerge(DEFAULT_CONFIG, options.config ?? {});
      this.sequences = { ...SEQUENCES, ...(options.sequences ?? {}) };
      this.current = { name: "idle", startedAt: options.now ?? 0, playbackRate: 1, reason: "startup" };
      this.lastRandomAction = null;
      this.cooldowns = new Map();
      this.nextIdleActionAt = 0;
      this.history = [];
      this.scheduleNextIdle(options.now ?? 0);
    }

    updateConfig(patch) {
      this.config = deepMerge(this.config, patch);
      return this.config;
    }

    scheduleNextIdle(now) {
      const { minMs, maxMs } = this.config.idleDelay;
      this.nextIdleActionAt = now + randomBetween(Math.min(minMs, maxMs), Math.max(minMs, maxMs), this.rng);
      return this.nextIdleActionAt;
    }

    availableActions(now) {
      return this.config.actions.filter((action) => {
        if (!this.sequences[action.sequence]) return false;
        if ((this.cooldowns.get(action.id) ?? 0) > now) return false;
        if (this.config.preventImmediateRepeat && action.id === this.lastRandomAction) return false;
        return true;
      });
    }

    chooseIdleAction(now) {
      let candidates = this.availableActions(now);
      if (!candidates.length) {
        candidates = this.config.actions.filter((action) => this.sequences[action.sequence]);
      }
      return weightedChoice(candidates, this.rng);
    }

    trigger(sequenceName, now, options = {}) {
      if (!this.sequences[sequenceName]) throw new Error(`Unknown sequence: ${sequenceName}`);
      this.current = {
        name: sequenceName,
        startedAt: now,
        playbackRate: options.playbackRate ?? 1,
        reason: options.reason ?? "manual",
      };
      this.history.push({ ...this.current });
      if (this.history.length > 32) this.history.shift();
      return this.current;
    }

    triggerRandomAction(now) {
      const action = this.chooseIdleAction(now);
      if (!action) {
        this.scheduleNextIdle(now);
        return null;
      }
      this.lastRandomAction = action.id;
      this.cooldowns.set(action.id, now + action.cooldownMs);
      this.trigger(action.sequence, now, { reason: `random:${action.id}` });
      return action;
    }

    tick(now) {
      const sequence = this.sequences[this.current.name];
      const duration = sequenceDuration(sequence) / Math.max(0.05, this.current.playbackRate);
      if (!sequence.loop && now - this.current.startedAt >= duration) {
        this.trigger("idle", now, { reason: "sequence-complete" });
        this.scheduleNextIdle(now);
      } else if (this.current.name === "idle" && now >= this.nextIdleActionAt) {
        this.triggerRandomAction(now);
      }
      return this.currentFrame(now);
    }

    currentFrame(now) {
      const sequence = this.sequences[this.current.name];
      return {
        ...frameAt(sequence, now - this.current.startedAt, this.current.playbackRate),
        sequence: this.current.name,
        reason: this.current.reason,
      };
    }

    setDragState(direction, speed, now) {
      const { walkThreshold, runThreshold, maximumPlaybackRate } = this.config.drag;
      const normalizedSpeed = Math.max(0, speed);
      const playbackRate = normalizedSpeed < walkThreshold
        ? 0.65
        : clamp(0.78 + normalizedSpeed / Math.max(1, runThreshold) * 0.55, 0.78, maximumPlaybackRate);
      const name = direction === "left" ? "walkLeft" : "walkRight";
      if (this.current.name !== name) {
        this.trigger(name, now, { reason: "drag", playbackRate });
      } else {
        this.current.playbackRate = playbackRate;
      }
      return { name, playbackRate, gait: normalizedSpeed >= runThreshold ? "run" : "walk" };
    }

    releaseDrag(now) {
      this.trigger("idle", now, { reason: "drag-release" });
      this.scheduleNextIdle(now);
    }
  }

  const api = {
    DEFAULT_CONFIG,
    SEQUENCES,
    BehaviorEngine,
    angleDelta,
    clamp,
    deepMerge,
    frameAt,
    lookFrameForAngle,
    normalizeSequence,
    randomBetween,
    sequenceDuration,
    smoothAngle,
    weightedChoice,
  };

  global.XiaodaiCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

