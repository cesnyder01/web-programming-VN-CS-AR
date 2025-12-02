import { builder } from "@netlify/functions";
import mongoose from "mongoose";
import Motion from "../../server/src/models/Motion.js";

const mainHandler = async (event) => {
  const { path, httpMethod, body } = event;
  const reqBody = JSON.parse(body || "{}");

  if (path.endsWith("/list") && httpMethod === "GET") {
    const motions = await Motion.find().sort({ createdAt: -1 }).lean();
    return { statusCode: 200, body: JSON.stringify({ motions }) };
  }

  if (path.endsWith("/create") && httpMethod === "POST") {
    const { title, description, type } = reqBody;
    if (!title) {
      return { statusCode: 400, body: JSON.stringify({ message: "Motion title is required." }) };
    }

    const motion = await Motion.create({
      title,
      description,
      type,
    });

    return { statusCode: 201, body: JSON.stringify({ motion }) };
  }

  return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
};

export const handler = builder(mainHandler);