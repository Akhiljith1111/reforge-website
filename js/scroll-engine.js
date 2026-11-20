// Turns scroll position into a 0..1 progress value for each registered region and calls its renderer.
// Renderers must draw purely from the progress they are given, so animation follows the scrollbar in both directions.
(function () {
  var RF = window.RF = window.RF || {};

  RF.createEngine = function () {
    var regions = [];
    var queued = false;
    var refreshQueued = false;

    function measure() {
      var scrollY = window.scrollY;
      var vh = window.innerHeight;
      var maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      regions.forEach(function (r) {
        var rect = r.el.getBoundingClientRect();
        r.top = rect.top + scrollY;
        r.height = rect.height;
        r.viewport = r.opts.pin ? r.opts.pin.offsetHeight : vh;
        r.maxScroll = maxScroll;
        if (r.opts.measure) r.opts.measure(r);
      });
    }

    function render(force) {
      queued = false;
      force = force === true;
      var scrollY = window.scrollY;
      var vh = window.innerHeight;
      regions.forEach(function (r) {
        var p = r.opts.mode === 'through'
          ? RF.throughProgress(r.top, r.height, scrollY, vh, r.opts.anchor == null ? 0.6 : r.opts.anchor, r.maxScroll)
          : RF.regionProgress(r.top, r.height, scrollY, r.viewport);
        // Nothing to redraw if this region's progress has not moved (for example the forge once it is fully passed).
        var key = p.toFixed(4);
        if (!force && key === r.lastKey) return;
        r.lastKey = key;
        if (r.opts.exposeProgress) r.el.style.setProperty('--p', key);
        r.render(p, r);
      });
    }

    function requestRender() { if (!queued) { queued = true; requestAnimationFrame(render); } }

    function refresh() { measure(); render(true); }
    function requestRefresh() {
      if (refreshQueued) return;
      refreshQueued = true;
      requestAnimationFrame(function () { refreshQueued = false; refresh(); });
    }

    return {
      // opts: { mode: 'through', anchor, pin: element whose height is the pinned viewport, measure(region), exposeProgress }
      add: function (el, renderFn, opts) { regions.push({ el: el, render: renderFn, opts: opts || {} }); },
      refresh: refresh,
      start: function () {
        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', requestRefresh);
        window.addEventListener('orientationchange', requestRefresh);
        window.addEventListener('load', requestRefresh);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRefresh);
        // Page height changes (for example an FAQ item opening) move everything below it.
        if (window.ResizeObserver) new ResizeObserver(requestRefresh).observe(document.body);
        refresh();
      },
    };
  };
})();
