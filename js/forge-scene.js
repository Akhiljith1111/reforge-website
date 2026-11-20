// Hero forge scene: raw wireframe -> heat -> hammer strikes -> finished website. Everything is drawn from scroll progress.
(function () {
  var RF = window.RF = window.RF || {};

  var STRIKES = [0.55, 0.62, 0.69];
  var RAISED = 30;   // hammer angle in degrees when lifted
  var DOWN = -12;    // hammer angle when it lands
  var STAGES = [[0, 0.25], [0.25, 0.5], [0.5, 0.75], [0.75, 1]];
  var SPARK_COLOURS = ['255,210,63', '255,122,24', '255,240,200'];

  RF.initForge = function (engine) {
    var forge = document.getElementById('forge');
    if (!forge) return;
    var stage = forge.querySelector('.forge-stage');
    var canvas = forge.querySelector('.forge-sparks');
    var piece = forge.querySelector('.forge-piece');
    var bed = forge.querySelector('.forge-bed');
    var hammer = forge.querySelector('.forge-hammer');
    var head = forge.querySelector('.hammer-head');
    var hint = forge.querySelector('.scroll-hint');
    var captions = Array.prototype.slice.call(forge.querySelectorAll('.forge-caption'));
    var ctx = canvas.getContext('2d');
    var seg = RF.segment;

    var W = 0, H = 0, dpr = 1, small = false;
    var hit = { x: 0, y: 0 };
    var bedBox = { x: 0, y: 0, w: 0 };

    function measure() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = stage.clientWidth;
      H = stage.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      small = window.innerWidth <= 900;

      // Find where the hammer head lands by putting the hammer in its "down" pose for the measurement.
      var prevHam = forge.style.getPropertyValue('--ham');
      var prevShake = forge.style.getPropertyValue('--shake');
      forge.style.setProperty('--ham', DOWN + 'deg');
      forge.style.setProperty('--shake', '0px');
      var s = stage.getBoundingClientRect();
      var h = head.getBoundingClientRect();
      var b = bed.getBoundingClientRect();
      hit = { x: h.left - s.left + h.width / 2, y: h.bottom - s.top - 6 };
      bedBox = { x: b.left - s.left, y: b.top - s.top, w: b.width };
      forge.style.setProperty('--ham', prevHam);
      forge.style.setProperty('--shake', prevShake);
    }

    function draw(p, heatUp, fin) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Embers rising from the forge bed while the piece is hot.
      var glow = heatUp * (1 - fin);
      if (glow > 0.01) {
        var count = small ? 8 : 16;
        var rise = small ? 110 : 190;
        for (var i = 0; i < count; i++) {
          var t = (p * 18 + RF.hash01(i + 1)) % 1;
          var x = bedBox.x + bedBox.w * (0.08 + 0.84 * RF.hash01(i + 50)) + Math.sin(t * 6 + i) * 10;
          var y = bedBox.y - t * rise;
          var a = Math.sin(Math.PI * t) * glow * 0.9;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255,' + Math.round(140 + 70 * RF.hash01(i + 9)) + ',40,' + a.toFixed(3) + ')';
          ctx.arc(x, y, 1.2 + RF.hash01(i + 90) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // One burst of sparks per hammer strike. A spark's age is how far scroll has moved past the strike point.
      var radius = small ? 130 : 240;
      var perBurst = small ? 10 : 24;
      ctx.lineCap = 'round';
      STRIKES.forEach(function (sp, si) {
        var age = seg(p, sp, sp + 0.06);
        if (age <= 0 || age >= 1) return;

        var flash = 1 - seg(p, sp, sp + 0.018);
        if (flash > 0) {
          var g = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, radius * 0.45);
          g.addColorStop(0, 'rgba(255,230,150,' + (0.85 * flash).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255,122,24,0)');
          ctx.fillStyle = g;
          ctx.fillRect(hit.x - radius, hit.y - radius, radius * 2, radius * 2);
        }

        for (var i = 0; i < perBurst; i++) {
          var seed = si * 100 + i;
          var now = RF.sparkPosition(seed, age);
          var before = RF.sparkPosition(seed, Math.max(0, age - 0.07));
          ctx.strokeStyle = 'rgba(' + SPARK_COLOURS[i % 3] + ',' + now.alpha.toFixed(3) + ')';
          ctx.lineWidth = 1.5 + RF.hash01(seed + 7) * 2;
          ctx.beginPath();
          ctx.moveTo(hit.x + before.x * radius, hit.y + before.y * radius);
          ctx.lineTo(hit.x + now.x * radius, hit.y + now.y * radius);
          ctx.stroke();
        }
      });
    }

    function render(p) {
      var heatUp = seg(p, 0.25, 0.5);
      var fin = seg(p, 0.78, 1);
      var heat = heatUp * (1 - seg(p, 0.8, 0.95));
      var impact = RF.hammerImpact(p, STRIKES);
      var s = forge.style;

      s.setProperty('--heat', heat.toFixed(3));
      s.setProperty('--fin', fin.toFixed(3));
      s.setProperty('--k1', seg(p, STRIKES[0], STRIKES[0] + 0.012).toFixed(3));
      s.setProperty('--k2', seg(p, STRIKES[1], STRIKES[1] + 0.012).toFixed(3));
      s.setProperty('--k3', seg(p, STRIKES[2], STRIKES[2] + 0.012).toFixed(3));
      s.setProperty('--ham', (RAISED - (RAISED - DOWN) * impact).toFixed(2) + 'deg');
      s.setProperty('--hamo', Math.min(seg(p, 0.46, 0.5), 1 - seg(p, 0.73, 0.77)).toFixed(3));
      s.setProperty('--shake', (impact > 0.7 ? (impact - 0.7) * 16 : 0).toFixed(1) + 'px');

      captions.forEach(function (el, i) {
        var a = STAGES[i][0], b = STAGES[i][1];
        var fadeIn = i === 0 ? 1 : seg(p, a - 0.02, a + 0.02);
        var fadeOut = i === STAGES.length - 1 ? 1 : 1 - seg(p, b - 0.02, b + 0.02);
        el.style.opacity = Math.min(fadeIn, fadeOut).toFixed(3);
      });
      if (hint) hint.style.opacity = (1 - seg(p, 0, 0.06)).toFixed(3);

      draw(p, heatUp, fin);
    }

    engine.add(forge, render, { pin: stage, measure: measure, exposeProgress: true });
  };
})();
