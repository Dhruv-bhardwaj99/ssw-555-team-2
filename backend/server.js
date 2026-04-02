require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/messages", messageRoutes);
app.use("/appointments", appointmentRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Start server ONLY if not running tests
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  const HOST = "0.0.0.0";

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

// export app for testing
module.exports = app;