const test = require('node:test');
const assert = require('node:assert/strict');
const {
  clamp01, regionProgress, throughProgress, segment, stageIndex, strikeCount, hammerImpact, sparkPosition,
} = require('../js/scroll-math.js');

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} should be about ${b}`);

test('clamp01', () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01(0.4), 0.4);
});

test('regionProgress spans the pinned distance', () => {
  // region 4000 tall at top 1000, viewport 800: pinned distance is 3200
  assert.equal(regionProgress(1000, 4000, 1000, 800), 0);
  assert.equal(regionProgress(1000, 4000, 2600, 800), 0.5);
  assert.equal(regionProgress(1000, 4000, 4200, 800), 1);
  assert.equal(regionProgress(1000, 4000, 0, 800), 0);
  assert.equal(regionProgress(1000, 4000, 9000, 800), 1);
});

test('regionProgress is 1 when region fits in the viewport', () => {
  assert.equal(regionProgress(0, 600, 0, 800), 1);
});

test('throughProgress follows an anchor line down the region', () => {
  // region top 1000, height 2000, viewport 1000, anchor 0.6, plenty of scroll room
  assert.equal(throughProgress(1000, 2000, 0, 1000, 0.6, 9000), 0);
  near(throughProgress(1000, 2000, 400, 1000, 0.6, 9000), 0);
  near(throughProgress(1000, 2000, 1400, 1000, 0.6, 9000), 0.5);
  assert.equal(throughProgress(1000, 2000, 2400, 1000, 0.6, 9000), 1);
});

test('throughProgress still reaches 1 when the page ends early', () => {
  // the anchor could only get 80% of the way at max scroll 2000, so progress is stretched to end at 1
  assert.equal(throughProgress(1000, 2000, 2000, 1000, 0.6, 2000), 1);
  near(throughProgress(1000, 2000, 1200, 1000, 0.6, 2000), 0.5);
});

test('segment', () => {
  assert.equal(segment(0.25, 0.25, 0.5), 0);
  assert.equal(segment(0.375, 0.25, 0.5), 0.5);
  assert.equal(segment(0.9, 0.25, 0.5), 1);
});

test('stageIndex', () => {
  assert.equal(stageIndex(0, 4), 0);
  assert.equal(stageIndex(0.49, 4), 1);
  assert.equal(stageIndex(0.5, 4), 2);
  assert.equal(stageIndex(1, 4), 3);
});

test('strikeCount', () => {
  const pts = [0.55, 0.62, 0.69];
  assert.equal(strikeCount(0.5, pts), 0);
  assert.equal(strikeCount(0.62, pts), 2);
  assert.equal(strikeCount(1, pts), 3);
});

test('hammerImpact peaks exactly at each strike and rests between them', () => {
  const pts = [0.55, 0.62, 0.69];
  assert.equal(hammerImpact(0.4, pts), 0);
  near(hammerImpact(0.55, pts), 1);
  near(hammerImpact(0.62, pts), 1);
  assert.equal(hammerImpact(0.5825, pts), 0);
  assert.ok(hammerImpact(0.54, pts) > 0 && hammerImpact(0.54, pts) < 1);
  assert.equal(hammerImpact(0.9, pts), 0);
});

test('sparkPosition is deterministic and fades out', () => {
  assert.deepEqual(sparkPosition(7, 0.3), sparkPosition(7, 0.3));
  assert.equal(sparkPosition(7, 1).alpha, 0);
  assert.notDeepEqual(sparkPosition(7, 0.3), sparkPosition(8, 0.3));
});
