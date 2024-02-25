import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
// Configration
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import Route
import userRouter from "./routes/user.route.js";
// routes declaration now weused app.use
// /users is a prefix for route like this http://localhost:8000/api/v1/users/regiser
app.use("/api/v1/users", userRouter);

export { app };
