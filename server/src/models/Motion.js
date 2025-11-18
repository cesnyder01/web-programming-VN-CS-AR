const mongoose = require("mongoose");

const discussionEntrySchema = new mongoose.Schema(
  {
    stance: { type: String, enum: ["pro", "con", "neutral"], default: "neutral" },
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const voteSchema = new mongoose.Schema(
  {
    choice: { type: String, enum: ["support", "against", "abstain"], default: "support" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByEmail: String,
    createdByName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const decisionSchema = new mongoose.Schema(
  {
    outcome: { type: String, enum: ["pending", "passed", "failed", "postponed"], default: "pending" },
    summary: String,
    pros: String,
    cons: String,
    recordedAt: Date,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recordedByName: String,
  },
  { _id: false }
);

const motionSchema = new mongoose.Schema(
  {
    committee: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
    parentMotion: { type: mongoose.Schema.Types.ObjectId, ref: "Motion", default: null },
    variantOf: {
      type: String,
      enum: ["revision", "amendment", "postpone", "overturn", null],
      default: null,
    },
    type: { type: String, enum: ["standard", "procedure", "special"], default: "standard" },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ["pending", "passed", "failed", "postponed"],
      default: "pending",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: String,
    createdAt: { type: Date, default: Date.now },
    discussion: [discussionEntrySchema],
    votes: [voteSchema],
    decisionRecord: decisionSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Motion", motionSchema);
