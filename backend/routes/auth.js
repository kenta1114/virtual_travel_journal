const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models/index");
const router = express.Router();

//サインアップ
router.post("/signup", async(req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: "User created successfully" });
  } catch(err) {
    console.error("Signup error:", err);
    res.status(400).json({ error: "Error creating user" });
  }
});

//ログイン
router.post("/login", async(req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch(err) {
    console.error("Login error:", err);
    res.status(400).json({ error: "Error logging in" });
  }
});

module.exports = router;