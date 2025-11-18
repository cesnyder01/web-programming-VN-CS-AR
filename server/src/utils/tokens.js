const jwt = require("jsonwebtoken");
const config = require("../config/env");

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

module.exports = { signToken, verifyToken };
