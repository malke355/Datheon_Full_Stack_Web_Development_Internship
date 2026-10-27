# Live Demo

> **Status:** Not deployed yet — replace the URL below after you publish.

**Live site:** https://task1developerportfolio.vercel.app/ _(placeholder)_

Expected URLs once live:

| Host | Typical URL |
| --- | --- |
| GitHub Pages | `https://malke355.github.io/Datheon_Full_Stack_Web_Development_Internship/task1-developer-portfolio/` |
| Vercel | `https://task1developerportfolio.vercel.app/ (Root Directory = `task1-developer-portfolio`) |

---

# Task 1 — Personal Developer Portfolio

Static personal portfolio for **Melkamu Teshome**, built for the Datheon Full Stack Web Development Internship. Plain HTML, CSS, and vanilla JavaScript — no frameworks, no build step.

> **Before sharing publicly:** swap placeholder contacts (`melkamu@example.com`, GitHub, LinkedIn) in `index.html`, `script.js`, and this README.

## Overview

A single-page portfolio with sticky navigation, hero intro, about + resume download, grouped skills, JS-driven project cards with accessible detail modals, a validated contact form, and light/dark theme persistence. Designed mobile-first and ready for GitHub Pages or Vercel from this folder.

## Features

- Sticky header — logo, section links, theme toggle, mobile hamburger
- Hero — name, title, tagline, primary CTAs
- About — profile image + downloadable resume PDF
- Skills — Frontend, Backend, and Tools (CSS Grid)
- Projects — rendered from a JS data array with accessible detail modals (X, Escape, backdrop)
- Contact — details + client-side validation (name, email, message)
- Theming — light/dark via CSS variables; first visit respects `prefers-color-scheme`
- Navigation — smooth scroll + active link highlighting
- Motion — IntersectionObserver scroll reveals (honors reduced motion)
- Accessibility — skip link, alt text, ARIA, focus states, keyboard-friendly modal
- SEO basics — title, meta description, viewport, Open Graph tags
- Responsive — breakpoints at 375 / 768 / 1024 / 1440

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (semantic sections) |
| Styles | CSS3 (Flexbox, Grid, custom properties) |
| Behavior | Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts — Syne, Atkinson Hyperlegible |
| Assets | SVG placeholders + PDF resume |

No npm, bundlers, or frameworks.

## Folder Structure

```text
task1-developer-portfolio/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── profile.svg
    ├── project-events.svg
    ├── project-tasks.svg
    ├── project-weather.svg
    ├── project-portfolio.svg
    ├── favicon.svg
    ├── og-preview.svg
    └── resume-placeholder.pdf
```

Paths in this README are relative to this folder inside the monorepo.

## Run Locally

From the **repository root**:

```bash
cd task1-developer-portfolio
python3 -m http.server 8080
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

You can open `index.html` directly in a browser; a local static server is preferred.

## Deploy — GitHub Pages

This site lives in a subfolder, so Pages must serve that path (or publish only this folder).

1. Push the latest `main` (or your deploy branch) to GitHub.
2. Open the repo → **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select branch `main` and folder **/ (root)**, then save.
5. Wait a few minutes, then open:

   `https://malke355.github.io/Datheon_Full_Stack_Web_Development_Internship/task1-developer-portfolio/`

6. Paste that URL into **Live Demo** above and update `og:url` in `index.html`.

**Optional — publish only this folder** (cleaner root URL): use a GitHub Action or a `gh-pages` branch that copies `task1-developer-portfolio/` to the Pages publish root, then set Pages to that branch.

## Deploy — Vercel

1. Sign in at [vercel.com](https://vercel.com) and **Import** this GitHub repository.
2. Set **Root Directory** to `task1-developer-portfolio`.
3. Framework Preset: **Other** (no build command).
4. Leave the output as the folder root (static files as-is).
5. Deploy, then copy the production URL into **Live Demo** and `og:url` in `index.html`.

Netlify is the same idea: publish directory = `task1-developer-portfolio`, no build command.

## Screenshots

Add images after deploy (optional for reviewers):

| Viewport | Suggested file |
| --- | --- |
| Desktop (light) | `assets/screenshot-desktop-light.png` |
| Desktop (dark) | `assets/screenshot-desktop-dark.png` |
| Mobile | `assets/screenshot-mobile.png` |

Until then, run locally or open the live demo and check 375px / 768px / 1024px / 1440px.

```markdown
<!-- After capture, embed like this: -->
![Desktop light](assets/screenshot-desktop-light.png)
![Desktop dark](assets/screenshot-desktop-dark.png)
![Mobile](assets/screenshot-mobile.png)
```

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 1. Replace fictional placeholders before production use.
