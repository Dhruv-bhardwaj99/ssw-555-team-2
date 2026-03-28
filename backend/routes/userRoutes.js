// routes/userRoutes.js
const { encrypt, decrypt } = require('../utils/AES_256');

const express = require("express");
const User = require("../models/user");

const router = express.Router();

// POST /api/users  -> create new user
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ message: "firstName, lastName, email, and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    //const existing = await User.findOne({ email: normalizedEmail });
    const users = await User.find();
    const existing = users.find(
      u => decrypt(u.email) === normalizedEmail
    );

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const encryptedEmail = encrypt(normalizedEmail);
    const user = await User.create({ firstName, lastName, email: encryptedEmail, password, role });

    const userObj = user.toObject();
    delete userObj.password;

    // 🔓 Decrypt before sending
    userObj.email = decrypt(userObj.email);

    res.status(201).json(userObj);
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//POST login user

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    //const user = await User.findOne({ email: normalizedEmail });

    const users = await User.find();
    const user = users.find(
      u => decrypt(u.email) === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const userObj = user.toObject();
    delete userObj.password;

    // 🔓 decrypt email before sending
    userObj.email = decrypt(userObj.email);

    return res.json({
      message: "Login successful",
      user: userObj,
    });
  } catch (error) {
    console.error("Error loggin in:", error.message);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

// GET /api/users -> list all users (for testing)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const decryptedUsers = users.map(user => {
      const userObj = user.toObject();
      userObj.email = decrypt(userObj.email);
      return userObj;
    });
    
    res.json(decryptedUsers);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//GET all the doctors
router.get("/providers", async (req, res) => {
  try {
    const providers = await User.find({ role: "provider" }).select("-password");

    res.status(200).json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
