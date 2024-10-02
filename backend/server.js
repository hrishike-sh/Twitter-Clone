import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

import authRoutes from "./routes/auth.routes.js";
import connectMongoDB from "./db/connectMongoDb.js";
import cookieParser from "cookie-parser";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.listen(8000, () => {
  console.log("Server listening on port: " + 8000);
  connectMongoDB();
});
