# REFORGE website design

Date: 2026-11-21

## Purpose

A one-page website for REFORGE, a new web design and AI solutions studio. Its job is to turn visitors, mostly arriving from Instagram on phones, into client enquiries. Success means a visitor understands what REFORGE does within a few seconds, sees proof of skill, and can reach the owner by WhatsApp or the contact form in one tap.

## Decisions made by the owner

- Goal: get client enquiries.
- Structure: one scrolling page.
- Sections: Hero, Services, Portfolio, How we work, About me, FAQ, Contact.
- Services: website design and build, AI chatbots and automation, website redesign, SEO and maintenance.
- Portfolio: three concept projects, labelled as concepts, never presented as paid client work.
- Contact: floating WhatsApp button plus a contact form.
- Build: plain HTML, CSS and JavaScript. No framework and no build step.
- Animation: rich, themed on forging, and driven by scroll position.
- Brand: Plasma palette (`#12082A`, `#FF2E93`, `#FF7A18`, `#FFD23F`), Space Grotesk headings, Inter body text, the Forged R logo from `../reforge-logo/final/`.

## Files

```
reforge-website/
  index.html        all content and section markup
  styles.css        design tokens, layout, component styles
  js/               config, scroll maths, scroll engine, forge scene, molten line, site behaviour (one small file each)
  tests/            tests for the scroll maths
  assets/           logo SVGs, favicon, about photo
```

Owner details (WhatsApp number, email, Instagram handle, name, bio, Web3Forms key) live in one `CONFIG` object in `js/config.js`, and the page fills itself in from it, so they can be changed in one place. Scripts are plain (not ES modules) so the site works when opened straight from disk.

## Page sections

1. **Navigation bar.** Logo, section links, "Get a quote" button. Collapses to a menu button below 760px. Stays at the top while scrolling.
2. **Hero and forge scene.** Headline "Websites that stand out.", one supporting line, two buttons (WhatsApp, "See my work"). Scrolling on from here plays the forge scene described below.
3. **Services.** Four cards, one per service, each with a short description and a glow on hover.
4. **Portfolio.** Three concept sites (restaurant, clinic, startup) drawn as browser mockups in CSS and SVG, each tagged "Concept".
5. **How we work.** Four steps: Discover, Design, Build, Launch.
6. **About me.** Photo, short story, the slogan "Build. Innovate. Grow."
7. **FAQ.** Click-to-open questions covering cost, timeline, revisions and hosting. Built with `<details>` so it works without JavaScript.
8. **Contact.** Form with name, email or phone, service needed and message, beside WhatsApp, email and Instagram links.
9. **Footer** and a floating WhatsApp button on every screen.

## Scroll-driven animation

All animation is a pure function of scroll position. It advances while scrolling down, holds still when scrolling stops, and reverses when scrolling up. Nothing plays on a timer except small ambient glow effects.

### Scroll engine

One `scroll` listener, throttled with `requestAnimationFrame`, computes a progress value from 0 to 1 for each animated region and writes it to a CSS custom property on that region (`--p`). CSS and a small amount of JavaScript read `--p` to position, colour and reveal elements. No animation library.

### Forge scene (hero)

The hero region is about four screens tall with a stage that stays fixed in view (`position: sticky`) while the visitor scrolls through it. Progress maps to four stages:

| Progress | Stage | What the visitor sees |
|---|---|---|
| 0.00 to 0.25 | Raw | A cold grey wireframe of a website sits on the forge. Caption: "Every site starts as raw material." |
| 0.25 to 0.50 | Heat | The wireframe heats from grey to glowing orange. Embers rise. Caption: "We heat it up." |
| 0.50 to 0.75 | Strike | Hammer strikes land as scroll passes fixed points, each throwing sparks. Wireframe blocks snap into a real layout. Caption: "Shape it, strike by strike." |
| 0.75 to 1.00 | Finished | Colour, text and images fill in. The piece cools into a finished site in a browser frame. Caption: "And forge something that stands out." |

Sparks are drawn on a `<canvas>`. Their positions are computed from progress, not from time, so they also reverse.

### Molten line (rest of the page)

An SVG path runs down the page beside the content. Its drawn length follows overall page progress (`stroke-dashoffset`). As the molten tip reaches each section, that section's heading and cards light up. In "How we work" the line passes through each step number and ignites it. At the Contact section the line pours into the outline of the R logo and fills it.

### Fallbacks

- `prefers-reduced-motion`: the forge scene shows its finished state as a normal-height hero, the molten line is drawn in full, and all sections are visible.
- JavaScript unavailable: all content is visible and readable. The page is complete at rest.
- Phones: the forge scene is shortened to about three screens and uses fewer sparks.

## Contact form

Submits to Web3Forms by `fetch`, which emails the owner. The owner creates a free access key. States: sending, sent, and failed with a message that tells the visitor to use WhatsApp instead. Required fields are validated before sending. If no key is configured, the form says so and points to WhatsApp, so it never appears to send when it has not.

The WhatsApp button opens `wa.me/<number>` with a pre-filled greeting.

## Quality bar

- Works from 360px phone width to wide desktop, with no sideways scrolling.
- Scroll animation stays smooth: only `transform` and `opacity` change on DOM elements during scroll.
- Keyboard focus is visible, and the menu and FAQ are usable by keyboard.
- Page title, description and social preview tags are set for sharing links on Instagram and WhatsApp.

## Testing

Open the page in a browser and check at 390px and 1440px widths: every section renders, the forge scene tracks scroll in both directions, the molten line reaches each section, the menu opens and closes, FAQ items open, and the form shows each of its states. Check once with reduced motion switched on.

## Out of scope

Pricing packages, blog, multiple pages, a content management system, analytics, and domain purchase. Deployment to Netlify or GitHub Pages is a follow-up step after the owner approves the built site.
