// server.js
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes")
require("dotenv").config();

const app = express();


// Middleware to parse JSON in request bodies
app.use(express.json());
// Connect to MongoDB
connectDB();
app.use("/api/users", userRoutes);
app.use("/appointments", appointmentRoutes);


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
