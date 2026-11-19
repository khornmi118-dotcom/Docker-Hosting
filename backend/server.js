require("dotenv").config();

const express = require("express");
const taskRoutes = require("./routes/tasks");
const { testConnection } = require("./db");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tasks", taskRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  await testConnection();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Unable to start the backend:", error.message);
  process.exit(1);
});
