/* ==========================================================================
   Taskflow — Dynamic Task Manager
   State: tasks = []  ·  Helpers: saveToLocalStorage / loadFromLocalStorage
   ========================================================================== */

const STORAGE_KEY = "taskflow.tasks.v1";
const THEME_KEY = "taskflow.theme.v1";
const UI_KEY = "taskflow.ui.v1";
const CATEGORIES = ["Work", "Personal", "Study"];
const TOAST_GAP_MS = 220;
const TOAST_DEFAULT_MS = 2200;
const TOAST_UNDO_MS = 4500;

/** @type {Array<{id:string,title:string,category:string,dueDate:string|null,completed:boolean,createdAt:number,order:number}>} */
let tasks = [];

let currentFilter = "all"; // all | active | completed
let currentCategory = "all";
let searchQuery = "";
let editingId = null;
let listReady = false;

/** @type {Array<{message:string,actionLabel?:string,onAction?:Function|null,duration:number}>} */
const toastQueue = [];
let toastBusy = false;
let toastHideTimer = null;
let toastGapTimer = null;
let toastActionHandler = null;

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
  toastMessage: document.getElementById("toast-message"),
  toastAction: document.getElementById("toast-action"),
  themeToggle: document.getElementById("theme-toggle"),
  metaThemeColor: document.getElementById("meta-theme-color"),
  clearCompleted: document.getElementById("clear-completed"),
  exportTasks: document.getElementById("export-tasks"),
  importTasks: document.getElementById("import-tasks"),
  importFile: document.getElementById("import-file"),
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
   Persistence — tasks + UI prefs
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

function saveUiPrefs() {
  try {
    localStorage.setItem(
      UI_KEY,
      JSON.stringify({
        filter: currentFilter,
        category: currentCategory,
        search: searchQuery,
      })
    );
  } catch (_) {
    /* ignore */
  }
}

function loadUiPrefs() {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    if (["all", "active", "completed"].includes(parsed.filter)) {
      currentFilter = parsed.filter;
    }
    if (
      parsed.category === "all" ||
      CATEGORIES.includes(parsed.category)
    ) {
      currentCategory = parsed.category;
    }
    if (typeof parsed.search === "string") {
      searchQuery = parsed.search;
    }
  } catch (_) {
    /* ignore */
  }
}

