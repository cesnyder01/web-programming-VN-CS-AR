const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: { type: String },
    role: {
      type: String,
      enum: ["owner", "chair", "member", "observer"],
      default: "member",
    },
    permissions: [{ type: String }],
  },
  { _id: false }
);

const handRaiseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: String,
    createdByEmail: String,
    stance: { type: String, enum: ["pro", "con", "neutral"], default: "neutral" },
    note: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const committeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    settings: {
      offlineMode: { type: Boolean, default: true },
      minSpeakersBeforeVote: { type: Number, default: 2 },
      recordNamesInVotes: { type: Boolean, default: false },
      allowSpecialMotions: { type: Boolean, default: true },
    },
    members: [memberSchema],
    handRaises: [handRaiseSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Committee", committeeSchema);
