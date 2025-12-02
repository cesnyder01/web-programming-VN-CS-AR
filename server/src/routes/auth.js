const express = require("express");
const { register, login, logout, me, updateProfile } = require("../controllers/authController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authRequired, me);
router.patch("/me", authRequired, updateProfile);

module.exports = router;