function applyUiPrefsToControls() {
  if (els.search) els.search.value = searchQuery;
  if (els.categoryFilter) els.categoryFilter.value = currentCategory;
  els.filterBtns.forEach((btn) => {
    const active = (btn.dataset.filter || "all") === currentFilter;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
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
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const [removed] = tasks.splice(index, 1);
  saveToLocalStorage();
  return removed;
}

function restoreTask(snapshot) {
  if (!snapshot) return;
  const exists = tasks.some((t) => t.id === snapshot.id);
  if (exists) return;
  tasks.push(normalizeTask(snapshot, snapshot.order));
  saveToLocalStorage();
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

/** Move a task one step in the full ordered list (−1 up, +1 down). */
function moveTask(id, direction) {
  const sorted = getOrderedTasks();
  const index = sorted.findIndex((t) => t.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sorted.length) return false;

  const tmp = sorted[index];
  sorted[index] = sorted[target];
  sorted[target] = tmp;
  sorted.forEach((task, i) => {
    task.order = i;
  });
  saveToLocalStorage();
  return true;
}

function clearCompletedTasks() {
  const completed = tasks.filter((t) => t.completed);
  if (completed.length === 0) {
    showToast("No completed tasks to clear");
    return;
  }
  const label =
    completed.length === 1
      ? "Clear 1 completed task?"
      : `Clear ${completed.length} completed tasks?`;
  if (!window.confirm(label)) return;

  tasks = tasks.filter((t) => !t.completed);
  saveToLocalStorage();
  if (editingId && completed.some((t) => t.id === editingId)) resetForm();
  render();
  showToast(
    completed.length === 1
      ? "Cleared 1 completed task"
      : `Cleared ${completed.length} completed tasks`
  );
}

/* --------------------------------------------------------------------------
   Export / import
   -------------------------------------------------------------------------- */
function exportTasksJson() {
  const payload = {
    version: 1,
    app: "taskflow",
    exportedAt: new Date().toISOString(),
    tasks: getOrderedTasks(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `taskflow-backup-${todayISODate()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Backup downloaded");
}

function importTasksJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const list = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.tasks)
          ? parsed.tasks
          : null;
      if (!list) {
        showToast("Import failed — invalid backup file");
        return;
      }
      const normalized = list
        .filter((t) => t && typeof t === "object" && typeof t.title === "string")
        .map((t, index) => normalizeTask(t, index));

      if (
        !window.confirm(
          `Replace all current tasks with ${normalized.length} from this backup?`
        )
      ) {
        return;
      }

      tasks = normalized;
      saveToLocalStorage();
      resetForm();
      render();
      showToast(
        normalized.length === 1
          ? "Imported 1 task"
          : `Imported ${normalized.length} tasks`
      );
    } catch (_) {
      showToast("Import failed — invalid JSON");
    }
  };
  reader.onerror = () => showToast("Import failed — could not read file");
  reader.readAsText(file);
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
  const scrollY = window.scrollY;
  const visible = getVisibleTasks();
  const ordered = getOrderedTasks();

  if (listReady) {
    els.list.classList.add("no-enter-anim");
  }

  els.list.innerHTML = "";

  if (visible.length === 0) {
    els.empty.hidden = false;
  } else {
    els.empty.hidden = true;
    const fragment = document.createDocumentFragment();
    visible.forEach((task) => {
      const fullIndex = ordered.findIndex((t) => t.id === task.id);
      fragment.appendChild(
        createTaskElement(task, {
          canMoveUp: fullIndex > 0,
          canMoveDown: fullIndex >= 0 && fullIndex < ordered.length - 1,
        })
      );
    });
    els.list.appendChild(fragment);
  }

  updateSummary();
  listReady = true;

  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
  });
}

function updateSummary() {
  const total = tasks.length;
  const active = tasks.filter((t) => !t.completed).length;
  const done = total - active;
  els.summary.textContent =
    total === 0 ? "0 tasks" : `${active} active · ${done} done · ${total} total`;
}

function createTaskElement(task, { canMoveUp, canMoveDown }) {
  const li = document.createElement("li");
  li.className = `task-item${task.completed ? " is-completed" : ""}`;
  li.dataset.id = task.id;
  li.draggable = false;

  const reorder = document.createElement("div");
  reorder.className = "reorder-controls";

  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "drag-handle";
  handle.setAttribute("aria-label", `Drag to reorder “${task.title}”`);
  handle.title = "Drag to reorder";
  handle.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="4" r="1.2" fill="currentColor"/><circle cx="11" cy="4" r="1.2" fill="currentColor"/><circle cx="5" cy="8" r="1.2" fill="currentColor"/><circle cx="11" cy="8" r="1.2" fill="currentColor"/><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="11" cy="12" r="1.2" fill="currentColor"/></svg>';
  handle.draggable = true;
  wireDrag(handle, li, task.id);

  const moveUp = document.createElement("button");
  moveUp.type = "button";
  moveUp.className = "btn-icon btn-move";
  moveUp.setAttribute("aria-label", `Move “${task.title}” up`);
  moveUp.title = "Move up";
  moveUp.disabled = !canMoveUp;
  moveUp.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg>';
  moveUp.addEventListener("click", () => {
    if (moveTask(task.id, -1)) {
      render();
      showToast("Moved up");
    }
  });

  const moveDown = document.createElement("button");
  moveDown.type = "button";
  moveDown.className = "btn-icon btn-move";
  moveDown.setAttribute("aria-label", `Move “${task.title}” down`);
  moveDown.title = "Move down";
  moveDown.disabled = !canMoveDown;
  moveDown.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 10l6 6 6-6"/></svg>';
  moveDown.addEventListener("click", () => {
    if (moveTask(task.id, 1)) {
      render();
      showToast("Moved down");
    }
  });

  reorder.append(handle, moveUp, moveDown);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.id = `done-${task.id}`;
  checkbox.setAttribute(
    "aria-label",
    `Mark “${task.title}” as ${task.completed ? "incomplete" : "complete"}`
  );
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
  deleteBtn.addEventListener("click", () => requestDeleteTask(task, li));

  actions.append(editBtn, deleteBtn);
  li.append(reorder, checkbox, body, actions);
  return li;
}

function requestDeleteTask(task, li) {
  if (!window.confirm(`Delete “${task.title}”?`)) return;

  li.classList.add("is-exiting");
  window.setTimeout(() => {
    const removed = deleteTask(task.id);
    if (!removed) {
      render();
      return;
    }
    if (editingId === task.id) resetForm();
    render();
    showToast("Task deleted", {
      actionLabel: "Undo",
      duration: TOAST_UNDO_MS,
      onAction: () => {
        restoreTask(removed);
        render();
        showToast("Task restored");
      },
    });
  }, 180);
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

function refreshDueDateMin() {
  if (!els.due) return;
  els.due.min = todayISODate();
}

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

function initDueMinWatch() {
  refreshDueDateMin();
  let lastDay = todayISODate();

  const tick = () => {
    const day = todayISODate();
    if (day !== lastDay) {
      lastDay = day;
    }
    refreshDueDateMin();
  };

  window.setInterval(tick, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  window.addEventListener("focus", tick);
}

/* --------------------------------------------------------------------------
   Drag and drop (reorder)
   -------------------------------------------------------------------------- */
function wireDrag(handle, item, taskId) {
  handle.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    item.classList.add("is-dragging");
    requestAnimationFrame(() => item.classList.add("is-dragging"));
  });

  handle.addEventListener("dragend", () => {
    item.classList.remove("is-dragging");
    els.list
      .querySelectorAll(".is-drag-over")
      .forEach((el) => el.classList.remove("is-drag-over"));
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

/* --------------------------------------------------------------------------
   Toast queue
   -------------------------------------------------------------------------- */
function showToast(message, options = {}) {
  toastQueue.push({
    message,
    actionLabel: options.actionLabel || "",
    onAction: options.onAction || null,
    duration: options.duration || TOAST_DEFAULT_MS,
  });
  pumpToast();
}

function pumpToast() {
  if (toastBusy || toastQueue.length === 0) return;
  toastBusy = true;
  const item = toastQueue.shift();

  els.toast.hidden = false;
  els.toastMessage.textContent = item.message;
  toastActionHandler = item.onAction;

  if (item.actionLabel && item.onAction) {
    els.toastAction.hidden = false;
    els.toastAction.textContent = item.actionLabel;
  } else {
    els.toastAction.hidden = true;
    els.toastAction.textContent = "Undo";
  }

  requestAnimationFrame(() => {
    els.toast.classList.add("is-visible");
  });

  window.clearTimeout(toastHideTimer);
  toastHideTimer = window.setTimeout(() => hideToast(), item.duration);
}

function hideToast() {
  els.toast.classList.remove("is-visible");
  window.clearTimeout(toastGapTimer);
  toastGapTimer = window.setTimeout(() => {
    if (!els.toast.classList.contains("is-visible")) {
      els.toast.hidden = true;
      els.toastAction.hidden = true;
      toastActionHandler = null;
    }
    toastBusy = false;
    pumpToast();
  }, TOAST_GAP_MS);
}

function initToastAction() {
  els.toastAction?.addEventListener("click", () => {
    const handler = toastActionHandler;
    toastActionHandler = null;
    window.clearTimeout(toastHideTimer);
    hideToast();
    if (typeof handler === "function") handler();
  });
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
    saveUiPrefs();
    render();
  });

  els.categoryFilter.addEventListener("change", () => {
    currentCategory = els.categoryFilter.value;
    saveUiPrefs();
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
      saveUiPrefs();
      render();
    });
  });

  els.clearCompleted?.addEventListener("click", clearCompletedTasks);
  els.exportTasks?.addEventListener("click", exportTasksJson);
  els.importTasks?.addEventListener("click", () => els.importFile?.click());
  els.importFile?.addEventListener("change", () => {
    const file = els.importFile.files && els.importFile.files[0];
    importTasksJson(file);
    els.importFile.value = "";
  });

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
  const iso = (offset) => {
    const d = new Date();
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
  initToastAction();
  initDueMinWatch();
  loadUiPrefs();
  applyUiPrefsToControls();
  tasks = loadFromLocalStorage();
  seedIfEmpty();
  bindEvents();
  render();
}

init();
