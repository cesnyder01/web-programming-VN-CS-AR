const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ronr",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

module.exports = config;
