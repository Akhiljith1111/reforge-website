// Pure scroll maths. No DOM access, so it can be tested in Node.
(function (root) {
  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

  // Progress through a pinned region: 0 when its top reaches the top of the viewport,
  // 1 when its bottom reaches the bottom of the viewport.
  function regionProgress(regionTop, regionHeight, scrollY, viewportHeight) {
    var distance = regionHeight - viewportHeight;
    if (distance <= 0) return 1;
    return clamp01((scrollY - regionTop) / distance);
  }

  // Progress of an anchor line (a fraction of the way down the viewport) travelling through a region.
  // If the page ends before the anchor can reach the region's end, progress is stretched so it still ends at 1.
  function throughProgress(regionTop, regionHeight, scrollY, viewportHeight, anchor, maxScroll) {
    if (regionHeight <= 0) return 1;
    var raw = (scrollY + anchor * viewportHeight - regionTop) / regionHeight;
    var rawAtMax = (maxScroll + anchor * viewportHeight - regionTop) / regionHeight;
    var reach = Math.min(1, rawAtMax);
    if (reach <= 0) return 0;
    return clamp01(raw / reach);
  }

  // Molten line: the tip travels down to yEnd as progress grows, then the remaining progress fills the R.
  // p is progress through a region of height yEnd + fillDistance.
  function lineState(p, yEnd, fillDistance) {
    var travelled = p * (yEnd + fillDistance);
    return {
      tipY: Math.min(yEnd, travelled),
      fill: fillDistance > 0 ? clamp01((travelled - yEnd) / fillDistance) : (p >= 1 ? 1 : 0),
    };
  }

  // Progress within the sub-range start..end of p.
  function segment(p, start, end) { return clamp01((p - start) / (end - start)); }

  function stageIndex(p, stages) { return Math.min(stages - 1, Math.floor(clamp01(p) * stages)); }

  function strikeCount(p, strikePoints) {
    var n = 0;
    for (var i = 0; i < strikePoints.length; i++) if (strikePoints[i] <= p) n++;
    return n;
  }

  // 0 = hammer raised, 1 = hammer on the metal. Swings down into each strike point, then rebounds.
  function hammerImpact(p, strikePoints, windup, rebound) {
    windup = windup || 0.035;
    rebound = rebound || 0.03;
    var best = 0;
    for (var i = 0; i < strikePoints.length; i++) {
      var sp = strikePoints[i];
      var v;
      if (p <= sp) { v = segment(p, sp - windup, sp); v = v * v * v; }
      else { v = 1 - segment(p, sp, sp + rebound); }
      if (v > best) best = v;
    }
    return best;
  }

  // Repeatable pseudo-random number in 0..1 for a given seed.
  function hash01(n) {
    var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  // Where one spark is at age t (0..1), in units of the burst radius. Same inputs always give the same answer.
  function sparkPosition(seed, t) {
    var angle = Math.PI * (0.08 + 0.84 * hash01(seed));
    var speed = 0.45 + 0.55 * hash01(seed + 0.5);
    var eased = 1 - (1 - t) * (1 - t);
    return {
      x: Math.cos(angle) * speed * eased,
      y: -Math.sin(angle) * speed * eased + 0.75 * t * t,
      alpha: clamp01(1 - t),
    };
  }

  var api = {
    clamp01: clamp01, regionProgress: regionProgress, throughProgress: throughProgress, segment: segment,
    stageIndex: stageIndex, strikeCount: strikeCount, lineState: lineState, hammerImpact: hammerImpact, hash01: hash01, sparkPosition: sparkPosition,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.RF = root.RF || {}; for (var k in api) root.RF[k] = api[k]; }
})(typeof window !== 'undefined' ? window : null);
