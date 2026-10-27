# Live Demo

**Live site:https://taskmanager2-sepia.vercel.app/
Example placeholders:

- GitHub Pages: `https://<your-username>.github.io/<your-repo>/task2-task-manager/`
- Vercel / Netlify:https://taskmanager2-sepia.vercel.app/
---

# Taskflow — Dynamic Task Manager & Productivity Tracker

A client-side task manager for the **Datheon Full Stack Web Development Internship — Task 2**. Built with plain HTML5, CSS3, and vanilla JavaScript (ES6+) — no frameworks and no build step. Tasks persist in the browser via `localStorage`.

## Overview

Taskflow lets you create, edit, complete, and delete tasks; organize them by **Work**, **Personal**, and **Study**; set due dates; filter by status; search quickly; and reorder with drag-and-drop. Completing a task plays a short CSS transition. All state lives in a `tasks = []` array and is saved/loaded through `saveToLocalStorage()` / `loadFromLocalStorage()`.

## Features

- Full CRUD — create, read, update, and delete tasks
- Categories: Work, Personal, Study
- Optional due dates with overdue / due-soon highlighting
- Mark complete or incomplete (checkbox)
- Status filters: All, Active, Completed
- Category filter dropdown
- Quick search across title and category (search + filters persist in `localStorage`)
- Drag-and-drop reordering plus ↑/↓ buttons for touch/keyboard
- Delete confirmation with short Undo toast
- Clear completed (confirmed); Export / Import JSON backup (local only)
- `localStorage` persistence for tasks (survives reload)
- Light / dark theme via CSS variables; toggle in the header; choice persisted in `localStorage`, with `prefers-color-scheme` on first visit
- Due dates cannot be set in the past (`min` + JS validation)
- Completion and exit animations (CSS transitions; respects `prefers-reduced-motion`)
- Accessible labels, focus styles, skip link, Escape to cancel edit
- Mobile-friendly layout

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 |
| Styles | CSS3 (custom properties, Flexbox/Grid, transitions) |
| Behavior | Vanilla JavaScript (ES6+) |
| Storage | `localStorage` |
| Fonts | Google Fonts — Syne, Atkinson Hyperlegible |

No npm, bundlers, or frameworks required.

## Folder Structure

```text
task2-task-manager/
├── index.html
├── style.css
├── script.js
└── README.md
```

Relative paths only — open or serve this folder as the site root.

## How to Run

From the repository root:

```bash
cd task2-task-manager
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080` in your browser.

You can also open `index.html` directly in a browser; a local static server is preferred.

## Deploy — Vercel (root = `task2-task-manager`)

1. Sign in at [vercel.com](https://vercel.com) and import this GitHub repository.
2. Set **Root Directory** to `task2-task-manager`.
3. Framework preset: **Other** (no build command).
4. Deploy. Copy the production URL into the **Live Demo** section above.

Netlify: set the publish directory to `task2-task-manager` with no build command.

## Deploy — GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages** and deploy from your branch.
3. Visit the Pages URL and append `/task2-task-manager/` if the app lives in that subfolder.
4. Update the **Live Demo** URL at the top of this README.

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 2.
