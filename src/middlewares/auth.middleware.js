import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/handler/async.handler.js";
import { errorHandler } from "../utils/handler/error.handler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new errorHandler(401, "Unauthorized request");
    }
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new errorHandler(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new errorHandler(401, error?.message || "Invalid access token");
  }
});
