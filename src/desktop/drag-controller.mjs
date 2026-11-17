export function createNativeDragState(bounds, cursor, now = 0) {
  return {
    bounds: { ...bounds },
    startCursor: { x: cursor.x, y: cursor.y },
    lastCursor: { x: cursor.x, y: cursor.y },
    lastAt: now,
    smoothedSpeed: 0,
  };
}

export function sampleNativeDrag(state, cursor, now, smoothing = 0.32) {
  const dt = Math.max(1, now - state.lastAt);
  const dx = cursor.x - state.lastCursor.x;
  const dy = cursor.y - state.lastCursor.y;
  const rawSpeed = Math.hypot(dx, dy) / dt * 1000;
  const blend = Math.min(1, Math.max(0, smoothing));
  const smoothedSpeed = state.smoothedSpeed + (rawSpeed - state.smoothedSpeed) * blend;

  state.lastCursor = { x: cursor.x, y: cursor.y };
  state.lastAt = now;
  state.smoothedSpeed = smoothedSpeed < 0.1 ? 0 : smoothedSpeed;

  return {
    x: state.bounds.x + cursor.x - state.startCursor.x,
    y: state.bounds.y + cursor.y - state.startCursor.y,
    screenX: cursor.x,
    screenY: cursor.y,
    dx,
    dy,
    speed: state.smoothedSpeed,
  };
}
