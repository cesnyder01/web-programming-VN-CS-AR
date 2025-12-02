import { builder } from "@netlify/functions";
import mongoose from "mongoose";
import Committee from "../../server/src/models/Committee.js";
import Motion from "../../server/src/models/Motion.js";

const mainHandler = async (event) => {
  const { path, httpMethod, body } = event;
  const reqBody = JSON.parse(body || "{}");

  if (path.endsWith("/list") && httpMethod === "GET") {
    const committees = await Committee.find().sort({ updatedAt: -1 }).lean();
    return { statusCode: 200, body: JSON.stringify({ committees }) };
  }

  if (path.endsWith("/create") && httpMethod === "POST") {
    const { name, members = [], settings = {} } = reqBody;
    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ message: "Committee name is required." }) };
    }

    const committee = await Committee.create({
      name,
      members,
      settings,
    });

    return { statusCode: 201, body: JSON.stringify({ committee }) };
  }

  return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
};

export const handler = builder(mainHandler);