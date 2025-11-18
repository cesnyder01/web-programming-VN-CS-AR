const { verifyToken } = require("../utils/tokens");
const User = require("../models/User");

async function authRequired(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }
    const payload = verifyToken(token);
    if (!payload?.sub) {
      return res.status(401).json({ message: "Invalid token." });
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Authentication failed." });
  }
}

module.exports = { authRequired };
