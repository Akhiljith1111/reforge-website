# REFORGE Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page, scroll-animated website for REFORGE that turns visitors into WhatsApp or form enquiries.

**Architecture:** Static files with no build step. The page is complete and readable with no JavaScript. A small scroll engine turns scroll position into a 0 to 1 progress value per region, and two animation modules (forge scene, molten line) render purely from that value, so animation tracks scroll in both directions.

**Tech Stack:** HTML, CSS, vanilla JavaScript (classic scripts, so the page works when opened by double-click from disk), Canvas 2D, inline SVG, Web3Forms for the contact form, `node --test` for the pure scroll maths, headless Chrome for visual checks.

**Spec:** `docs/superpowers/specs/2026-11-21-reforge-website-design.md`

## Global Constraints

- No framework, no build step, no animation library.
- No ES modules: `file://` pages cannot load them. Each `js/*.js` file is a classic script that adds its functions to one global object, `window.RF`. `scroll-math.js` also sets `module.exports` when that exists, so Node can test it. Scripts load in this order with `defer`: config, scroll-math, scroll-engine, forge-scene, molten-line, site.
- Palette: `#12082A` (night), `#FF2E93` (pink), `#FF7A18` (orange), `#FFD23F` (gold). Fonts: Space Grotesk for headings, Inter for body, both from Google Fonts with system fallbacks.
- Logo files are copied from `../reforge-logo/final/` into `assets/`. Do not redraw the logo.
- Portfolio items are always labelled "Concept". No invented clients, testimonials or results.
- Owner details are placeholders for now. They live in one `CONFIG` object in `js/config.js`, and every placeholder value starts with `TODO_` so it can be found with one search.
- During scroll, only `transform`, `opacity` and CSS custom properties change on DOM elements.
- Works from 360px to wide desktop with no sideways scrolling.
- The folder is not a git repository. Do not commit unless the owner asks.

## Review Focus

1. **Reduced motion is on.** The forge scene shows its finished state at normal hero height, the molten line is fully drawn, and every section is visible.
2. **Jumping into the middle of the page** (anchor link, refresh while scrolled, fast flick). Every animated element shows the correct state for that position, because state depends only on progress and never on events having fired in order.
3. **Window resize or phone rotation.** Region measurements are recalculated and the animation still lines up.
4. **Contact form with no Web3Forms key.** The form says it is not set up yet and points to WhatsApp. It never shows "sent".
5. **Short, wide viewports** (phone held sideways, 360px tall). The fixed forge stage still fits, with the caption and the piece both visible.

## File Structure

```
reforge-website/
  index.html            content and markup for every section
  styles.css            tokens, layout, components, at-rest and reduced-motion states
  js/config.js          CONFIG: owner details and Web3Forms key
  js/scroll-math.js     pure functions, no DOM
  js/scroll-engine.js   measures regions, writes --p, calls renderers
  js/forge-scene.js     hero forge stages and canvas sparks
  js/molten-line.js     page-long SVG line and section ignition
  js/site.js            loaded last: menu, contact links, form, starts the engine
  assets/               logo SVGs, favicon, about placeholder
  tests/scroll-math.test.js
```

---

### Task 1: Static page, complete at rest

**Files:**
- Create: `index.html`, `styles.css`, `assets/` (copy `reforge-mark.svg`, `reforge-logo-for-dark-bg.svg`, `reforge-instagram-profile-1080.png` from `../reforge-logo/final/`)

**Interfaces:**
- Produces: section ids `hero`, `services`, `work`, `process`, `about`, `faq`, `contact`. Each animated section carries `data-ignite`. Forge markup: `#forge` (tall region) containing `.forge-stage` (sticky), `.forge-piece` (the wireframe-to-site element with child blocks `.fp-nav`, `.fp-hero`, `.fp-cards > i` x3), `canvas.forge-sparks`, and four `.forge-caption[data-stage="0..3"]`. Molten line markup: `svg.molten > path.molten-path`, and `svg.molten-r > path` inside `#contact`. Process steps: `.step[data-step="1..4"]`. Form: `form#enquiry` with fields `name`, `contact`, `service`, `message` and a `[data-form-status]` element. Elements filled from config carry `data-config="whatsapp|email|instagram|name|bio"`.

- [ ] **Step 1:** Write `index.html` with all nine parts from the spec's "Page sections", real copy throughout, FAQ built from `<details>`, and the markup hooks listed above.
- [ ] **Step 2:** Write `styles.css`. Tokens in `:root`. With no `.js` class on `<html>`, `#forge` is normal height showing the finished piece, all captions are stacked and visible, and the molten line is fully drawn. Navigation collapses below 760px.
- [ ] **Step 3: Verify.** Screenshot with headless Chrome at 390x844 and 1440x900. Expected: every section present and readable, no sideways scroll, finished piece shown in the hero.

