const mongoose = require("mongoose");
const Committee = require("../models/Committee");
const Motion = require("../models/Motion");
const {
  buildMembershipQuery,
  findMemberRecord,
  DEFAULT_PERMISSIONS,
} = require("./committeeController");

async function ensureCommitteeAccess(committeeId, user) {
  const committee = await Committee.findOne({ _id: committeeId, ...buildMembershipQuery(user) });
  if (!committee) {
    const err = new Error("Committee not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  const memberRecord = findMemberRecord(committee, user);
  if (!memberRecord) {
    const err = new Error("Not a committee member.");
    err.statusCode = 403;
    throw err;
  }
  return { committee, memberRecord };
}

function hasPermission(memberRecord, permission) {
  if (!memberRecord) return false;
  if (["owner", "chair"].includes(memberRecord.role)) return true;
  return (memberRecord.permissions || DEFAULT_PERMISSIONS).includes(permission);
}

async function listMotions(req, res) {
  const { committee } = await ensureCommitteeAccess(req.params.committeeId, req.user);
  const motions = await Motion.find({ committee: committee._id }).sort({ createdAt: -1 }).lean();
  res.json({ motions });
}

async function createMotion(req, res) {
  const { committee, memberRecord } = await ensureCommitteeAccess(req.params.committeeId, req.user);
  if (!hasPermission(memberRecord, "createMotion")) {
    return res.status(403).json({ message: "Permission denied." });
  }
  if (req.body.type === "special" && committee.settings?.allowSpecialMotions === false) {
    return res.status(400).json({ message: "Special motions are disabled for this committee." });
  }
  const payload = {
    committee: committee._id,
    title: req.body.title,
    description: req.body.description,
    type: req.body.type || "standard",
    status: "pending",
    createdBy: req.user._id,
    createdByName: req.user.name,
    parentMotion: req.body.parentMotionId ? new mongoose.Types.ObjectId(req.body.parentMotionId) : null,
    variantOf: req.body.variantOf || null,
  };
  if (!payload.title) return res.status(400).json({ message: "Motion title is required." });

  const motion = await Motion.create(payload);
  res.status(201).json({ motion });
}

async function addDiscussion(req, res) {
  const motion = await getMotionWithAccess(req.params.motionId, req.user);
  const { committee, memberRecord } = motion;
  if (!hasPermission(memberRecord, "discussion")) {
    return res.status(403).json({ message: "Permission denied." });
  }
  const entry = {
    stance: req.body.stance || "neutral",
    content: req.body.content,
    createdBy: req.user._id,
    createdByName: req.user.name,
  };
  if (!entry.content) {
    return res.status(400).json({ message: "Discussion content is required." });
  }
  motion.motion.discussion.push(entry);
  await motion.motion.save();
  res.json({ motion: motion.motion });
}

async function addVote(req, res) {
  const motion = await getMotionWithAccess(req.params.motionId, req.user);
  const { memberRecord } = motion;
  if (!hasPermission(memberRecord, "vote")) {
    return res.status(403).json({ message: "Permission denied." });
  }
  const choice = req.body.choice || "support";
  const voteIndex = motion.motion.votes.findIndex((vote) =>
    vote.createdBy?.equals(req.user._id)
  );
  const entry = {
    choice,
    createdBy: req.user._id,
    createdByEmail: req.user.email,
    createdByName: req.user.name,
  };
  if (voteIndex >= 0) {
    motion.motion.votes[voteIndex] = entry;
  } else {
    motion.motion.votes.push(entry);
  }
  await motion.motion.save();
  res.json({ motion: motion.motion });
}

async function recordDecision(req, res) {
  const motion = await getMotionWithAccess(req.params.motionId, req.user);
  const { memberRecord } = motion;
  if (!["owner", "chair"].includes(memberRecord.role) && !hasPermission(memberRecord, "recordDecision")) {
    return res.status(403).json({ message: "Permission denied." });
  }
  const { outcome, summary, pros, cons } = req.body;
  if (!outcome || outcome === "pending") {
    return res.status(400).json({ message: "Outcome must be supplied." });
  }
  motion.motion.decisionRecord = {
    outcome,
    summary,
    pros,
    cons,
    recordedAt: new Date(),
    recordedBy: req.user._id,
    recordedByName: req.user.name,
  };
  motion.motion.status = outcome;
  await motion.motion.save();
  res.json({ motion: motion.motion });
}

async function createSubMotion(req, res) {
  req.body.variantOf = req.body.variantOf || "revision";
  req.body.parentMotionId = req.params.motionId;
  req.params.committeeId = req.body.committeeId || req.body.parentCommitteeId;
  req.params.committeeId = req.params.committeeId || (await findCommitteeIdFromMotion(req.params.motionId));
  return createMotion(req, res);
}

async function createOverturn(req, res) {
  const parentMotion = await Motion.findById(req.params.motionId);
  if (!parentMotion) return res.status(404).json({ message: "Motion not found." });
  const vote = parentMotion.votes.find((entry) => entry.createdBy?.equals(req.user._id));
  if (!vote || vote.choice !== "support") {
    return res.status(403).json({ message: "Must have supported the motion to request an overturn." });
  }
  req.body.variantOf = "overturn";
  req.body.parentMotionId = parentMotion._id;
  req.params.committeeId = parentMotion.committee.toString();
  return createMotion(req, res);
}

async function getMotionWithAccess(motionId, user) {
  const motion = await Motion.findById(motionId);
  if (!motion) {
    const err = new Error("Motion not found.");
    err.statusCode = 404;
    throw err;
  }
  const { committee, memberRecord } = await ensureCommitteeAccess(motion.committee, user);
  return { motion, committee, memberRecord };
}

async function findCommitteeIdFromMotion(motionId) {
  const motion = await Motion.findById(motionId);
  if (!motion) return null;
  return motion.committee?.toString();
}

module.exports = {
  listMotions,
  createMotion,
  addDiscussion,
  addVote,
  recordDecision,
  createSubMotion,
  createOverturn,
};
