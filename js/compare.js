// Before / after slider. A real range input sits over the picture, so it works by mouse, touch and keyboard.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.compare-frame'), function (frame) {
    var range = frame.querySelector('.compare-range');
    if (!range) return;
    function update() { frame.style.setProperty('--pos', range.value + '%'); }
    range.addEventListener('input', update);
    update();
  });
})();