### Task 2: Scroll maths

**Files:**
- Create: `js/scroll-math.js`
- Test: `tests/scroll-math.test.js`

**Interfaces:**
- Produces:
  - `clamp01(n: number): number`
  - `regionProgress(regionTop: number, regionHeight: number, scrollY: number, viewportHeight: number): number`. 0 when the region's top reaches the top of the viewport, 1 when its bottom reaches the bottom of the viewport. Returns 1 if the region is not taller than the viewport.
  - `segment(p: number, start: number, end: number): number`. Progress within a sub-range, clamped to 0..1.
  - `stageIndex(p: number, stages: number): number`. Integer 0..stages-1.
  - `strikeCount(p: number, strikePoints: number[]): number`. How many strike points are at or below `p`.
  - `sparkPosition(seed: number, t: number): {x: number, y: number, alpha: number}`. Deterministic arc for one spark, `t` in 0..1, no randomness at call time.

- [ ] **Step 1: Write the failing tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { clamp01, regionProgress, segment, stageIndex, strikeCount, sparkPosition } = require('../js/scroll-math.js');

test('clamp01', () => { assert.equal(clamp01(-1), 0); assert.equal(clamp01(2), 1); assert.equal(clamp01(0.4), 0.4); });
test('regionProgress spans the pinned distance', () => {
  // region 4000 tall at top 1000, viewport 800: pinned distance is 3200
  assert.equal(regionProgress(1000, 4000, 1000, 800), 0);
  assert.equal(regionProgress(1000, 4000, 2600, 800), 0.5);
  assert.equal(regionProgress(1000, 4000, 4200, 800), 1);
  assert.equal(regionProgress(1000, 4000, 0, 800), 0);
  assert.equal(regionProgress(1000, 4000, 9000, 800), 1);
});
test('regionProgress is 1 when region fits in the viewport', () => { assert.equal(regionProgress(0, 600, 0, 800), 1); });
test('segment', () => { assert.equal(segment(0.25, 0.25, 0.5), 0); assert.equal(segment(0.375, 0.25, 0.5), 0.5); assert.equal(segment(0.9, 0.25, 0.5), 1); });
test('stageIndex', () => { assert.equal(stageIndex(0, 4), 0); assert.equal(stageIndex(0.49, 4), 1); assert.equal(stageIndex(0.5, 4), 2); assert.equal(stageIndex(1, 4), 3); });
test('strikeCount', () => { const pts = [0.55, 0.62, 0.69]; assert.equal(strikeCount(0.5, pts), 0); assert.equal(strikeCount(0.62, pts), 2); assert.equal(strikeCount(1, pts), 3); });
test('sparkPosition is deterministic and fades out', () => {
  assert.deepEqual(sparkPosition(7, 0.3), sparkPosition(7, 0.3));
  assert.equal(sparkPosition(7, 1).alpha, 0);
  assert.notDeepEqual(sparkPosition(7, 0.3), sparkPosition(8, 0.3));
});
```

- [ ] **Step 2:** Run `node --test tests/`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement the six functions in `js/scroll-math.js`. `sparkPosition` derives angle and speed from a hash of `seed`, with gravity applied over `t`.
- [ ] **Step 4:** Run `node --test tests/`. Expected: all pass.

### Task 3: Scroll engine and forge scene

**Files:**
- Create: `js/scroll-engine.js`, `js/forge-scene.js`
- Modify: `styles.css` (the `.js` forge states), `index.html` (inline script in `<head>` that adds class `js` to `<html>` unless reduced motion is set)

**Interfaces:**
- Consumes: everything from Task 2, markup from Task 1.
- Produces:
  - `createEngine(): { add(el: Element, render: (p: number) => void): void, start(): void, refresh(): void }`. Measures each region on start, on `resize` and on `orientationchange`. One `scroll` listener throttled by `requestAnimationFrame`. Sets `--p` on each element and calls its renderer. Calls every renderer once on start with the current position.
  - `initForge(engine): void`.

- [ ] **Step 1:** Implement `createEngine` as specified.
- [ ] **Step 2:** Implement `initForge`. With `.js`, `#forge` is `400vh` (`300vh` below 760px) and `.forge-stage` is sticky and `100vh` (`100dvh` where supported). Stages by progress: 0 to 0.25 raw grey wireframe; 0.25 to 0.5 heat (colour moves from grey to orange through a `--heat` property, embers rise); 0.5 to 0.75 strikes at `[0.55, 0.62, 0.69]`, each snapping one wireframe block into its layout position and emitting a spark burst whose age is `segment(p, strikePoint, strikePoint + 0.06)`; 0.75 to 1 colour and content fade in and the browser frame appears. The visible caption is `stageIndex(p, 4)`.
- [ ] **Step 3:** Sparks: 24 per burst on desktop, 10 below 760px, drawn on the canvas from `sparkPosition`. The canvas is cleared and fully redrawn from `p` on every render. Canvas backing size follows `devicePixelRatio`, capped at 2.
- [ ] **Step 4: Verify.** In headless Chrome, scroll to 10%, 40%, 62% and 95% of the forge region and screenshot at 1440x900 and 390x844. Expected: the four stages in order. Then load the page already scrolled to 62% and screenshot. Expected: identical to the scrolled-to 62% frame (Review Focus 2). Screenshot at 800x360. Expected: caption and piece both visible (Review Focus 5).

