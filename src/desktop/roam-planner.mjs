function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function planRoam(bounds, workArea, request = {}) {
  const requestedDistance = clamp(Number(request.distance) || 360, 40, 1600);
  const requestedDuration = clamp(Number(request.duration) || 8000, 1000, 20000);
  const preferredDirection = request.direction === "left" ? "left" : "right";
  const minimumUsefulDistance = clamp(Number(request.minimumDistance) || 36, 8, 160);

  const leftSpace = Math.max(0, bounds.x - workArea.x);
  const rightEdge = workArea.x + workArea.width;
  const rightSpace = Math.max(0, rightEdge - (bounds.x + bounds.width));
  const spaces = { left: leftSpace, right: rightSpace };
  const oppositeDirection = preferredDirection === "left" ? "right" : "left";

  let direction = preferredDirection;
  if (spaces[direction] < minimumUsefulDistance && spaces[oppositeDirection] > spaces[direction]) {
    direction = oppositeDirection;
  }

  const actualDistance = Math.min(requestedDistance, spaces[direction]);
  if (actualDistance < minimumUsefulDistance) {
    return { direction: null, dx: 0, distance: 0, duration: 0 };
  }

  // Keep the walking speed stable when the display edge shortens the route.
  // This prevents the animation from continuing after the window has stopped.
  const duration = Math.max(650, Math.round(requestedDuration * actualDistance / requestedDistance));
  return {
    direction,
    dx: direction === "left" ? -Math.round(actualDistance) : Math.round(actualDistance),
    distance: Math.round(actualDistance),
    duration,
  };
}
