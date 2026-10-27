/* ==========================================================================
   Taskflow — Dynamic Task Manager
   State: tasks = []  ·  Helpers: saveToLocalStorage / loadFromLocalStorage
   ========================================================================== */

const STORAGE_KEY = "taskflow.tasks.v1";
const THEME_KEY = "taskflow.theme.v1";
const CATEGORIES = ["Work", "Personal", "Study"];

/** @type {Array<{id:string,title:string,category:string,dueDate:string|null,completed:boolean,createdAt:number,order:number}>} */
let tasks = [];

let currentFilter = "all"; // all | active | completed
let currentCategory = "all";
let searchQuery = "";
let editingId = null;
let toastTimer = null;

const els = {
  form: document.getElementById("task-form"),
  title: document.getElementById("task-title"),
  category: document.getElementById("task-category"),
  due: document.getElementById("task-due"),
  titleError: document.getElementById("title-error"),
  dueError: document.getElementById("due-error"),
  submitBtn: document.getElementById("submit-btn"),
  cancelEdit: document.getElementById("cancel-edit"),
  search: document.getElementById("task-search"),
  categoryFilter: document.getElementById("category-filter"),
  list: document.getElementById("task-list"),
  empty: document.getElementById("empty-state"),
  summary: document.getElementById("task-summary"),
  toast: document.getElementById("toast"),
  themeToggle: document.getElementById("theme-toggle"),
  metaThemeColor: document.getElementById("meta-theme-color"),
  filterBtns: Array.from(document.querySelectorAll(".filter-btn")),
};

/* --------------------------------------------------------------------------
   Theme
   -------------------------------------------------------------------------- */
function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (_) {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const nextLabel =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  els.themeToggle?.setAttribute("aria-label", nextLabel);
  els.themeToggle?.setAttribute("title", nextLabel);

  const themeColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--theme-color")
      .trim() || (theme === "dark" ? "#0b1416" : "#0f2e2f");
  els.metaThemeColor?.setAttribute("content", themeColor);
}

function initTheme() {
  applyTheme(getPreferredTheme());
  els.themeToggle?.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (_) {
      /* ignore */
    }
    applyTheme(next);
    showToast(next === "dark" ? "Dark theme on" : "Light theme on");
  });
}

/* --------------------------------------------------------------------------
   Persistence
   -------------------------------------------------------------------------- */
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn("Could not save tasks:", err);
    showToast("Could not save to localStorage.");
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === "object" && typeof t.title === "string")
      .map((t, index) => normalizeTask(t, index));
  } catch (err) {
    console.warn("Could not load tasks:", err);
    return [];
  }
}

function normalizeTask(task, index = 0) {
  const category = CATEGORIES.includes(task.category) ? task.category : "Personal";
  return {
    id: typeof task.id === "string" && task.id ? task.id : createId(),
    title: String(task.title).trim().slice(0, 120) || "Untitled task",
    category,
    dueDate: task.dueDate ? String(task.dueDate) : null,
    completed: Boolean(task.completed),
    createdAt: Number(task.createdAt) || Date.now(),
    order: Number.isFinite(task.order) ? task.order : index,
  };
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* --------------------------------------------------------------------------
   CRUD
   -------------------------------------------------------------------------- */
function createTask({ title, category, dueDate }) {
  const nextOrder =
    tasks.length === 0 ? 0 : Math.max(...tasks.map((t) => t.order)) + 1;

  const task = {
    id: createId(),
    title: title.trim(),
    category,
    dueDate: dueDate || null,
    completed: false,
    createdAt: Date.now(),
    order: nextOrder,
  };

  tasks.push(task);
  saveToLocalStorage();
  return task;
}

function updateTask(id, updates) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = normalizeTask({ ...tasks[index], ...updates }, tasks[index].order);
  saveToLocalStorage();
  return tasks[index];
}

function deleteTask(id) {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  if (tasks.length !== before) {
    saveToLocalStorage();
    return true;
  }
  return false;
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.completed = !task.completed;
  saveToLocalStorage();
  return task;
}

function reorderTasks(fromId, toId) {
  if (fromId === toId) return;
  const sorted = getOrderedTasks();
  const fromIndex = sorted.findIndex((t) => t.id === fromId);
  const toIndex = sorted.findIndex((t) => t.id === toId);
  if (fromIndex < 0 || toIndex < 0) return;

  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);
  sorted.forEach((task, index) => {
    task.order = index;
  });
  saveToLocalStorage();
}

/* --------------------------------------------------------------------------
   Filtering / search
   -------------------------------------------------------------------------- */
function getOrderedTasks() {
  return [...tasks].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
}

