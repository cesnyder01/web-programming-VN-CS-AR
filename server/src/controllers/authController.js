const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Committee = require("../models/Committee");
const Motion = require("../models/Motion");
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

async function updateProfile(req, res) {
  const name = (req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  req.user.name = name;
  await req.user.save();
  await syncUserName(req.user);

  return res.json({ user: req.user.toSafeObject() });
}

async function syncUserName(user) {
  const userId = user._id;
  const email = (user.email || "").toLowerCase();

  const committees = await Committee.find({
    $or: [
      { "members.user": userId },
      { "members.email": email },
      { "handRaises.user": userId },
      { "handRaises.createdByEmail": email },
    ],
  });

  for (const committee of committees) {
    let changed = false;

    committee.members.forEach((member) => {
      const matchesUser =
        (member.user && member.user.equals && member.user.equals(userId)) ||
        (member.email && member.email.toLowerCase() === email);
      if (matchesUser && member.name !== user.name) {
        member.name = user.name;
        changed = true;
      }
    });

    committee.handRaises.forEach((entry) => {
      const matchesUser =
        (entry.user && entry.user.equals && entry.user.equals(userId)) ||
        (entry.createdByEmail && entry.createdByEmail.toLowerCase() === email);
      if (matchesUser && entry.createdByName !== user.name) {
        entry.createdByName = user.name;
        changed = true;
      }
    });

    if (changed) {
      await committee.save();
    }
  }

  const motions = await Motion.find({
    $or: [
      { createdBy: userId },
      { "discussion.createdBy": userId },
      { "votes.createdBy": userId },
      { "decisionRecord.recordedBy": userId },
    ],
  });

  for (const motion of motions) {
    let changed = false;

    if (motion.createdBy && motion.createdBy.equals && motion.createdBy.equals(userId)) {
      if (motion.createdByName !== user.name) {
        motion.createdByName = user.name;
        changed = true;
      }
    }

    motion.discussion.forEach((entry) => {
      if (entry.createdBy && entry.createdBy.equals && entry.createdBy.equals(userId)) {
        if (entry.createdByName !== user.name) {
          entry.createdByName = user.name;
          changed = true;
        }
      }
    });

    motion.votes.forEach((vote) => {
      if (vote.createdBy && vote.createdBy.equals && vote.createdBy.equals(userId)) {
        if (vote.createdByName !== user.name) {
          vote.createdByName = user.name;
          changed = true;
        }
      }
    });

    if (
      motion.decisionRecord &&
      motion.decisionRecord.recordedBy &&
      motion.decisionRecord.recordedBy.equals &&
      motion.decisionRecord.recordedBy.equals(userId) &&
      motion.decisionRecord.recordedByName !== user.name
    ) {
      motion.decisionRecord.recordedByName = user.name;
      changed = true;
    }

    if (changed) {
      await motion.save();
    }
  }
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

module.exports = { register, login, logout, me, updateProfile };
