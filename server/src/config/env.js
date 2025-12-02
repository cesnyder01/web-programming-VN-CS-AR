const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 5050,
  mongoUri: process.env.MONGO_URI || "mongodb+srv://aliceroberts:Alikinz-13@cluster0.ygllgdj.mongodb.net/ronr?retryWrites=true&w=majority",
  jwtSecret: process.env.JWT_SECRET || "change-me-please",
  frontendUrl: process.env.FRONTEND_URL || "https://rulesoforder.netlify.app/",
};

module.exports = config;
