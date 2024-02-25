import { asyncHandler } from "../utils/handler/async.handler.js";

const registerUser = asyncHandler(async (req, res, next) => {
  console.log("registerUser route handler called");
  res.status(200).json({ message: "ok" });
});

const loginUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({ message: "ok" });
});

export { registerUser, loginUser };
