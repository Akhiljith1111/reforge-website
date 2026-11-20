// The molten line: an SVG path that pours down the page with scroll, lighting sections and process steps as it passes,
// then filling the R logo in the contact section.
(function () {
  var RF = window.RF = window.RF || {};
  var SVG_NS = 'http://www.w3.org/2000/svg';

  RF.initMolten = function (engine) {
    var wrap = document.querySelector('.molten-wrap');
    if (!wrap) return;
    var svg = wrap.querySelector('svg.molten');
    var path = svg.querySelector('.molten-path');
    var track = svg.querySelector('.molten-track');
    var nodesGroup = svg.querySelector('.molten-nodes');
    var tip = svg.querySelector('.molten-tip');
    var rLogo = wrap.querySelector('.molten-r');
    var sections = Array.prototype.slice.call(wrap.querySelectorAll('[data-ignite]'));
    var steps = Array.prototype.slice.call(wrap.querySelectorAll('.step'));
    var seg = RF.segment;

    var marks = [];     // { el, y, end, node } one per section heading
    var stepMarks = []; // { el, y }
    var total = 0, yEnd = 0, fillDistance = 0;
    var table = [];     // points sampled along the path: { x, y, len }

    // Distance from the top of the wrap, ignoring any transforms currently applied.
    function offsetTopIn(el) {
      var y = 0;
      while (el && el !== wrap) { y += el.offsetTop; el = el.offsetParent; }
      return y;
    }

    // The path only ever travels downward, so the point at a given height is a binary search in the sampled table.
    // Sampling once per measure keeps getPointAtLength out of the scroll handler.
    function pointAtY(y) {
      var lo = 0, hi = table.length - 1;
      if (y <= table[0].y) return table[0];
      if (y >= table[hi].y) return table[hi];
      while (hi - lo > 1) {
        var mid = (lo + hi) >> 1;
        if (table[mid].y < y) lo = mid; else hi = mid;
      }
      var a = table[lo], b = table[hi];
      var t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
      return { x: a.x + (b.x - a.x) * t, y: y, len: a.len + (b.len - a.len) * t };
    }

    function measure(region) {
      var wr = wrap.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + wr.width + ' ' + wr.height);

      var cont = wrap.querySelector('.container').getBoundingClientRect();
      var gx = cont.left - wr.left + 12;

      // The line ends at the top of the R's stem.
      var rRect = rLogo.getBoundingClientRect();
      var rx = rRect.left - wr.left + rRect.width * 0.35;
      yEnd = offsetTopIn(rLogo.parentElement) + rRect.height * 0.16;

      // Stay on the rail until the line is past the last heading, so the final bend never crosses its text.
      var lastTitle = sections[sections.length - 1].querySelector('.section-title');
      var straightUntil = Math.max(0, Math.min(offsetTopIn(lastTitle) + lastTitle.offsetHeight + 20, yEnd - 36));

      var d = 'M' + gx + ' 0';
      var y = 0, side = 1, stepLen = 150, sway = 7;
      while (y + stepLen <= straightUntil) {
        d += ' C' + (gx + sway * side) + ' ' + (y + 50) + ' ' + (gx + sway * side) + ' ' + (y + 100) + ' ' + gx + ' ' + (y + stepLen);
        y += stepLen; side = -side;
      }
      if (y < straightUntil) { d += ' L' + gx + ' ' + straightUntil; y = straightUntil; }
      var gap = yEnd - y;
      d += ' C' + gx + ' ' + (y + gap * 0.55) + ' ' + rx + ' ' + (yEnd - gap * 0.6) + ' ' + rx + ' ' + yEnd;
      path.setAttribute('d', d);
      track.setAttribute('d', d);
      total = path.getTotalLength();

      var samples = Math.max(2, Math.ceil(total / 6));
      table = [];
      for (var i = 0; i <= samples; i++) {
        var len = total * i / samples;
        var pt = path.getPointAtLength(len);
        table.push({ x: pt.x, y: pt.y, len: len });
      }

      while (nodesGroup.firstChild) nodesGroup.removeChild(nodesGroup.firstChild);
      marks = sections.map(function (section) {
        var title = section.querySelector('.section-title');
        var my = Math.min(offsetTopIn(title) + title.offsetHeight / 2, yEnd - 4);
        var at = pointAtY(my);
        var node = document.createElementNS(SVG_NS, 'circle');
        node.setAttribute('class', 'molten-node');
        node.setAttribute('r', 7);
        node.setAttribute('cx', at.x);
        node.setAttribute('cy', at.y);
        nodesGroup.appendChild(node);
        return { el: section, y: my, end: Math.min(my + 90, yEnd), node: node };
      });

      // Steps that sit side by side share a height, so stagger them to ignite one after another.
      var rowTop = null, inRow = 0;
      stepMarks = steps.map(function (el) {
        var top = offsetTopIn(el);
        if (rowTop !== null && Math.abs(top - rowTop) < 4) inRow++; else { rowTop = top; inRow = 0; }
        return { el: el, y: top + 28 + inRow * 45 };
      });

      // After the tip arrives, a further quarter of a screen of scrolling fills the R.
      fillDistance = window.innerHeight * 0.25;
      region.height = yEnd + fillDistance;
    }

    function render(p) {
      var state = RF.lineState(p, yEnd, fillDistance);
      var at = pointAtY(state.tipY);
      var drawn = total > 0 ? at.len / total : 0;

      path.style.strokeDashoffset = (1 - drawn).toFixed(4);
      path.style.visibility = drawn > 0 ? 'visible' : 'hidden';
      tip.setAttribute('cx', at.x);
      tip.setAttribute('cy', at.y);
      tip.style.opacity = state.tipY > 0 && state.tipY < yEnd ? 1 : 0;

      marks.forEach(function (m) {
        m.el.style.setProperty('--lit', seg(state.tipY, m.y - 60, m.end).toFixed(3));
        m.node.classList.toggle('is-lit', state.tipY > 0 && state.tipY >= m.y - 1);
      });
      stepMarks.forEach(function (s) { s.el.classList.toggle('is-lit', state.tipY >= s.y); });
      rLogo.style.setProperty('--fill', state.fill.toFixed(3));
    }

    engine.add(wrap, render, { mode: 'through', anchor: 0.6, measure: measure });
  };
})();
