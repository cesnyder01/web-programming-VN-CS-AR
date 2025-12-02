const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const config = require("./config/env");
const { connectDB } = require("./config/mongo");

const authRoutes = require("./routes/auth");
const committeeRoutes = require("./routes/committees");

const app = express();

app.use(
  cors({
    origin: config.frontendUrl.split(","),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/committees", committeeRoutes);

app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(Server running on port );
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});