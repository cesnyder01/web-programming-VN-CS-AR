const mongoose = require("mongoose");
const config = require("./env");

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongoUri, {
    dbName: "ronr",
  });

  isConnected = true;
  return mongoose.connection;
}

module.exports = { connectDB };
