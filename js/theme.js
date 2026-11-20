// Light / dark switch. The starting theme is set by the small script in index.html's <head> so the page never flashes.
(function () {
  var root = document.documentElement;
  var button = document.querySelector('.theme-toggle');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!button) return;

  function saved() { try { return localStorage.getItem('rf-theme'); } catch (e) { return null; } }

  function apply(theme) {
    root.dataset.theme = theme;
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    if (meta) meta.content = theme === 'dark' ? '#0B1220' : '#FFFFFF';
  }
  apply(root.dataset.theme === 'light' ? 'light' : 'dark');

  button.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('rf-theme', next); } catch (e) {}
  });

  // Until the visitor picks a theme themselves, keep following their device setting.
  var deviceLight = window.matchMedia('(prefers-color-scheme: light)');
  var follow = function (e) { if (!saved()) apply(e.matches ? 'light' : 'dark'); };
  if (deviceLight.addEventListener) deviceLight.addEventListener('change', follow);
})();
