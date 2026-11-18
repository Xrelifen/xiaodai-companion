(function (root) {
  // Add premultiplied contributions, so overlapping opaque pixels stay opaque.
  function drawCrossfade(context, previous, current, blend) {
    if (!previous) {
      current(1);
      return;
    }
    const amount = Math.max(0, Math.min(1, blend));
    previous(1 - amount);
    context.save();
    context.globalCompositeOperation = "lighter";
    current(amount);
    context.restore();
  }
  function anchorOffsets(previousX, currentX, blend) {
    if (!Number.isFinite(previousX) || !Number.isFinite(currentX)) return { previous: 0, current: 0 };
    const amount = Math.max(0, Math.min(1, Number(blend) || 0));
    const delta = currentX - previousX;
    return { previous: delta * amount, current: -delta * (1 - amount) };
  }
  root.XiaodaiCrossfade = { drawCrossfade, anchorOffsets };
})(globalThis);
