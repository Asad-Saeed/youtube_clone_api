import { asyncHandler } from "../utils/handler/async.handler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "ok" });
});

const loginUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "ok" });
});

export { registerUser, loginUser };
