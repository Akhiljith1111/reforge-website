const test = require('node:test');
const assert = require('node:assert/strict');
const { matchAnswer, validContact, tiltAngles } = require('../js/site-logic.js');
const { lineState } = require('../js/scroll-math.js');

const faq = [
  { id: 'cost', q: 'How much does a website cost?', a: 'cost answer', keywords: 'cost price pricing charge rate fee budget expensive cheap quote money' },
  { id: 'time', q: 'How long does it take?', a: 'time answer', keywords: 'time timeline days weeks months deadline fast quick soon duration' },
  { id: 'changes', q: 'Can I ask for changes?', a: 'changes answer', keywords: 'change revision edit update modify alter feedback' },
  { id: 'domain', q: 'Do you handle the domain and hosting?', a: 'domain answer', keywords: 'domain hosting host server name live publish' },
];
const idOf = (question) => { const hit = matchAnswer(question, faq); return hit ? hit.id : null; };

test('matchAnswer finds the FAQ entry a question is about', () => {
  assert.equal(idOf('how much do you charge?'), 'cost');
  assert.equal(idOf('What are your prices'), 'cost');
  assert.equal(idOf('how long will it take'), 'time');
  assert.equal(idOf('do you do hosting'), 'domain');
  assert.equal(idOf('can I ask for changes later'), 'changes');
});

test('matchAnswer returns null when it has nothing relevant', () => {
  assert.equal(idOf('asdf qwer'), null);
  assert.equal(idOf(''), null);
  assert.equal(idOf('   '), null);
  assert.equal(idOf('what is the'), null);
  assert.equal(matchAnswer('how much', []), null);
});

test('matchAnswer prefers the entry with the most matching words', () => {
  // "fast" belongs to time; "price" and "cost" both belong to cost
  assert.equal(idOf('fast price cost'), 'cost');
});

test('validContact accepts an email or a phone number and rejects anything else', () => {
  assert.equal(validContact('me@example.com'), true);
  assert.equal(validContact('+91 98765 43210'), true);
  assert.equal(validContact('9876543'), true);
  assert.equal(validContact('asdf'), false);
  assert.equal(validContact('12345'), false);
  assert.equal(validContact('@'), false);
  assert.equal(validContact(''), false);
});

test('tiltAngles leans towards the pointer and is flat at the centre', () => {
  assert.deepEqual(tiltAngles(100, 50, 200, 100, 8), { rx: 0, ry: 0 });
  assert.deepEqual(tiltAngles(200, 50, 200, 100, 8), { rx: 0, ry: 8 });
  assert.deepEqual(tiltAngles(100, 0, 200, 100, 8), { rx: 8, ry: 0 });
  assert.deepEqual(tiltAngles(0, 100, 200, 100, 8), { rx: -8, ry: -8 });
});

test('lineState keeps the tip on the anchor line, then fills the R', () => {
  // line is 1000 long, the R fills over the next 200 of scroll
  assert.deepEqual(lineState(0, 1000, 200), { tipY: 0, fill: 0 });
  assert.deepEqual(lineState(0.5, 1000, 200), { tipY: 600, fill: 0 });
  const atEnd = lineState(1000 / 1200, 1000, 200);
  assert.ok(Math.abs(atEnd.tipY - 1000) < 1e-9 && atEnd.fill < 1e-9);
  const half = lineState(1100 / 1200, 1000, 200);
  assert.equal(half.tipY, 1000);
  assert.ok(Math.abs(half.fill - 0.5) < 1e-9);
  assert.deepEqual(lineState(1, 1000, 200), { tipY: 1000, fill: 1 });
});
