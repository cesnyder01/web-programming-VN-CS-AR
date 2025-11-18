const express = require("express");
const { authRequired } = require("../middleware/auth");
const {
  listCommittees,
  createCommittee,
  getCommitteeDetail,
  updateSettings,
  upsertHandRaise,
  removeHandRaise,
} = require("../controllers/committeeController");
const {
  listMotions,
  createMotion,
  addDiscussion,
  addVote,
  recordDecision,
  createSubMotion,
  createOverturn,
} = require("../controllers/motionController");

const router = express.Router();

router.use(authRequired);

router.get("/", listCommittees);
router.post("/", createCommittee);
router.get("/:id", getCommitteeDetail);
router.patch("/:id/settings", updateSettings);

router.post("/:id/hands", upsertHandRaise);
router.delete("/:id/hands/:handId", removeHandRaise);

router.get("/:committeeId/motions", listMotions);
router.post("/:committeeId/motions", createMotion);

router.post("/motions/:motionId/discussion", addDiscussion);
router.post("/motions/:motionId/votes", addVote);
router.post("/motions/:motionId/decision", recordDecision);
router.post("/motions/:motionId/submotions", createSubMotion);
router.post("/motions/:motionId/overturn", createOverturn);

module.exports = router;
