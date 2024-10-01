import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

import authRoutes from "./routes/auth.routes.js";
import connectMongoDB from "./db/connectMongoDb.js";

app.use("/api/auth", authRoutes);

app.listen(8000, () => {
  console.log("Server listening on port: " + 8000);
  connectMongoDB();
});
