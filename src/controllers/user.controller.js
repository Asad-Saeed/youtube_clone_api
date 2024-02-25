import { asyncHandler } from "../utils/handler/async.handler.js";
import { errorHandler } from "../utils/handler/error.handler.js";
import { responseHandler } from "../utils/handler/response.handler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary/cloudinary.js";

const registerUser = asyncHandler(async (req, res, next) => {
  ////Algorithm////
  // get user detail from frontend
  // validation
  // check if user alredy exist : username and email
  // check for cover images and check for avatar
  // upload file to cloudinay
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // response return

  // Bussiness logic
  // get user detail from frontend
  const { userName, fullName, email, password } = req.body;
  // validation
  if (
    [userName, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new errorHandler(400, "All fields are required");
  }
  // check if user alredy exist : username and email
  const alredyExistUser = await User?.findOne({ $or: [{ userName }, { email }] });
  if (alredyExistUser) {
    throw new errorHandler(
      409,
      "User with email and username is already exist"
    );
  }
  // check for cover images and check for avatar
  // multer give us req.files object
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
//   const avatarLocalPath = req.files?.avatar?.[0]?.path;
// const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new errorHandler(400, "Avatar file is required");
  }
  // upload file to cloudinay
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new errorHandler(400, "Avatar file is required");
  }
  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName?.toLowerCase(),
  });
  const createdUser = await User?.findById(user?._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new errorHandler(
      500,
      "Something went wrong while registering a user"
    );
  }
  return res
    .status(201)
    .json(
      new responseHandler(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({ message: "ok" });
});

export { registerUser, loginUser };
