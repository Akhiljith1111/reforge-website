// Chat assistant. It answers from the page's own FAQ with set answers. It is not AI and says so.
(function () {
  var RF = window.RF = window.RF || {};
  var fab = document.querySelector('.chat-fab');
  var panel = document.getElementById('chat-panel');
  if (!fab || !panel) return;
  var log = panel.querySelector('.chat-log');
  var chips = panel.querySelector('.chat-chips');
  var form = panel.querySelector('.chat-form');
  var input = panel.querySelector('#chat-input');
  var closeButton = panel.querySelector('.chat-close');
  var hasWhatsApp = RF.isSet && RF.CONFIG && RF.isSet(RF.CONFIG.whatsapp);

  var GREETING = "Hi! I'm REFORGE's automated helper. Pick a question below or type your own.";
  var FALLBACK = hasWhatsApp
    ? "I don't have an answer for that one. Tap “Chat on WhatsApp” above and you'll get a personal reply."
    : "I don't have an answer for that one. Please use the contact form on this page and you'll get a personal reply.";

  // Answers come straight from the FAQ section, so editing the FAQ in index.html updates the assistant too.
  var entries = Array.prototype.map.call(document.querySelectorAll('.faq details'), function (item) {
    return {
      q: item.querySelector('summary').textContent.trim(),
      a: item.querySelector('p').textContent.trim(),
      keywords: item.dataset.keywords || '',
    };
  });
  var faqCount = entries.length;
  entries.push({
    q: 'What services do you offer?',
    a: 'REFORGE offers website design and build, AI chatbots and automation, website redesign, and SEO and maintenance.',
    keywords: 'service offer build make create chatbot ai automation seo redesign maintenance website app landing page',
  });
  entries.push({
    q: 'How can I contact you?',
    a: hasWhatsApp ? 'The quickest way is WhatsApp, using the button above. You can also use the contact form on this page.'
                   : 'Please use the contact form on this page.',
    keywords: 'contact reach call phone email whatsapp talk message number speak',
  });

  function say(who, text) {
    var bubble = document.createElement('p');
    bubble.className = 'chat-msg ' + (who === 'user' ? 'is-user' : 'is-bot');
    bubble.textContent = text; // textContent, never innerHTML: visitor text is shown as plain text
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function answer(question) {
    question = question.trim();
    if (!question) return;
    say('user', question);
    if (/^(hi|hello|hey|hai|hii+)\b[\s!.]*$/i.test(question)) { say('bot', 'Hello! What would you like to know?'); return; }
    var hit = RF.matchAnswer(question, entries);
    say('bot', hit ? hit.a : FALLBACK);
  }

  entries.slice(0, Math.min(4, faqCount)).forEach(function (entry) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = entry.q;
    chip.addEventListener('click', function () { answer(entry.q); });
    chips.appendChild(chip);
  });

  var greeted = false;
  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    fab.setAttribute('aria-label', open ? 'Close the REFORGE assistant' : 'Open the REFORGE assistant');
    if (open) {
      if (!greeted) { say('bot', GREETING); greeted = true; }
      input.focus();
    }
  }

  fab.addEventListener('click', function () { setOpen(panel.hidden); });
  closeButton.addEventListener('click', function () { setOpen(false); fab.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); fab.focus(); }
  });
  panel.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]')) setOpen(false); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    answer(input.value);
    input.value = '';
  });
})();
