const express = require("express");
const { pool } = require("../db");

const router = express.Router();

function normalizeTask(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const dueDate =
    typeof body.due_date === "string" ? body.due_date.trim() : "";
  const status =
    body.status === "Completed" || body.status === "Pending"
      ? body.status
      : "Pending";

  if (!title) throw new Error("Task title is required.");
  if (title.length > 160) throw new Error("Task title must be 160 characters or fewer.");
  if (description.length > 2000) {
    throw new Error("Task description must be 2000 characters or fewer.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new Error("A valid due date is required.");
  }

  return { title, description, due_date: dueDate, status };
}

function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: "Invalid task ID." });
  }
  req.taskId = id;
  next();
}

router.get("/", async (req, res, next) => {
  try {
    const [tasks] = await pool.query(
      "SELECT id, title, description, due_date, status, created_at FROM tasks ORDER BY created_at DESC"
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validateId, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, description, due_date, status, created_at FROM tasks WHERE id = ?",
      [req.taskId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const task = normalizeTask(req.body);
    const [result] = await pool.execute(
      "INSERT INTO tasks (title, description, due_date, status) VALUES (?, ?, ?, ?)",
      [task.title, task.description, task.due_date, task.status]
    );
    const [rows] = await pool.query(
      "SELECT id, title, description, due_date, status, created_at FROM tasks WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error && error.message.includes("valid due date")) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error && error.message.includes("characters")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.put("/:id", validateId, async (req, res, next) => {
  try {
    const task = normalizeTask(req.body);
    const [result] = await pool.execute(
      "UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ? WHERE id = ?",
      [task.title, task.description, task.due_date, task.status, req.taskId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    const [rows] = await pool.query(
      "SELECT id, title, description, due_date, status, created_at FROM tasks WHERE id = ?",
      [req.taskId]
    );
    res.json(rows[0]);
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes("required") ||
      error.message.includes("valid due date") ||
      error.message.includes("characters")
    )) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.delete("/:id", validateId, async (req, res, next) => {
  try {
    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ?", [
      req.taskId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
