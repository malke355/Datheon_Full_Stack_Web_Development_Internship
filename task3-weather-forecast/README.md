# Live Demo

**Live site:** _Coming soon — replace this URL after you deploy_

---

# Task 3 — Atmos (Weather Forecast App)

Simple weather web app for the **Datheon Full Stack Web Development Internship — Task 3**.

Plain **HTML**, **CSS**, and **JavaScript**, plus a tiny **Node** server that:

1. Serves the static files
2. Proxies OpenWeatherMap so `OPENWEATHER_API_KEY` never appears in the browser

## Features

- City search box
- Current temperature (°C), feels-like, description, humidity, wind, pressure
- Matching OpenWeatherMap weather icon
- 5-day forecast cards (`Array.map()`)
- Loading spinner while fetching
- Friendly errors for unknown cities / failed requests
- Light / dark theme toggle
- Dynamic sky gradient by weather condition
- Responsive layout for mobile

## Why a small Node server?

Browser JavaScript cannot safely read `.env` secrets. The local server loads `OPENWEATHER_API_KEY` and calls OpenWeatherMap on your behalf (`/api/weather`, `/api/forecast`). A framework is **not** required.

## Setup

1. Get a free key: [OpenWeatherMap API keys](https://home.openweathermap.org/api_keys)
2. From this folder:

```bash
cd task3-weather-forecast
cp .env.example .env
```

3. Edit `.env` and set:

```env
OPENWEATHER_API_KEY=your_real_key_here
PORT=8083
```

4. Install and run:

```bash
npm install
npm start
```

5. Open [http://127.0.0.1:8083](http://127.0.0.1:8083)

New OpenWeatherMap keys can take up to ~10 minutes to activate.

## Folder structure

```text
task3-weather-forecast/
├── index.html        # UI
├── style.css         # Layout + themes + sky moods
├── script.js         # Fetch + render (calls /api/* only)
├── server.js         # Static files + OpenWeatherMap proxy
├── package.json
├── .env.example      # Placeholder (safe to commit)
├── .env              # Your real key (gitignored)
├── .gitignore
└── README.md
```

## API usage

| App route | Upstream |
| --- | --- |
| `GET /api/weather?q={city}` | `https://api.openweathermap.org/data/2.5/weather?units=metric` |
| `GET /api/forecast?q={city}` | `https://api.openweathermap.org/data/2.5/forecast?units=metric` |
| Icons | `https://openweathermap.org/img/wn/{icon}@2x.png` |

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `OPENWEATHER_API_KEY` | Yes | Free OpenWeatherMap key |
| `PORT` | No | Local port (default `8083`) |

`.env` is listed in `.gitignore` — do not commit your key.

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 3.
