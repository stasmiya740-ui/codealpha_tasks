const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");
const taskCounter = document.querySelector(".task-counter");
const themeToggle = document.getElementById("themeToggle");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const progressFill = document.querySelector(".progress-fill");
const progressText = document.querySelector(".progress-text");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
tasks = tasks.map(task => ({
  ...task,
  createdAt: task.createdAt || Date.now(),
  category: task.category || "Personal"
}));
let currentFilter = localStorage.getItem("taskFilter") || "all";
let currentTheme = localStorage.getItem("theme") || "light";
let currentSearch = "";

setTheme(currentTheme);
setActiveFilterButton(currentFilter);
displayTasks();

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addTask();
  }
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    localStorage.setItem("taskFilter", currentFilter);
    setActiveFilterButton(currentFilter);
    displayTasks();
  });
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  const item = button.closest("li");
  if (!item) return;

  const taskId = Number(item.dataset.id);

  if (button.classList.contains("complete-btn")) {
    toggleComplete(taskId);
  }
  if (button.classList.contains("edit-btn")) {
    editTask(taskId);
  }
  if (button.classList.contains("delete-btn")) {
    deleteTask(taskId);
  }
});

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(currentTheme);
  localStorage.setItem("theme", currentTheme);
});

searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.toLowerCase();
  displayTasks();
});

function addTask() {
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    taskInput.classList.add("shake");
    setTimeout(() => taskInput.classList.remove("shake"), 300);
    return;
  }

  tasks.push({
    id: Date.now(),
    text: taskText,
    completed: false,
    createdAt: Date.now(),
    category: categorySelect.value
  });

  taskInput.value = "";
  saveTasks();
  displayTasks();
  showToast("Task added successfully.", "success");
}

function displayTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks.filter(task => {
    if (currentFilter === "completed" && !task.completed) return false;
    if (currentFilter === "pending" && task.completed) return false;
    if (currentSearch && !task.text.toLowerCase().includes(currentSearch)) return false;
    return true;
  });

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = `task-item${task.completed ? " completed" : ""}`;
    li.dataset.id = task.id;
    li.draggable = true;
    li.innerHTML = `
      <div class="task-content">
        <div class="task-header">
          <span>${escapeHtml(task.text)}</span>
          <span class="task-category">${task.category}</span>
        </div>
        <small class="task-meta">Added on ${formatDateTime(task.createdAt)}</small>
      </div>
      <div class="task-actions">
        <button class="task-action-btn complete-btn">${task.completed ? "Undo" : "Done"}</button>
        <button class="task-action-btn edit-btn">Edit</button>
        <button class="task-action-btn delete-btn">Delete</button>
      </div>
    `;

    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("dragenter", handleDragEnter);
    li.addEventListener("dragleave", handleDragLeave);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    taskList.appendChild(li);
  });

  updateCounter(filteredTasks.length);
  toggleEmptyState(filteredTasks.length);
  updateProgress();
}

function toggleEmptyState(filteredCount) {
  if (tasks.length === 0) {
    emptyState.querySelector("p").textContent = "No tasks yet. Add your first task!";
    emptyState.classList.remove("hidden");
    emptyState.setAttribute("aria-hidden", "false");
  } else if (currentSearch && filteredCount === 0) {
    emptyState.querySelector("p").textContent = "No tasks match your search.";
    emptyState.classList.remove("hidden");
    emptyState.setAttribute("aria-hidden", "false");
  } else {
    emptyState.classList.add("hidden");
    emptyState.setAttribute("aria-hidden", "true");
  }
}

let draggedTaskId = null;

function handleDragStart(event) {
  draggedTaskId = Number(this.dataset.id);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedTaskId);
  this.classList.add("dragging");
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDragEnter(event) {
  if (Number(this.dataset.id) !== draggedTaskId) {
    this.classList.add("drag-over");
  }
}

function handleDragLeave() {
  this.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  const sourceId = Number(event.dataTransfer.getData("text/plain"));
  const targetId = Number(this.dataset.id);

  this.classList.remove("drag-over");
  if (sourceId === targetId) return;

  reorderTasks(sourceId, targetId);
}

function handleDragEnd() {
  this.classList.remove("dragging");
  document.querySelectorAll(".task-item").forEach(item => item.classList.remove("drag-over"));
}

function reorderTasks(sourceId, targetId) {
  const sourceIndex = tasks.findIndex(task => task.id === sourceId);
  const targetIndex = tasks.findIndex(task => task.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;

  const [movedTask] = tasks.splice(sourceIndex, 1);
  tasks.splice(targetIndex, 0, movedTask);
  saveTasks();
  displayTasks();
}

function toggleComplete(id) {
  tasks = tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task));
  saveTasks();
  displayTasks();
}

function editTask(id) {
  const task = tasks.find(task => task.id === id);
  if (!task) return;

  const updatedText = prompt("Edit your task:", task.text);
  if (updatedText === null) return;

  const trimmed = updatedText.trim();
  if (trimmed === "") return;

  task.text = trimmed;
  saveTasks();
  displayTasks();
  showToast("Task updated successfully.", "success");
}

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  displayTasks();
  showToast("Task deleted successfully.", "danger");
}

function updateCounter(count) {
  let label;
  if (currentFilter === "completed") {
    label = `${count} completed`;
  } else if (currentFilter === "pending") {
    label = `${count} pending`;
  } else {
    label = `${count} task${count === 1 ? "" : "s"}`;
  }
  taskCounter.textContent = label;
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${completed} of ${total} tasks completed`;
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease forwards";
    toast.addEventListener("animationend", () => toast.remove());
  }, 2500);
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const isPm = hours >= 12;
  hours = hours % 12 || 12;
  return `${day} ${month}, ${hours}:${minutes} ${isPm ? "PM" : "AM"}`;
}

function setActiveFilterButton(filter) {
  filterButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
