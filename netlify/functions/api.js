import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Committee from "../../server/src/models/Committee.js";
import Motion from "../../server/src/models/Motion.js";
import User from "../../server/src/models/User.js";
import tokens from "../../server/src/utils/tokens.js";

const { signToken, verifyToken } = tokens;

function buildCorsHeaders(event) {
  const requestOrigin = event.headers?.origin || process.env.FRONTEND_URL || "*";
  return {
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function json(statusCode, payload, baseHeaders) {
  return {
    statusCode,
    headers: {
      ...baseHeaders,
    },
    body: JSON.stringify(payload),
  };
}

async function ensureDb() {
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || "ronr";

  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName });
}

function normalizePath(path = "") {
  return path.replace(/^\/\.netlify\/functions\/api/, "/api");
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [k, v] = part.split("=").map((s) => s?.trim());
    if (k) acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}

async function getAuthUser(event) {
  const cookies = parseCookies(event.headers?.cookie || "");
  const tokenHeader = event.headers?.authorization?.replace("Bearer ", "");
  const token = cookies.token || tokenHeader;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const user = await User.findById(payload.sub);
  if (!user) return null;

  return user;
}

function requireAuth(user, headers) {
  if (!user) {
    return json(401, { message: "Authentication required." }, headers);
  }
  return null;
}

