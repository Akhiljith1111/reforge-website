// Small pure helpers for the chat assistant, the contact form and the tilt effect. No DOM access, so they can be tested in Node.
(function (root) {
  var STOP_WORDS = ('a an the is are am was do does did i you your yours my me we our us to of for in on at it its can could would will ' +
    'should what how when where which who why with and or be been have has had want get about that this there any please so if not no ' +
    'yes hi hello hey thanks thank').split(' ');
  var STOP = {};
  STOP_WORDS.forEach(function (w) { STOP[w] = true; });

  // Lower-case words with punctuation removed, common words dropped and a trailing "s" trimmed.
  function tokens(text) {
    var seen = {};
    var out = [];
    String(text || '').toLowerCase().split(/[^a-z0-9]+/).forEach(function (word) {
      if (!word || STOP[word]) return;
      if (word.length > 3 && word.charAt(word.length - 1) === 's') word = word.slice(0, -1);
      if (!seen[word]) { seen[word] = true; out.push(word); }
    });
    return out;
  }

  // Picks the entry ({ q, a, keywords }) sharing the most words with the question. Null when nothing matches.
  function matchAnswer(question, entries) {
    var asked = tokens(question);
    if (!asked.length) return null;
    var best = null;
    var bestScore = 0;
    entries.forEach(function (entry) {
      var known = {};
      tokens(entry.q + ' ' + (entry.keywords || '')).forEach(function (w) { known[w] = true; });
      var score = 0;
      asked.forEach(function (w) { if (known[w]) score++; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return best;
  }

  // True for something that looks like an email address or a phone number.
  function validContact(value) {
    var text = String(value || '').trim();
    if (/^\S+@\S+\.\S+$/.test(text)) return true;
    return text.replace(/\D/g, '').length >= 7;
  }

  // Rotation in degrees for a card of size w x h with the pointer at x, y (measured from its top-left corner).
  function tiltAngles(x, y, w, h, max) {
    var nx = (x / w - 0.5) * 2;
    var ny = (y / h - 0.5) * 2;
    return { rx: -ny * max + 0, ry: nx * max + 0 };
  }

  var api = { tokens: tokens, matchAnswer: matchAnswer, validContact: validContact, tiltAngles: tiltAngles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.RF = root.RF || {}; for (var k in api) root.RF[k] = api[k]; }
})(typeof window !== 'undefined' ? window : null);
