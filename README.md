# REFORGE website

A one-page website for REFORGE with a scroll-driven forge animation, light and dark modes, and a chat assistant.

## View it

Double-click `index.html`. It opens in your browser. No install needed.

## Add your details

Open `js/config.js` in any text editor (Notepad works). Replace each value that starts with `TODO_`, removing the `TODO_` part too:

| Setting | What to put |
|---|---|
| `name` | Your first name. The About section will read "Hi, I'm <name>." |
| `bio` | One or two sentences about you. |
| `whatsapp` | Your number with country code, digits only, for example `919876543210`. |
| `email` | Your email address. |
| `instagram` | Your Instagram username without the `@`. |
| `web3formsKey` | See "Connect the contact form" below. |

Anything you haven't filled in simply doesn't appear on the site:

- Without a WhatsApp number, the main button reads "Get in touch" and scrolls to the contact form. With one, it becomes "Chat on WhatsApp", and a WhatsApp button also appears in the chat assistant.
- WhatsApp, email and Instagram each show in the contact section only once set.

To use your own photo in the About section, replace `assets/about-photo.png` with a square photo of the same name. Keep it under about 200 KB so the page stays fast.

## Connect the contact form

1. Go to https://web3forms.com and enter your email address.
2. They email you an access key.
3. Paste it into `web3formsKey` in `js/config.js`.

Enquiries are then emailed to you. Until the key is added, the form shows "The form isn't connected yet" and sends nothing.

## Change the colours

All colours are in `colours.css`. The two blocks at the top set dark mode and light mode. The forge animation keeps its own orange "hot metal" colours, set a little further down in the same file.

## Change the chat assistant's answers

The assistant answers from the FAQ section in `index.html`. Edit a question or answer there and the assistant uses the new text. Each FAQ item also has a `data-keywords` list: words that should lead to that answer. The assistant uses set answers, not AI, and says so in its header.

## Things to review before going live

- The FAQ answers are sensible defaults. Change them to match how you actually work.
- The portfolio items and the before/after slider are concept designs and are labelled "Concept". Replace them with real projects when you have some.
- "I usually reply within a day" appears in the contact section and in the form's thank-you message.

## Publish it free

1. Make a new folder and copy in only these: `index.html`, `styles.css`, `extras.css`, `colours.css`, the `js` folder and the `assets` folder. (The `docs` and `tests` folders and this file don't need to be public.)
2. Go to https://app.netlify.com/drop and drag that folder onto the page.
3. Netlify gives you a live link. You can connect your own domain later.
4. Once you know your web address, open `index.html` and change the `og:image` line near the top to the full address, for example `https://yourdomain.com/assets/reforge-social.png`. This makes the preview picture show when you share the link on WhatsApp or Instagram.

## How the animation works

- `js/scroll-math.js` turns scroll position into a number from 0 to 1.
- `js/forge-scene.js` draws the top scene from that number: raw wireframe, heat, hammer strikes, finished site.
- `js/molten-line.js` draws the line down the page and lights up each section as it passes.
- Because everything is drawn from scroll position, the animation follows the scrollbar in both directions.
- Visitors who have "reduce motion" switched on in their device settings see the finished page with no animation.

## Other files

- `js/theme.js`: the light / dark switch.
- `js/effects.js`: progress bar, menu highlight, changing headline word, cursor glow, tilt cards, magnetic buttons, logo intro.
- `js/compare.js`: the before / after slider.
- `js/chat.js` and `js/site-logic.js`: the chat assistant.
- `js/site.js`: fills in your details, the phone menu and the contact form.

## Run the tests (optional, needs Node.js)

```
node --test tests/scroll-math.test.js tests/site-logic.test.js
```
