// Page extras: scroll progress bar, menu highlight, changing headline word, cursor glow, 3D tilt, magnetic buttons, intro cleanup.
(function () {
  var RF = window.RF = window.RF || {};
  var root = document.documentElement;
  var motionOk = root.classList.contains('js'); // false when the visitor asked for reduced motion
  var hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  // ---------- Scroll progress bar ----------
  var bar = document.querySelector('.progress i');
  if (bar) {
    var queued = false;
    var paint = function () {
      queued = false;
      var max = root.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  // ---------- Menu highlight ----------
  if (window.IntersectionObserver) {
    var linkFor = {};
    all('.nav-links a[href^="#"]:not(.btn)').forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          for (var id in linkFor) linkFor[id].removeAttribute('aria-current');
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(linkFor).forEach(function (id) { var s = document.getElementById(id); if (s) watcher.observe(s); });
  }

  // ---------- Changing headline word ----------
  var swap = document.querySelector('.swap');
  if (swap && motionOk) {
    var words = swap.dataset.words.split('|');
    var index = 0;
    setInterval(function () {
      if (document.hidden) return;
      swap.classList.add('is-out');
      setTimeout(function () {
        index = (index + 1) % words.length;
        swap.textContent = words[index];
        swap.classList.remove('is-out');
      }, 350);
    }, 2800);
  }

  // ---------- Mouse effects (computers only, and only when motion is welcome) ----------
  if (motionOk && hasMouse) {
    root.classList.add('fx');

    // Cursor glow: eases towards the pointer and stops animating once it has caught up.
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    var target = { x: -400, y: -400 }, pos = { x: -400, y: -400 }, running = false;
    var follow = function () {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      glow.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
      if (Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5) requestAnimationFrame(follow); else running = false;
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      target.x = e.clientX; target.y = e.clientY;
      glow.classList.add('is-on');
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { glow.classList.remove('is-on'); });

    // 3D tilt with a shine that follows the pointer.
    all('.card, .mock').forEach(function (el) {
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var angles = RF.tiltAngles(x, y, r.width, r.height, 7);
        el.style.setProperty('--rx', angles.rx.toFixed(2) + 'deg');
        el.style.setProperty('--ry', angles.ry.toFixed(2) + 'deg');
        el.style.setProperty('--mx', x.toFixed(0) + 'px');
        el.style.setProperty('--my', y.toFixed(0) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // Magnetic buttons: lean a little towards the pointer.
    all('.btn').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        el.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--bx', '0px');
        el.style.setProperty('--by', '0px');
      });
    });
  }

  // ---------- Logo intro cleanup ----------
  var intro = document.querySelector('.intro');
  if (intro) {
    var done = function () { root.classList.remove('intro-on'); if (intro.parentNode) intro.parentNode.removeChild(intro); };
    if (!root.classList.contains('intro-on')) done();
    else {
      intro.addEventListener('animationend', function (e) { if (e.animationName === 'introOut') done(); });
      setTimeout(done, 2500); // in case the animation never reports back
    }
  }
})();
