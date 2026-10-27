# Live Demo

**Live site:** [https://taskmanager2-sepia.vercel.app/](https://taskmanager2-sepia.vercel.app/)

Deployed on Vercel (Root Directory = `task2-task-manager`).

---

# Task 2 — Taskflow (Dynamic Task Manager)

Client-side task manager and productivity tracker for the **Datheon Full Stack Web Development Internship — Task 2**. Built with plain HTML5, CSS3, and vanilla JavaScript (ES6+) — no frameworks, no build step. All data stays in the browser via `localStorage`.

## Overview

Taskflow lets you create, edit, complete, and delete tasks; organize them by **Work**, **Personal**, and **Study**; set due dates; filter by status; search quickly; and reorder with drag-and-drop. Completing a task plays a short CSS transition. State lives in a `tasks = []` array and is saved/loaded through `saveToLocalStorage()` / `loadFromLocalStorage()`. First visit seeds three sample tasks so the UI is never empty.

## Features

- Full CRUD — create, read, update, and delete tasks
- Categories — Work, Personal, Study
- Optional due dates with **Overdue** / **Due today** / **Due soon** highlighting
- Due-date guard — past dates blocked (`min` attribute + JS validation)
- Mark complete or incomplete (checkbox + completion animation)
- Status filters — All, Active, Completed
- Category filter dropdown
- Quick search across title and category (search + filters persist in `localStorage`)
- Drag-and-drop reorder plus ↑ / ↓ buttons for touch and keyboard
- Delete confirmation with short **Undo** toast
- **Clear completed** — bulk-remove finished tasks (confirmed)
- **Export JSON** / **Import JSON** — download or restore a local backup
- `localStorage` persistence for tasks (survives reload)
- Light / dark theme via CSS variables; toggle in the header; choice persisted, with `prefers-color-scheme` on first visit
- Accessible labels, focus styles, skip link, Escape to cancel edit
- Motion respects `prefers-reduced-motion`
- Mobile-friendly layout

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (semantic regions, labeled form controls) |
| Styles | CSS3 (custom properties, Flexbox/Grid, transitions) |
| Behavior | Vanilla JavaScript (ES6+) |
| Storage | `localStorage` (`taskflow.tasks.v1`, theme, UI prefs) |
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

## How It Works

| Concern | Detail |
| --- | --- |
| State | In-memory `tasks` array; each task has `id`, `title`, `category`, `dueDate`, `completed`, `createdAt`, `order` |
| Persist | `saveToLocalStorage()` / `loadFromLocalStorage()` on every change |
| Render | `render()` rebuilds the visible list from filters + search |
| Theme | `data-theme="light\|dark"` on `<html>`; stored under `taskflow.theme.v1` |
| UI prefs | Active status/category filters and search query stored under `taskflow.ui.v1` |

### Toolbar utilities

| Button | What it does |
| --- | --- |
| Clear completed | Confirms, then removes every completed task |
| Export JSON | Downloads `taskflow-backup-YYYY-MM-DD.json` (versioned backup with all tasks) |
| Import JSON | Picks a backup file, confirms, then **replaces** the current task list |

Backup shape (what Export writes / Import expects):

```json
{
  "version": 1,
  "app": "taskflow",
  "exportedAt": "2026-10-27T16:38:31.194Z",
  "tasks": [
    {
      "id": "…",
      "title": "Review ES6 array methods",
      "category": "Study",
      "dueDate": "2026-10-30",
      "completed": false,
      "createdAt": 1793118580421,
      "order": 0
    }
  ]
}
```

A bare JSON array of tasks is also accepted on import.

## Run Locally

From the **repository root**:

```bash
cd task2-task-manager
python3 -m http.server 8080
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

**Without Python** (Node.js installed):

```bash
cd task2-task-manager
npx --yes serve -l 8080
```

You can open `index.html` directly in a browser; a local static server is preferred.

## Deploy — Vercel

Already live at [https://taskmanager2-sepia.vercel.app/](https://taskmanager2-sepia.vercel.app/).

To redeploy or recreate:

1. Sign in at [vercel.com](https://vercel.com) and **Import** this GitHub repository.
2. Set **Root Directory** to `task2-task-manager`.
3. Framework Preset: **Other** (no build command).
4. Deploy, then keep **Live Demo** above pointed at the production URL.

Netlify: publish directory = `task2-task-manager`, no build command.

## Deploy — GitHub Pages

This app lives in a subfolder, so Pages must serve that path (or publish only this folder).

1. Push the latest `main` (or your deploy branch) to GitHub.
2. Open the repo → **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select branch `main` and folder **/ (root)**, then save.
5. Wait a few minutes, then open:

   `https://malke355.github.io/Datheon_Full_Stack_Web_Development_Internship/task2-task-manager/`

6. Paste that URL into **Live Demo** above.

**Optional — publish only this folder** (cleaner root URL): use a GitHub Action or a `gh-pages` branch that copies `task2-task-manager/` to the Pages publish root, then set Pages to that branch.

## Screenshots

Add images after deploy (optional for reviewers):

| Viewport | Suggested file |
| --- | --- |
| Desktop (dark) | `assets/screenshot-desktop-dark.png` |
| Desktop (light) | `assets/screenshot-desktop-light.png` |
| Mobile | `assets/screenshot-mobile.png` |

Until then, run locally or open the live demo and check phone / tablet / desktop widths.

```markdown
<!-- After capture, embed like this: -->
![Desktop dark](assets/screenshot-desktop-dark.png)
![Desktop light](assets/screenshot-desktop-light.png)
![Mobile](assets/screenshot-mobile.png)
```

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 2.
