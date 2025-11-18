const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/tokens");

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already registered." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

  attachToken(res, user._id);
  return res.status(201).json({ user: user.toSafeObject() });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }
  attachToken(res, user._id);
  return res.json({ user: user.toSafeObject() });
}

function logout(req, res) {
  res.clearCookie("token");
  return res.json({ message: "Logged out." });
}

async function me(req, res) {
  return res.json({ user: req.user.toSafeObject() });
}

function attachToken(res, userId) {
  const token = signToken(userId);
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

module.exports = { register, login, logout, me };
