const mongoose = require("mongoose");
const Committee = require("../models/Committee");
const Motion = require("../models/Motion");
const User = require("../models/User");

const DEFAULT_PERMISSIONS = ["createMotion", "discussion", "moveToVote", "vote"];
const defaultSettings = {
  offlineMode: true,
  minSpeakersBeforeVote: 2,
  recordNamesInVotes: false,
  allowSpecialMotions: true,
};

function buildMembershipQuery(user) {
  return {
    $or: [
      { "members.user": user._id },
      { "members.email": user.email },
      { "members.name": user.name },
    ],
  };
}

async function listCommittees(req, res) {
  const committees = await Committee.find(buildMembershipQuery(req.user))
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ committees });
}

async function createCommittee(req, res) {
  const { name, members = [], settings = {} } = req.body;
  if (!name) return res.status(400).json({ message: "Committee name is required." });

  const normalizedMembers = await normalizeMembers(members, req.user);
  if (!normalizedMembers.some((m) => m.role === "owner")) {
    normalizedMembers.unshift({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: "owner",
      permissions: [...DEFAULT_PERMISSIONS],
    });
  }

  const committee = await Committee.create({
    name,
    members: normalizedMembers,
    settings: { ...defaultSettings, ...settings },
    createdBy: req.user._id,
  });

  res.status(201).json({ committee });
}

async function getCommitteeDetail(req, res) {
  const committee = await Committee.findOne({
    _id: req.params.id,
    ...buildMembershipQuery(req.user),
  }).lean();

  if (!committee) return res.status(404).json({ message: "Committee not found." });

  const motions = await Motion.find({ committee: committee._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ committee, motions });
}

async function updateSettings(req, res) {
  const committee = await Committee.findOne({
    _id: req.params.id,
    ...buildMembershipQuery(req.user),
  });
  if (!committee) return res.status(404).json({ message: "Committee not found." });

  const membership = findMemberRecord(committee, req.user);
  if (!membership || !["owner", "chair"].includes(membership.role)) {
    return res.status(403).json({ message: "Only owners or chairs can edit settings." });
  }

  const incoming = req.body || {};
  committee.settings = {
    ...defaultSettings,
    ...committee.settings,
    ...incoming,
    minSpeakersBeforeVote: Math.max(
      0,
      Number.isFinite(Number(incoming.minSpeakersBeforeVote))
        ? Number(incoming.minSpeakersBeforeVote)
        : committee.settings?.minSpeakersBeforeVote || 0
    ),
  };
  await committee.save();
  res.json({ committee });
}

async function upsertHandRaise(req, res) {
  const { stance = "pro", note = "" } = req.body;
  const committee = await Committee.findOne({
    _id: req.params.id,
    ...buildMembershipQuery(req.user),
  });
  if (!committee) return res.status(404).json({ message: "Committee not found." });

  const entry = {
    _id: new mongoose.Types.ObjectId(),
    stance,
    note,
    user: req.user._id,
    createdByName: req.user.name,
    createdByEmail: req.user.email,
    createdAt: new Date(),
  };

  const existingIndex = committee.handRaises.findIndex((raise) =>
    raise.user?.equals(req.user._id)
  );
  if (existingIndex >= 0) {
    committee.handRaises[existingIndex] = entry;
  } else {
    committee.handRaises.push(entry);
  }
  await committee.save();
  res.json({ handRaises: committee.handRaises });
}

async function removeHandRaise(req, res) {
  const committee = await Committee.findOne({
    _id: req.params.id,
    ...buildMembershipQuery(req.user),
  });
  if (!committee) return res.status(404).json({ message: "Committee not found." });

  committee.handRaises = committee.handRaises.filter(
    (raise) => raise._id.toString() !== req.params.handId
  );
  await committee.save();
  res.json({ handRaises: committee.handRaises });
}

function findMemberRecord(committee, user) {
  return (
    committee.members.find((member) => {
      if (member.user && user._id && member.user.toString() === user._id.toString()) return true;
      if (member.email && member.email.toLowerCase() === user.email.toLowerCase()) return true;
      if (member.name && member.name.toLowerCase() === user.name.toLowerCase()) return true;
      return false;
    }) || null
  );
}

async function normalizeMembers(members, currentUser) {
  const result = [];
  for (const member of members) {
    if (!member?.name && !member?.email) continue;
    const email = member.email?.toLowerCase();
    let userId = null;
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) userId = existingUser._id;
    }
    if (!userId && email && email === currentUser.email?.toLowerCase()) {
      userId = currentUser._id;
    }
    result.push({
      user: userId,
      name: member.name || member.email || "Member",
      email: member.email,
      role: member.role || "member",
      permissions: member.permissions?.length ? member.permissions : [...DEFAULT_PERMISSIONS],
    });
  }
  return result;
}

module.exports = {
  listCommittees,
  createCommittee,
  getCommitteeDetail,
  updateSettings,
  upsertHandRaise,
  removeHandRaise,
  findMemberRecord,
  buildMembershipQuery,
  defaultSettings,
  DEFAULT_PERMISSIONS,
};
