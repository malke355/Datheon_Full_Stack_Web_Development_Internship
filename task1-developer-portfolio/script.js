/**
 * Melkamu Teshome — Portfolio interactions
 * Theme, nav, smooth scroll active links, projects + modal, form validation, reveals
 */

(() => {
  "use strict";

  /* ---------- Project data ---------- */
  const projects = [
    {
      id: "portfolio-lab",
      title: "Portfolio Lab",
      description:
        "Task 1 — this site. A personal portfolio built with plain HTML, CSS, and vanilla JS: theming, project modals, scroll reveals, and a mobile-first layout.",
      image: "assets/project-portfolio.svg",
      imageAlt: "Abstract illustration of a personal portfolio layout",
      tags: ["HTML", "CSS", "Vanilla JS"],
      demo: "https://task1developerportfolio.vercel.app/",
      github:
        "https://github.com/malke355/Datheon_Full_Stack_Web_Development_Internship/tree/main/task1-developer-portfolio",
    },
    {
      id: "task-tracker",
      title: "Taskflow",
      description:
        "Task 2 — a dynamic task manager with categories, due dates, filters, search, drag-and-drop reorder, and JSON backup. Plain HTML/CSS/JS with localStorage.",
      image: "assets/project-tasks.svg",
      imageAlt: "Abstract illustration of a task checklist interface",
      tags: ["JavaScript", "CSS", "localStorage"],
      demo: "https://taskmanager2-sepia.vercel.app/",
      github:
        "https://github.com/malke355/Datheon_Full_Stack_Web_Development_Internship/tree/main/task2-task-manager",
    },
    {
      id: "atmos-weather",
      title: "Atmos",
      description:
        "Task 3 — real-time weather and a 5-day forecast via OpenWeatherMap. Client UI plus a thin proxy so the API key stays in .env, never in the browser.",
      image: "assets/project-weather.svg",
      imageAlt: "Abstract illustration of a weather dashboard",
      tags: ["JavaScript", "OpenWeatherMap", "Node"],
      demo: "https://weathertask3.vercel.app/",
      github:
        "https://github.com/malke355/Datheon_Full_Stack_Web_Development_Internship/tree/main/task3-weather-forecast",
    },
    {
      id: "meridian-store",
      title: "Meridian",
      description:
        "Task 4 — FakeStoreAPI product catalog with search, category filters, a slide-out cart (tax/shipping math), and simulated checkout. Pure client-side vanilla JS.",
      image: "assets/project-events.svg",
      imageAlt: "Abstract illustration of a shopping catalog interface",
      tags: ["JavaScript", "FakeStoreAPI", "CSS Grid"],
      demo: "https://ecommerce-nine-omega-76.vercel.app/",
      github:
        "https://github.com/malke355/Datheon_Full_Stack_Web_Development_Internship/tree/main/task4-ecommerce-store",
    },
  ];

  /* ---------- DOM refs ---------- */
  const html = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const navToggle = document.getElementById("nav-toggle");
  const primaryNav = document.getElementById("primary-nav");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const projectGrid = document.getElementById("project-grid");
  const modal = document.getElementById("project-modal");
  const modalClose = document.getElementById("modal-close");
  const modalImage = document.getElementById("modal-image");
  const modalTitle = document.getElementById("modal-title");
  const modalDescription = document.getElementById("modal-description");
  const modalTags = document.getElementById("modal-tags");
  const modalDemo = document.getElementById("modal-demo");
  const modalGithub = document.getElementById("modal-github");
  const contactForm = document.getElementById("contact-form");
  const formSuccess = document.getElementById("form-success");
  const yearEl = document.getElementById("year");

  let lastFocus = null;

  /* ---------- Theme ---------- */
  const THEME_KEY = "portfolio-theme";

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    const nextLabel =
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    themeToggle?.setAttribute("aria-label", nextLabel);
    themeToggle?.setAttribute("title", nextLabel);
  }

  applyTheme(getPreferredTheme());

  themeToggle?.addEventListener("click", () => {
    const next =
      html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------- Mobile nav ---------- */
  function setNavOpen(open) {
    primaryNav?.classList.toggle("is-open", open);
    navToggle?.setAttribute("aria-expanded", String(open));
    navToggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  navToggle?.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") !== "true";
    setNavOpen(open);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  /* ---------- Active nav on scroll ---------- */
  const sections = ["home", "about", "skills", "projects", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function updateActiveNav() {
    const offset = window.scrollY + 120;
    let current = sections[0]?.id;

    for (const section of sections) {
      if (section.offsetTop <= offset) current = section.id;
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("is-active", href === `#${current}`);
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  /* ---------- Projects render ---------- */
  function createProjectCard(project) {
    const article = document.createElement("article");
    article.className = "project-card reveal";
    article.setAttribute("role", "listitem");

    article.innerHTML = `
      <img
        class="project-card__image"
        src="${project.image}"
        alt="${project.imageAlt}"
        width="640"
        height="400"
        loading="lazy"
      />
      <div class="project-card__body">
        <h3 class="project-card__title">${project.title}</h3>
        <p class="project-card__desc">${project.description}</p>
        <ul class="project-card__tags" aria-label="Technologies">
          ${project.tags.map((t) => `<li class="tag">${t}</li>`).join("")}
        </ul>
        <button type="button" class="btn btn--ghost btn--small" data-project-id="${project.id}">
          View Details
        </button>
      </div>
    `;

    return article;
  }

  function renderProjects() {
    if (!projectGrid) return;
    const frag = document.createDocumentFragment();
    projects.forEach((p) => frag.appendChild(createProjectCard(p)));
    projectGrid.appendChild(frag);

    projectGrid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-project-id]");
      if (!btn) return;
      const project = projects.find((p) => p.id === btn.dataset.projectId);
      if (project) openModal(project, btn);
    });
  }

  /* ---------- Modal ---------- */
  function getFocusable(container) {
    return [
      ...container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((el) => !el.hasAttribute("hidden") && el.offsetParent !== null);
  }

  function openModal(project, trigger) {
    if (!modal) return;
    lastFocus = trigger || document.activeElement;

    modalImage.src = project.image;
    modalImage.alt = project.imageAlt;
    modalTitle.textContent = project.title;
    modalDescription.textContent = project.description;
    modalTags.innerHTML = project.tags
      .map((t) => `<li class="tag">${t}</li>`)
      .join("");
    modalDemo.href = project.demo;
    modalGithub.href = project.github;

    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalClose?.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    lastFocus?.focus?.();
    lastFocus = null;
  }

  modalClose?.addEventListener("click", closeModal);
  modal?.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key !== "Tab" || !modal || modal.hidden) return;

    const focusable = getFocusable(modal.querySelector(".modal-panel"));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------- Form validation ---------- */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(field, message) {
    const input = contactForm?.elements[field];
    const error = document.getElementById(`${field}-error`);
    if (!input || !error) return;

    if (message) {
      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      error.hidden = false;
      error.textContent = message;
    } else {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      error.hidden = true;
      error.textContent = "";
    }
  }

  function validateField(field) {
    const input = contactForm?.elements[field];
    if (!input) return true;
    const value = input.value.trim();

    if (field === "name") {
      if (!value) {
        setFieldError("name", "Please enter your name.");
        return false;
      }
      if (value.length < 2) {
        setFieldError("name", "Name must be at least 2 characters.");
        return false;
      }
      setFieldError("name", "");
      return true;
    }

    if (field === "email") {
      if (!value) {
        setFieldError("email", "Please enter your email.");
        return false;
      }
      if (!emailPattern.test(value)) {
        setFieldError("email", "Please enter a valid email address.");
        return false;
      }
      setFieldError("email", "");
      return true;
    }

    if (field === "message") {
      if (!value) {
        setFieldError("message", "Please enter a message.");
        return false;
      }
      if (value.length < 10) {
        setFieldError("message", "Message must be at least 10 characters.");
        return false;
      }
      setFieldError("message", "");
      return true;
    }

    return true;
  }

  ["name", "email", "message"].forEach((field) => {
    contactForm?.elements[field]?.addEventListener("blur", () =>
      validateField(field)
    );
    contactForm?.elements[field]?.addEventListener("input", () => {
      if (contactForm.elements[field].classList.contains("is-invalid")) {
        validateField(field);
      }
    });
  });

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    formSuccess.hidden = true;

    const ok = ["name", "email", "message"].map(validateField).every(Boolean);
    if (!ok) {
      const firstInvalid = contactForm.querySelector(".is-invalid");
      firstInvalid?.focus();
      return;
    }

    formSuccess.hidden = false;
    contactForm.reset();
  });

  /* ---------- Scroll reveal ---------- */
  function initReveals() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const elements = document.querySelectorAll(".reveal");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ---------- Init ---------- */
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  renderProjects();
  initReveals();

  // Observe dynamically added project cards after a tick (already in DOM)
  // Re-run reveal observer for cards that were just injected
  requestAnimationFrame(() => {
    const late = document.querySelectorAll(".project-card.reveal:not(.is-visible)");
    if (!late.length) return;
    if (!("IntersectionObserver" in window)) {
      late.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    late.forEach((el) => obs.observe(el));
  });
})();
