// routes/userRoutes.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// POST /api/users  -> create new user
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users -> list all users (for testing)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