function getVisibleTasks() {
  const query = searchQuery.trim().toLowerCase();

  return getOrderedTasks().filter((task) => {
    if (currentFilter === "active" && task.completed) return false;
    if (currentFilter === "completed" && !task.completed) return false;
    if (currentCategory !== "all" && task.category !== currentCategory) return false;

    if (query) {
      const haystack = `${task.title} ${task.category}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */
function render() {
  const visible = getVisibleTasks();
  els.list.innerHTML = "";

  if (visible.length === 0) {
    els.empty.hidden = false;
  } else {
    els.empty.hidden = true;
    const fragment = document.createDocumentFragment();
    visible.forEach((task) => fragment.appendChild(createTaskElement(task)));
    els.list.appendChild(fragment);
  }

  updateSummary();
}

function updateSummary() {
  const total = tasks.length;
  const active = tasks.filter((t) => !t.completed).length;
  const done = total - active;
  els.summary.textContent =
    total === 0 ? "0 tasks" : `${active} active · ${done} done · ${total} total`;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item${task.completed ? " is-completed" : ""}`;
  li.dataset.id = task.id;
  li.draggable = false;

  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "drag-handle";
  handle.setAttribute("aria-label", `Reorder “${task.title}”`);
  handle.title = "Drag to reorder";
  handle.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="4" r="1.2" fill="currentColor"/><circle cx="11" cy="4" r="1.2" fill="currentColor"/><circle cx="5" cy="8" r="1.2" fill="currentColor"/><circle cx="11" cy="8" r="1.2" fill="currentColor"/><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="11" cy="12" r="1.2" fill="currentColor"/></svg>';
  handle.draggable = true;
  wireDrag(handle, li, task.id);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.id = `done-${task.id}`;
  checkbox.setAttribute("aria-label", `Mark “${task.title}” as ${task.completed ? "incomplete" : "complete"}`);
  checkbox.addEventListener("change", () => {
    const updated = toggleComplete(task.id);
    if (!updated) return;
    li.classList.toggle("is-completed", updated.completed);
    li.classList.add("is-completing");
    checkbox.setAttribute(
      "aria-label",
      `Mark “${task.title}” as ${updated.completed ? "incomplete" : "complete"}`
    );
    showToast(updated.completed ? "Task completed" : "Task marked active");
    window.setTimeout(() => {
      li.classList.remove("is-completing");
      // Re-render so status filters apply after animation
      render();
    }, 280);
  });

  const body = document.createElement("div");
  body.className = "task-body";

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const badge = document.createElement("span");
  badge.className = `badge badge--${task.category.toLowerCase()}`;
  badge.textContent = task.category;

  meta.appendChild(badge);

  if (task.dueDate) {
    const due = document.createElement("span");
    due.className = "due";
    const dueInfo = formatDue(task.dueDate, task.completed);
    due.textContent = dueInfo.label;
    if (dueInfo.state) due.classList.add(dueInfo.state);
    meta.appendChild(due);
  }

  body.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn-icon";
  editBtn.setAttribute("aria-label", `Edit “${task.title}”`);
  editBtn.title = "Edit";
  editBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
  editBtn.addEventListener("click", () => startEdit(task));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-icon btn-danger";
  deleteBtn.setAttribute("aria-label", `Delete “${task.title}”`);
  deleteBtn.title = "Delete";
  deleteBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
  deleteBtn.addEventListener("click", () => {
    li.classList.add("is-exiting");
    window.setTimeout(() => {
      deleteTask(task.id);
      if (editingId === task.id) resetForm();
      showToast("Task deleted");
      render();
    }, 200);
  });

  actions.append(editBtn, deleteBtn);
  li.append(handle, checkbox, body, actions);
  return li;
}

function formatDue(dueDate, completed) {
  const today = startOfDay(new Date());
  const due = startOfDay(parseDateInput(dueDate));
  if (Number.isNaN(due.getTime())) {
    return { label: `Due ${dueDate}`, state: "" };
  }

  const formatted = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: due.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });

  const diffDays = Math.round((due - today) / 86400000);
  if (!completed && diffDays < 0) {
    return { label: `Overdue · ${formatted}`, state: "is-overdue" };
  }
  if (!completed && diffDays === 0) {
    return { label: `Due today · ${formatted}`, state: "is-soon" };
  }
  if (!completed && diffDays <= 2) {
    return { label: `Due soon · ${formatted}`, state: "is-soon" };
  }
  return { label: `Due ${formatted}`, state: "" };
}

function parseDateInput(value) {
  // value is YYYY-MM-DD from <input type="date">
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function todayISODate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Keep the date picker’s min at the local calendar day for today. */
function refreshDueDateMin() {
  if (!els.due) return;
  els.due.min = todayISODate();
}

/** True when dueDate (YYYY-MM-DD) is before today’s local calendar day. */
function isDueDateBeforeToday(dueDate) {
  if (!dueDate) return false;
  const due = startOfDay(parseDateInput(dueDate));
  if (Number.isNaN(due.getTime())) return true;
  return due < startOfDay(new Date());
}

function clearDueError() {
  if (!els.dueError) return;
  els.dueError.hidden = true;
  els.due?.removeAttribute("aria-invalid");
}

function showDueError(message) {
  if (els.dueError) {
    els.dueError.textContent = message;
    els.dueError.hidden = false;
  }
  els.due?.setAttribute("aria-invalid", "true");
  els.due?.focus();
  showToast(message);
}

/* --------------------------------------------------------------------------
   Drag and drop (reorder)
   -------------------------------------------------------------------------- */
function wireDrag(handle, item, taskId) {
  handle.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    item.classList.add("is-dragging");
    // Firefox needs setData; delay class for smoother ghost
    requestAnimationFrame(() => item.classList.add("is-dragging"));
  });

  handle.addEventListener("dragend", () => {
    item.classList.remove("is-dragging");
    els.list.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
  });

  item.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    item.classList.add("is-drag-over");
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("is-drag-over");
  });

  item.addEventListener("drop", (event) => {
    event.preventDefault();
    item.classList.remove("is-drag-over");
    const fromId = event.dataTransfer.getData("text/plain");
    const toId = taskId;
    if (!fromId || fromId === toId) return;
    reorderTasks(fromId, toId);
    render();
    showToast("Order updated");
  });
}

