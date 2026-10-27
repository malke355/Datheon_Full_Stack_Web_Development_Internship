# Live Demo

**Live site:** _Coming soon — replace this URL after you deploy_

Example placeholders:

- GitHub Pages: `https://<your-username>.github.io/<your-repo>/task1-developer-portfolio/`
- Vercel / Netlify: `https://<your-project>.vercel.app` (or Netlify URL), with root set to `task1-developer-portfolio/`

---

# Melkamu Teshome — Personal Developer Portfolio

A static personal portfolio and project showcase for **Melkamu Teshome**, an aspiring full stack developer. Built with plain HTML5, CSS3, and vanilla JavaScript (ES6+) — no frameworks and no build step. Suitable for GitHub Pages, Vercel, or Netlify.

> **Placeholder contacts:** Replace `melkamu@example.com`, `https://github.com/melkamu`, and `https://linkedin.com/in/melkamu` with your real email and profiles before sharing publicly. Update the same values in `index.html`, `script.js` (project links), and this README.

## Overview

The site presents a sticky navigation header, hero introduction, about section with resume download, grouped skills, featured projects driven by a JavaScript data array (with accessible detail modals), a validated contact form, and a footer with social links. Light and dark themes are supported and persisted in `localStorage`.

## Features

- Sticky header with logo, section links, theme toggle, and mobile hamburger menu
- Hero with name, title, tagline, and primary CTAs
- About section with profile image and downloadable placeholder resume (PDF)
- Skills grouped into Frontend, Backend, and Tools (CSS Grid cards)
- Featured projects rendered from a JS array, with accessible modals (close via X, Escape, or backdrop)
- Contact details plus client-side form validation (name, email, message)
- Dark / light theme via CSS variables; respects `prefers-color-scheme` on first visit
- Smooth scrolling and active nav highlighting on scroll
- IntersectionObserver scroll-reveal animations (respects reduced motion)
- Accessibility: skip link, alt text, ARIA labels, focus states, keyboard-friendly modal
- SEO basics: title, meta description, viewport, Open Graph tags
- Mobile-first layout with breakpoints at 375 / 768 / 1024 / 1440

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (semantic sections) |
| Styles | CSS3 (Flexbox, Grid, custom properties) |
| Behavior | Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts — Syne, Atkinson Hyperlegible |
| Assets | SVG placeholders + minimal PDF resume |

No npm, bundlers, or frameworks required.

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

## Run Locally

Because this is a static site, any local static server works. From the repository root:

```bash
# Python 3
cd task1-developer-portfolio
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080` in your browser.

Alternatively, open `index.html` directly in a browser (some features such as module-less relative paths still work; a local server is preferred).

## Deploy — GitHub Pages (step by step)

1. Push this repository to GitHub (if it is not already remote).
2. In the repo on GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the branch that contains this folder (for example `main`) and folder **/ (root)** if you move the site to the repo root, **or** keep the site in `task1-developer-portfolio/` and either:
   - set the Pages root to that folder if your host supports a subfolder, or
   - use a GitHub Action / `gh-pages` branch that publishes only `task1-developer-portfolio/`.
5. Save. After a few minutes, visit the Pages URL and append `/task1-developer-portfolio/` if the site lives in that subfolder.
6. Update the **Live Demo** URL at the top of this README and the Open Graph `og:url` in `index.html`.

## Deploy — Vercel (step by step)

1. Sign in at [vercel.com](https://vercel.com) and import the GitHub repository.
2. Set **Root Directory** to `task1-developer-portfolio`.
3. Leave the framework preset as **Other** (no build command).
4. Output / publish directory can remain the root of that folder (static files as-is).
5. Deploy. Copy the production URL into the **Live Demo** section above and into `og:url` in `index.html`.

Netlify follows the same idea: set the publish directory to `task1-developer-portfolio` with no build command.

## Screenshots

Add screenshots after deploy (optional but recommended for reviewers):

| Viewport | File suggestion |
| --- | --- |
| Desktop (light) | `assets/screenshot-desktop-light.png` |
| Desktop (dark) | `assets/screenshot-desktop-dark.png` |
| Mobile | `assets/screenshot-mobile.png` |

Until screenshots are captured, open the live demo or run locally and resize the browser to 375px / 768px / 1024px / 1440px to verify layout.

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 1. Content placeholders are fictional where noted; replace before production use.
