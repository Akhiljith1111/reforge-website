// Fills in owner details, runs the menu and contact form, and starts the scroll animation.
(function () {
  var RF = window.RF = window.RF || {};
  var CONFIG = RF.CONFIG || {};
  var root = document.documentElement;

  function isSet(value) { return typeof value === 'string' && value !== '' && value.indexOf('TODO_') !== 0; }
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  RF.isSet = isSet;

  // ---------- Owner details ----------
  // Anything not set yet stays out of sight: contact rows remain hidden and buttons keep their neutral wording.
  var unset = [];
  all('[data-config]').forEach(function (el) {
    var key = el.dataset.config;
    var value = CONFIG[key];
    if (!isSet(value)) { if (unset.indexOf(key) < 0) unset.push(key); return; }

    var row = el.closest('.contact-list li');
    if (row) row.hidden = false;
    el.hidden = false;

    if (key === 'whatsapp') {
      var digits = value.replace(/\D/g, '');
      el.href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(CONFIG.whatsappGreeting || 'Hi REFORGE');
      el.target = '_blank';
      el.rel = 'noopener';
      if (el.dataset.setText) el.textContent = el.dataset.setText;
      else if (!el.hasAttribute('data-keep-text')) el.textContent = '+' + digits;
    } else if (key === 'email') {
      el.href = 'mailto:' + value;
      el.textContent = value;
    } else if (key === 'instagram') {
      var handle = value.replace(/^@/, '');
      el.href = 'https://instagram.com/' + encodeURIComponent(handle);
      el.target = '_blank';
      el.rel = 'noopener';
      el.textContent = '@' + handle;
    } else if (key === 'name') {
      el.textContent = "Hi, I'm " + value + '.';
    } else if (key === 'bio') {
      el.textContent = value;
    }
  });
  if (!isSet(CONFIG.web3formsKey)) unset.push('web3formsKey');
  if (unset.length && window.console) console.warn('REFORGE: not set in js/config.js yet: ' + unset.join(', '));

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Mobile menu ----------
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    links.classList.toggle('is-open', open);
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
  }

  // ---------- Contact form ----------
  var form = document.getElementById('enquiry');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    var button = form.querySelector('button[type="submit"]');
    var hasWhatsApp = isSet(CONFIG.whatsapp);
    var connected = isSet(CONFIG.web3formsKey);
    var NOT_CONNECTED = hasWhatsApp ? "The form isn't connected yet. Please use WhatsApp." : "The form isn't connected yet.";
    var FAILED = hasWhatsApp ? "That didn't send. Please message me on WhatsApp instead." : "That didn't send. Please try again in a few minutes.";

    status.id = status.id || 'enquiry-status';
    function say(text, state) { status.textContent = text; status.dataset.state = state || ''; }
    if (!connected) say(NOT_CONNECTED);

    ['name', 'contact', 'message'].forEach(function (field) {
      var input = form.elements[field];
      input.setAttribute('aria-describedby', status.id);
      input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var problems = [];
      ['name', 'contact', 'message'].forEach(function (field) {
        var input = form.elements[field];
        var bad = !input.value.trim() || (field === 'contact' && !RF.validContact(input.value));
        if (bad) { input.setAttribute('aria-invalid', 'true'); problems.push(input); } else input.removeAttribute('aria-invalid');
      });
      if (problems.length) {
        say(problems[0] === form.elements.contact && form.elements.contact.value.trim()
          ? 'Please enter an email address or phone number so I can reply.'
          : 'Please fill in your name, an email or phone number, and a short message.', 'error');
        problems[0].focus();
        return;
      }
      if (form.elements.botcheck.checked) return; // ticked by a bot, not a person
      if (!connected) { say(NOT_CONNECTED, 'error'); return; }

      var contact = form.elements.contact.value.trim();
      var payload = {
        access_key: CONFIG.web3formsKey,
        subject: 'New REFORGE enquiry from ' + form.elements.name.value.trim(),
        name: form.elements.name.value.trim(),
        contact: contact,
        service: form.elements.service.value,
        message: form.elements.message.value.trim(),
      };
      if (contact.indexOf('@') > 0) payload.email = contact; // lets the owner hit Reply

      var controller = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, 15000);

      button.disabled = true;
      say('Sending…');
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      })
        .then(function (res) { return res.json().then(function (data) { return res.ok && data.success; }); })
        .then(function (ok) {
          if (!ok) throw new Error('rejected');
          form.reset();
          say("Thanks. I'll reply within a day.", 'ok');
        })
        .catch(function () { say(FAILED, 'error'); })
        .then(function () { clearTimeout(timer); button.disabled = false; });
    });
  }

  // ---------- Scroll animation ----------
  // The "js" class is only present when the visitor has not asked for reduced motion (see index.html).
  // If anything goes wrong starting it, drop back to the plain static page rather than leaving it half-animated.
  if (root.classList.contains('js')) {
    try {
      var engine = RF.createEngine();
      RF.initForge(engine);
      RF.initMolten(engine);
      engine.start();
      RF.engine = engine;
    } catch (err) {
      root.classList.remove('js', 'intro-on');
      if (window.console) console.error('REFORGE: scroll animation could not start', err);
    }
  }
})();
