import { builder } from "@netlify/functions";
import bcrypt from "bcryptjs";
import User from "../../server/src/models/User.js";
import { signToken } from "../../server/src/utils/tokens.js";

const mainHandler = async (event) => {
  const { path, httpMethod, body } = event;
  const reqBody = JSON.parse(body || "{}");

  if (path.endsWith("/register") && httpMethod === "POST") {
    const { name, email, password } = reqBody;
    if (!name || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "Name, email, and password are required." }) };
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { statusCode: 409, body: JSON.stringify({ message: "Email already registered." }) };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

    const token = signToken(user._id);
    return { statusCode: 201, body: JSON.stringify({ user: user.toSafeObject(), token }) };
  }

  if (path.endsWith("/login") && httpMethod === "POST") {
    const { email, password } = reqBody;
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "Email and password are required." }) };
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials." }) };
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials." }) };
    }

    const token = signToken(user._id);
    return { statusCode: 200, body: JSON.stringify({ user: user.toSafeObject(), token }) };
  }

  if (path.endsWith("/me") && httpMethod === "GET") {
    // Example response for the current user
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User details endpoint not yet implemented." }),
    };
  }

  return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
};

export const handler = builder(mainHandler);