### Task 4: Molten line and section ignition

**Files:**
- Create: `js/molten-line.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `createEngine` from Task 3, `segment` and `clamp01` from Task 2.
- Produces: `initMolten(engine): void`.

- [ ] **Step 1:** Implement `initMolten`. The line region runs from the end of `#forge` to the end of `#contact`. Build the path's `d` at start and on `refresh` so it runs down the left gutter on desktop and the left edge on phones, bending into each `[data-ignite]` section's heading. Drawn length is `stroke-dasharray` and `stroke-dashoffset` from progress.
- [ ] **Step 2:** Each `[data-ignite]` section gets `--lit` from 0 to 1 as the tip crosses its heading, and each `.step` gets class `is-lit` when the tip passes it. Both are set from progress on every render, so they also turn off when scrolling up. CSS uses `--lit` for heading glow and card reveal (`opacity`, `transform`).
- [ ] **Step 3:** Over the final 8% of progress, fill `svg.molten-r` from bottom to top with the gradient.
- [ ] **Step 4: Verify.** Screenshot at 30%, 60% and 100% of page scroll at both widths. Expected: line tip at the matching section, earlier sections lit, later ones dim but still readable, R filled at 100%. Resize from 1440 to 390 without reloading and screenshot. Expected: line still meets each heading (Review Focus 3).

### Task 5: Menu, contact links and form

**Files:**
- Create: `js/config.js`, `js/site.js`
- Modify: `index.html`, `styles.css`

**Interfaces:**
- Produces: `CONFIG = { name, bio, whatsapp, email, instagram, web3formsKey }`, all values starting `TODO_` for now. `CONFIG` is exposed as `RF.CONFIG`. `site.js` loads last. It creates the engine, calls `initForge` and `initMolten`, then `engine.start()`.

- [ ] **Step 1:** Fill every `[data-config]` element from `CONFIG`. WhatsApp links are `https://wa.me/<digits>?text=<encoded greeting>`. While a value still starts with `TODO_`, its link keeps the visible placeholder text and gets `aria-disabled="true"`.
- [ ] **Step 2:** Mobile menu: a button toggles `aria-expanded` and the menu. It closes on link click and on Escape.
- [ ] **Step 3:** Form: validate required fields, then POST JSON to `https://api.web3forms.com/submit` with `access_key`. Status text in `[data-form-status]`: "Sending…", "Thanks. I'll reply within a day.", or "That didn't send. Please message me on WhatsApp instead." If `web3formsKey` starts with `TODO_`, do not send, and show "The form isn't connected yet. Please use WhatsApp." (Review Focus 4).
- [ ] **Step 4:** Reduced motion: when the `js` class is absent, `site.js` skips the engine and both animations (Review Focus 1).
- [ ] **Step 5: Verify.** Headless Chrome with reduced motion forced: screenshot shows the finished hero at normal height, the full line and all sections. Submit the form with the placeholder key: status shows the not-connected message. At 390px, open and close the menu.

### Task 6: Final check and handover

- [ ] **Step 1:** Run `node --test tests/`. Expected: all pass.
- [ ] **Step 2:** Add `<title>`, meta description, Open Graph tags and favicon to `index.html`.
- [ ] **Step 3:** Run the full checklist in the spec's "Testing" section at 390px and 1440px. Fix anything that fails.
- [ ] **Step 4:** Write `README.md`: how to open the site, the list of `TODO_` values to replace in `js/config.js`, how to get a Web3Forms key, and how to publish on Netlify.
