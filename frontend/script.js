const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const notice = document.querySelector("#notice");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const formError = document.querySelector("#form-error");
const saveButton = document.querySelector("#save-task-button");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

let tasks = [];
let editingTaskId = null;

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function formatDate(value) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function setNotice(message = "") {
  notice.textContent = message;
  notice.hidden = !message;
}

function createTextCell(text, className) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function renderTasks() {
  taskList.replaceChildren();

  for (const task of tasks) {
    const row = document.createElement("tr");
    const taskCell = document.createElement("td");
    const title = document.createElement("p");
    const description = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;
    description.className = "task-description";
    description.textContent = task.description || "No description";
    taskCell.append(title, description);
    row.append(taskCell);
    row.append(createTextCell(formatDate(task.due_date)));

    const statusCell = document.createElement("td");
    const statusButton = document.createElement("button");
    const isCompleted = task.status === "Completed";
    statusButton.className = `status-badge ${isCompleted ? "status-completed" : "status-pending"}`;
    statusButton.type = "button";
    statusButton.textContent = isCompleted ? "Completed" : "Pending";
    statusButton.setAttribute("aria-label", `Mark "${task.title}" as ${isCompleted ? "pending" : "completed"}`);
    statusButton.addEventListener("click", () => changeStatus(task));
    statusCell.append(statusButton);
    row.append(statusCell);
    row.append(createTextCell(formatDate(task.created_at)));

    const actionsCell = document.createElement("td");
    actionsCell.className = "action-cell";
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editButton = document.createElement("button");
    editButton.className = "icon-button";
    editButton.type = "button";
    editButton.textContent = "✎";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);
    editButton.addEventListener("click", () => openDialog(task));
    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "⌫";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task));
    actions.append(editButton, deleteButton);
    actionsCell.append(actions);
    row.append(actionsCell);
    taskList.append(row);
  }

  const pending = tasks.filter((task) => task.status !== "Completed").length;
  document.querySelector("#total-count").textContent = tasks.length;
  document.querySelector("#pending-count").textContent = pending;
  document.querySelector("#completed-count").textContent = tasks.length - pending;
  document.querySelector("#task-count-label").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  emptyState.hidden = tasks.length > 0;
  document.querySelector(".table-wrap table").hidden = tasks.length === 0;
}

async function loadTasks() {
  try {
    const result = await request("/api/tasks");
    if (!Array.isArray(result)) throw new Error("The server returned an invalid task list.");
    tasks = result;
    setNotice();
    renderTasks();
  } catch (error) {
    setNotice(`Could not load tasks. ${error.message}. Make sure the backend is running, then try again.`);
  }
}

function openDialog(task = null) {
  editingTaskId = task ? task.id : null;
  taskForm.reset();
  formError.hidden = true;
  formError.textContent = "";
  document.querySelector("#dialog-title").textContent = task ? "Edit task" : "Add a task";
  saveButton.textContent = task ? "Save changes" : "Save task";
  if (task) {
    taskForm.elements.title.value = task.title;
    taskForm.elements.description.value = task.description || "";
    taskForm.elements.due_date.value = task.due_date ? task.due_date.slice(0, 10) : "";
  }
  taskDialog.showModal();
  taskForm.elements.title.focus();
}

function closeDialog() {
  taskDialog.close();
}

async function changeStatus(task) {
  const updatedTask = {
    title: task.title,
    description: task.description || "",
    due_date: task.due_date,
    status: task.status === "Completed" ? "Pending" : "Completed",
  };
  try {
    await request(`/api/tasks/${encodeURIComponent(task.id)}`, {
      method: "PUT",
      body: JSON.stringify(updatedTask),
    });
    await loadTasks();
  } catch (error) {
    setNotice(`Could not update task status. ${error.message}`);
  }
}

async function deleteTask(task) {
  if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
  try {
    await request(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
    setNotice();
    await loadTasks();
  } catch (error) {
    setNotice(`Could not delete task. ${error.message}`);
  }
}

document.querySelector("#add-task-button").addEventListener("click", () => openDialog());
document.querySelector("#empty-add-button").addEventListener("click", () => openDialog());
document.querySelector("#close-dialog-button").addEventListener("click", closeDialog);
document.querySelector("#cancel-dialog-button").addEventListener("click", closeDialog);

taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) closeDialog();
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const payload = {
    title: formData.get("title").trim(),
    description: formData.get("description").trim(),
    due_date: formData.get("due_date"),
  };
  if (editingTaskId !== null) {
    const editingTask = tasks.find((task) => task.id === editingTaskId);
    if (editingTask) payload.status = editingTask.status;
  }
  saveButton.disabled = true;
  formError.hidden = true;

  try {
    await request(editingTaskId === null ? "/api/tasks" : `/api/tasks/${encodeURIComponent(editingTaskId)}`, {
      method: editingTaskId === null ? "POST" : "PUT",
      body: JSON.stringify(payload),
    });
    closeDialog();
    await loadTasks();
  } catch (error) {
    formError.textContent = `Could not save task. ${error.message}`;
    formError.hidden = false;
  } finally {
    saveButton.disabled = false;
  }
});

loadTasks();
