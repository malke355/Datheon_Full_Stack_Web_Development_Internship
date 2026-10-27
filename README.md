# Datheon Full Stack Web Development Internship

Internship projects by **Melkamu Teshome** — four vanilla HTML/CSS/JS apps with matching branding (Syne + Atkinson Hyperlegible, teal / slate / amber).

**GitHub:** [malke355/Datheon_Full_Stack_Web_Development_Internship](https://github.com/malke355/Datheon_Full_Stack_Web_Development_Internship)

---

## Projects

| Task | App | Folder | Live demo |
| --- | --- | --- | --- |
| **1** | **Portfolio Lab** — personal developer portfolio | [`task1-developer-portfolio`](./task1-developer-portfolio) | [Live](https://task1developerportfolio.vercel.app/) |
| **2** | **Taskflow** — task manager (localStorage, filters, drag-and-drop) | [`task2-task-manager`](./task2-task-manager) | [Live](https://taskmanager2-sepia.vercel.app/) |
| **3** | **Atmos** — weather + 5-day forecast (OpenWeatherMap proxy) | [`task3-weather-forecast`](./task3-weather-forecast) | [Live](https://weathertask3.vercel.app/) |
| **4** | **Meridian** — product catalog + cart (FakeStoreAPI) | [`task4-ecommerce-store`](./task4-ecommerce-store) | [Live](https://ecommerce-nine-omega-76.vercel.app/) |

Each folder has its own **README** with setup, features, and a brief checklist.

---

## Quick local run

```bash
# Task 1 / 2 / 4 — any static server, e.g.
npx --yes serve task1-developer-portfolio -l 8081
npx --yes serve task2-task-manager -l 8082
npx --yes serve task4-ecommerce-store -l 8084

# Task 3 — needs OpenWeatherMap key in task3-weather-forecast/.env
cd task3-weather-forecast
cp .env.example .env   # then add OPENWEATHER_API_KEY
npm install && npm start   # http://127.0.0.1:8083
```

---

## Stack

- Plain **HTML5 / CSS3 / vanilla JavaScript**
- **Vercel** for hosting (Task 3 also uses serverless `/api/*`)
- Public APIs: OpenWeatherMap (Task 3), FakeStoreAPI (Task 4)

---

Prepared for the Datheon Full Stack Web Development Internship.