/* --------------------------------------------------------------------------
   Form / edit mode
   -------------------------------------------------------------------------- */
function startEdit(task) {
  editingId = task.id;
  refreshDueDateMin();
  clearDueError();
  els.title.value = task.title;
  els.category.value = task.category;
  // Past due dates still show for existing tasks; save will require today or later.
  els.due.value = task.dueDate || "";
  els.submitBtn.textContent = "Save changes";
  els.cancelEdit.hidden = false;
  els.title.focus();
  els.title.select();
  showToast("Editing task");
}

function resetForm() {
  editingId = null;
  els.form.reset();
  els.category.value = "Work";
  els.submitBtn.textContent = "Add task";
  els.cancelEdit.hidden = true;
  els.titleError.hidden = true;
  els.title.removeAttribute("aria-invalid");
  clearDueError();
  refreshDueDateMin();
}

function showToast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!els.toast.classList.contains("is-visible")) {
        els.toast.hidden = true;
      }
    }, 280);
  }, 1800);
}

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */
function bindEvents() {
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    refreshDueDateMin();

    const title = els.title.value.trim();
    const category = els.category.value;
    const dueDate = els.due.value || null;

    if (!title) {
      els.titleError.hidden = false;
      els.title.setAttribute("aria-invalid", "true");
      els.title.focus();
      return;
    }

    els.titleError.hidden = true;
    els.title.removeAttribute("aria-invalid");

    if (!CATEGORIES.includes(category)) {
      showToast("Pick a valid category.");
      return;
    }

    if (isDueDateBeforeToday(dueDate)) {
      showDueError("Due date can’t be in the past. Pick today or a future day.");
      return;
    }

    clearDueError();

    if (editingId) {
      updateTask(editingId, { title, category, dueDate });
      showToast("Task updated");
      resetForm();
    } else {
      createTask({ title, category, dueDate });
      showToast("Task added");
      resetForm();
    }

    render();
    els.title.focus();
  });

  els.due?.addEventListener("focus", refreshDueDateMin);
  els.due?.addEventListener("click", refreshDueDateMin);
  els.due?.addEventListener("change", () => {
    if (isDueDateBeforeToday(els.due.value || null)) {
      showDueError("Due date can’t be in the past. Pick today or a future day.");
    } else {
      clearDueError();
    }
  });

  els.cancelEdit.addEventListener("click", () => {
    resetForm();
    showToast("Edit cancelled");
  });

  els.search.addEventListener("input", () => {
    searchQuery = els.search.value;
    render();
  });

  els.categoryFilter.addEventListener("change", () => {
    currentCategory = els.categoryFilter.value;
    render();
  });

  els.filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter || "all";
      els.filterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      render();
    });
  });

  // Keyboard: Escape cancels edit
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && editingId) {
      resetForm();
      showToast("Edit cancelled");
    }
  });
}

/* --------------------------------------------------------------------------
   Seed (first visit only)
   -------------------------------------------------------------------------- */
function seedIfEmpty() {
  if (tasks.length > 0) return;
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  createTask({
    title: "Outline internship Task 2 README",
    category: "Work",
    dueDate: iso(1),
  });
  createTask({
    title: "Review ES6 array methods",
    category: "Study",
    dueDate: iso(3),
  });
  createTask({
    title: "Plan weekend grocery run",
    category: "Personal",
    dueDate: iso(2),
  });
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
function init() {
  initTheme();
  refreshDueDateMin();
  tasks = loadFromLocalStorage();
  seedIfEmpty();
  bindEvents();
  render();
}

init();