function membershipFilter(user) {
  const normalizedEmail = user.email?.toLowerCase?.();
  return {
    $or: [
      { createdBy: user._id },
      { "members.user": user._id },
      { "members.userId": user._id },
      ...(normalizedEmail
        ? [
            {
              "members.email": {
                $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}$`,
                $options: "i",
              },
            },
          ]
        : []),
    ],
  };
}

function normalizeMembers(members = []) {
  return members.map((member) => {
    if (!member) return member;
    const email = member.email ? member.email.toLowerCase() : undefined;
    return { ...member, email };
  });
}

function isOwner(committee, user) {
  if (!committee || !user) return false;
  const normalizedEmail = user.email?.toLowerCase?.();
  return (committee.members || []).some((member) => {
    if (!member) return false;
    if (member.role !== "owner") return false;
    if (member.user && String(member.user) === String(user._id)) return true;
    if (member.userId && String(member.userId) === String(user._id)) return true;
    if (normalizedEmail && member.email && member.email.toLowerCase() === normalizedEmail) return true;
    return false;
  });
}

function serializeMotion(motion) {
  if (!motion) return motion;
  const parentId = motion.parentMotion || motion.parentMotionId || null;
  return {
    ...motion,
    id: motion._id,
    parentMotionId: parentId ? String(parentId) : null,
  };
}

async function syncUserName(user) {
  const userId = user._id;
  const email = (user.email || "").toLowerCase();
  const name = user.name;

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

    (committee.members || []).forEach((member) => {
      const matchesUser =
        (member.user && String(member.user) === String(userId)) ||
        (member.email && member.email.toLowerCase() === email);
      if (matchesUser && member.name !== name) {
        member.name = name;
        changed = true;
      }
    });

    (committee.handRaises || []).forEach((entry) => {
      const matchesUser =
        (entry.user && String(entry.user) === String(userId)) ||
        (entry.createdByEmail && entry.createdByEmail.toLowerCase() === email);
      if (matchesUser && entry.createdByName !== name) {
        entry.createdByName = name;
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

    if (motion.createdBy && String(motion.createdBy) === String(userId)) {
      if (motion.createdByName !== name) {
        motion.createdByName = name;
        changed = true;
      }
    }

    (motion.discussion || []).forEach((entry) => {
      if (entry.createdBy && String(entry.createdBy) === String(userId) && entry.createdByName !== name) {
        entry.createdByName = name;
        changed = true;
      }
    });

    (motion.votes || []).forEach((vote) => {
      if (vote.createdBy && String(vote.createdBy) === String(userId) && vote.createdByName !== name) {
        vote.createdByName = name;
        changed = true;
      }
    });

    if (
      motion.decisionRecord &&
      motion.decisionRecord.recordedBy &&
      String(motion.decisionRecord.recordedBy) === String(userId) &&
      motion.decisionRecord.recordedByName !== name
    ) {
      motion.decisionRecord.recordedByName = name;
      changed = true;
    }

    if (changed) {
      await motion.save();
    }
  }
}

export async function handler(event) {
  const method = event.httpMethod;
  const corsHeaders = buildCorsHeaders(event);
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders };
  }

  const path = normalizePath(event.path || "");

  try {
    await ensureDb();
  } catch (err) {
    console.error("DB connection error", err);
    return json(500, { message: "Unable to connect to the database." }, corsHeaders);
  }

  const body = (() => {
    try {
      return JSON.parse(event.body || "{}");
    } catch {
      return {};
    }
  })();

  const user = await getAuthUser(event);

  // Health check
  if (path === "/api/health") {
    return json(200, { status: "ok" }, corsHeaders);
  }

  // Auth endpoints
  if (path === "/api/auth/register" && method === "POST") {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return json(400, { message: "Name, email, and password are required." }, corsHeaders);
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return json(409, { message: "Email already registered." }, corsHeaders);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email: email.toLowerCase(), passwordHash });
    const token = signToken(newUser._id);
    return json(201, { user: newUser.toSafeObject(), token }, corsHeaders);
  }

  if (path === "/api/auth/login" && method === "POST") {
    const { email, password } = body;
    if (!email || !password) {
      return json(400, { message: "Email and password are required." }, corsHeaders);
    }
    const found = await User.findOne({ email: email.toLowerCase() });
    if (!found) {
      return json(401, { message: "Invalid credentials." }, corsHeaders);
    }
    const matches = await bcrypt.compare(password, found.passwordHash);
    if (!matches) {
      return json(401, { message: "Invalid credentials." }, corsHeaders);
    }
    const token = signToken(found._id);
    return json(200, { user: found.toSafeObject(), token }, corsHeaders);
  }

  if (path === "/api/auth/me" && method === "GET") {
    if (!user) {
      return json(200, { user: null }, corsHeaders);
    }
    return json(200, { user: user.toSafeObject() }, corsHeaders);
  }

  if (path === "/api/auth/me" && method === "PATCH") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const name = (body.name || "").trim();
    if (!name) {
      return json(400, { message: "Name is required." }, corsHeaders);
    }
    user.name = name;
    await user.save();
    await syncUserName(user);
    return json(200, { user: user.toSafeObject() }, corsHeaders);
  }

  if (path === "/api/auth/logout" && method === "POST") {
    return json(200, { message: "Logged out." }, corsHeaders);
  }

  // Committees list / create
  if ((path === "/api/committees" || path === "/api/committees/") && method === "GET") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const committees = await Committee.find(membershipFilter(user)).sort({ updatedAt: -1 }).lean();
    const normalized = committees.map((c) => ({ ...c, id: c._id }));
    return json(200, { committees: normalized }, corsHeaders);
  }

  if ((path === "/api/committees" || path === "/api/committees/") && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const { name, members = [], settings = {} } = body;
    if (!name) {
      return json(400, { message: "Committee name is required." }, corsHeaders);
    }
    const committee = await Committee.create({
      name,
      members: normalizeMembers(members),
      createdBy: user._id,
      settings: {
        offlineMode: true,
        minSpeakersBeforeVote: 2,
        recordNamesInVotes: false,
        allowSpecialMotions: true,
        ...settings,
      },
    });
    return json(201, { committee }, corsHeaders);
  }

  // Committee detail
  const committeeDetailMatch = path.match(/^\/api\/committees\/([^/]+)$/);
  if (committeeDetailMatch && method === "GET") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const committeeId = committeeDetailMatch[1];
    const committee = await Committee.findOne({ _id: committeeId, ...membershipFilter(user) }).lean();
    if (!committee) {
      return json(404, { message: "Committee not found." }, corsHeaders);
    }
    const motions = await Motion.find({ committee: committeeId }).sort({ createdAt: -1 }).lean();
    const normalizedMotions = motions.map(serializeMotion);
    return json(200, { committee: { ...committee, id: committee._id }, motions: normalizedMotions }, corsHeaders);
  }

  // Committee settings update
  const committeeSettingsMatch = path.match(/^\/api\/committees\/([^/]+)\/settings$/);
  if (committeeSettingsMatch && method === "PATCH") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const committeeId = committeeSettingsMatch[1];
    const committee = await Committee.findOne({ _id: committeeId, ...membershipFilter(user) });
    if (!committee) {
      return json(404, { message: "Committee not found." }, corsHeaders);
    }
    const normalizedEmail = user.email?.toLowerCase?.();
    const isChair = (committee.members || []).some((m) => {
      if (!m || m.role !== "chair") return false;
      if (m.user && String(m.user) === String(user._id)) return true;
      if (m.userId && String(m.userId) === String(user._id)) return true;
      if (normalizedEmail && m.email && m.email.toLowerCase() === normalizedEmail) return true;
      return false;
    });
    if (!isOwner(committee, user) && !isChair) {
      return json(403, { message: "Only owners or chairs can edit settings." }, corsHeaders);
    }
    const incoming = body?.settings || body || {};
    const merged = {
      offlineMode:
        incoming.offlineMode !== undefined ? incoming.offlineMode : committee.settings?.offlineMode ?? true,
      recordNamesInVotes:
        incoming.recordNamesInVotes !== undefined
          ? incoming.recordNamesInVotes
          : committee.settings?.recordNamesInVotes ?? false,
      allowSpecialMotions:
        incoming.allowSpecialMotions !== undefined
          ? incoming.allowSpecialMotions
          : committee.settings?.allowSpecialMotions ?? true,
      minSpeakersBeforeVote: Math.max(
        0,
        Number.isFinite(Number(incoming.minSpeakersBeforeVote))
          ? Number(incoming.minSpeakersBeforeVote)
          : committee.settings?.minSpeakersBeforeVote ?? 0
      ),
    };
    committee.settings = merged;
    await committee.save();
    return json(200, { committee }, corsHeaders);
  }

  // Committee delete (owner only)
  const committeeDeleteMatch = path.match(/^\/api\/committees\/([^/]+)$/);
  if (committeeDeleteMatch && method === "DELETE") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const committeeId = committeeDeleteMatch[1];
    const committee = await Committee.findOne({ _id: committeeId, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    if (!isOwner(committee, user)) return json(403, { message: "Only the owner can delete this committee." }, corsHeaders);
    await Motion.deleteMany({ committee: committeeId });
    await Committee.deleteOne({ _id: committeeId });
    return json(200, { message: "Committee deleted." }, corsHeaders);
  }

  // Hand raises
  const handRaiseMatch = path.match(/^\/api\/committees\/([^/]+)\/hands$/);
  if (handRaiseMatch && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const committeeId = handRaiseMatch[1];
    const committee = await Committee.findOne({ _id: committeeId, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const raise = {
      createdByName: body.createdByName || user.name || "Member",
      createdByEmail: body.createdByEmail || user.email,
      stance: body.stance || "neutral",
      note: body.note || "",
      createdAt: new Date(),
    };
    const updated = await Committee.findByIdAndUpdate(
      committeeId,
      { $push: { handRaises: raise } },
      { new: true }
    ).lean();
    return json(200, { committee: updated }, corsHeaders);
  }

  const handRemoveMatch = path.match(/^\/api\/committees\/([^/]+)\/hands\/([^/]+)$/);
  if (handRemoveMatch && method === "DELETE") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const [_, committeeId, handId] = handRemoveMatch;
    const committee = await Committee.findOne({ _id: committeeId, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const updated = await Committee.findByIdAndUpdate(
      committeeId,
      { $pull: { handRaises: { _id: handId } } },
      { new: true }
    ).lean();
    if (!updated) return json(404, { message: "Committee not found." }, corsHeaders);
    return json(200, { committee: updated }, corsHeaders);
  }

  // Motions list/create for a committee
  const motionsMatch = path.match(/^\/api\/committees\/([^/]+)\/motions$/);
  if (motionsMatch) {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const committeeId = motionsMatch[1];
    const committee = await Committee.findOne({ _id: committeeId, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    if (method === "GET") {
      const motions = await Motion.find({ committee: committeeId }).sort({ createdAt: -1 }).lean();
      return json(200, { motions: motions.map(serializeMotion) }, corsHeaders);
    }
    if (method === "POST") {
      const { title, description, type = "standard", parentMotionId = null, variantOf = null } = body;
      if (!title) return json(400, { message: "Motion title is required." }, corsHeaders);
      const motion = await Motion.create({
        committee: committeeId,
        parentMotion: parentMotionId,
        variantOf,
        type,
        title,
        description,
        status: "pending",
        createdBy: user._id,
        createdByName: body.createdByName || user.name,
      });
      return json(201, { motion: serializeMotion(motion.toObject()) }, corsHeaders);
    }
  }

  // Motion discussion entries
  const discussionMatch = path.match(/^\/api\/committees\/motions\/([^/]+)\/discussion$/);
  if (discussionMatch && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const motionId = discussionMatch[1];
    const motion = await Motion.findById(motionId);
    if (!motion) return json(404, { message: "Motion not found." }, corsHeaders);
    const committee = await Committee.findOne({ _id: motion.committee, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const entry = {
      stance: body.stance || "neutral",
      content: body.content || "",
      createdBy: user._id,
      createdByName: body.createdByName || user.name,
      createdAt: new Date(),
    };
    const updated = await Motion.findByIdAndUpdate(
      motionId,
      { $push: { discussion: entry } },
      { new: true }
    ).lean();
    return json(200, { motion: serializeMotion(updated) }, corsHeaders);
  }

  // Motion votes
  const voteMatch = path.match(/^\/api\/committees\/motions\/([^/]+)\/votes$/);
  if (voteMatch && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const motionId = voteMatch[1];
    const motion = await Motion.findById(motionId);
    if (!motion) return json(404, { message: "Motion not found." }, corsHeaders);
    const committee = await Committee.findOne({ _id: motion.committee, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const vote = {
      choice: body.choice || "support",
      createdBy: user._id,
      createdByName: body.createdByName || user.name,
      createdByEmail: body.createdByEmail || user.email,
      createdAt: new Date(),
    };
    const updated = await Motion.findByIdAndUpdate(
      motionId,
      { $push: { votes: vote } },
      { new: true }
    ).lean();
    return json(200, { motion: serializeMotion(updated) }, corsHeaders);
  }

  // Motion decision record
  const decisionMatch = path.match(/^\/api\/committees\/motions\/([^/]+)\/decision$/);
  if (decisionMatch && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const motionId = decisionMatch[1];
    const motion = await Motion.findById(motionId);
    if (!motion) return json(404, { message: "Motion not found." }, corsHeaders);
    const committee = await Committee.findOne({ _id: motion.committee, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const normalizedEmail = user.email?.toLowerCase?.();
    const isChair = (committee.members || []).some((m) => {
      if (!m || m.role !== "chair") return false;
      if (m.user && String(m.user) === String(user._id)) return true;
      if (m.userId && String(m.userId) === String(user._id)) return true;
      if (normalizedEmail && m.email && m.email.toLowerCase() === normalizedEmail) return true;
      return false;
    });
    if (!isOwner(committee, user) && !isChair) {
      return json(403, { message: "Only owners or chairs can record decisions." }, corsHeaders);
    }
    const decision = {
      outcome: body.outcome || "pending",
      summary: body.summary,
      pros: body.pros,
      cons: body.cons,
      recordedAt: new Date(),
      recordedBy: user._id,
      recordedByName: body.recordedByName || user.name,
    };
    const updated = await Motion.findByIdAndUpdate(
      motionId,
      { $set: { decisionRecord: decision, status: decision.outcome || "pending" } },
      { new: true }
    ).lean();
    return json(200, { motion: serializeMotion(updated) }, corsHeaders);
  }

  // Sub-motions
  const subMotionMatch = path.match(/^\/api\/committees\/motions\/([^/]+)\/submotions$/);
  if (subMotionMatch && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const parentMotionId = subMotionMatch[1];
    const parent = await Motion.findById(parentMotionId);
    if (!parent) return json(404, { message: "Parent motion not found." }, corsHeaders);
    const committee = await Committee.findOne({ _id: parent.committee, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const { title, description, variantOf = "revision" } = body;
    if (!title) return json(400, { message: "Submotion title is required." }, corsHeaders);
    const motion = await Motion.create({
      committee: parent.committee,
      parentMotion: parentMotionId,
      variantOf,
      type: body.type || "standard",
      title,
      description,
      status: "pending",
      createdBy: user._id,
      createdByName: body.createdByName || user.name,
    });
    return json(201, { motion: serializeMotion(motion.toObject()) }, corsHeaders);
  }

  // Overturn motion
  const overturnMatch = path.match(/^\/api\/committees\/motions\/([^/]+)\/overturn$/);
  if (overturnMatch && method === "POST") {
    const authResp = requireAuth(user, corsHeaders);
    if (authResp) return authResp;
    const targetMotionId = overturnMatch[1];
    const target = await Motion.findById(targetMotionId);
    if (!target) return json(404, { message: "Target motion not found." }, corsHeaders);
    const committee = await Committee.findOne({ _id: target.committee, ...membershipFilter(user) }).lean();
    if (!committee) return json(404, { message: "Committee not found." }, corsHeaders);
    const motion = await Motion.create({
      committee: target.committee,
      parentMotion: targetMotionId,
      variantOf: "overturn",
      type: "special",
      title: body.title || "Overturn request",
      description: body.description,
      status: "pending",
      createdBy: user._id,
      createdByName: body.createdByName || user.name,
    });
    return json(201, { motion: serializeMotion(motion.toObject()) }, corsHeaders);
  }

  return json(404, { message: "Not Found" }, corsHeaders);
}
