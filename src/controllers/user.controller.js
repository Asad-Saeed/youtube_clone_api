import { asyncHandler } from "../utils/handler/async.handler.js";
import { errorHandler } from "../utils/handler/error.handler.js";
import { responseHandler } from "../utils/handler/response.handler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary/cloudinary.js";
import jwt from "jsonwebtoken";

// Register User
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
  const alredyExistUser = await User?.findOne({
    $or: [{ userName }, { email }],
  });
  if (alredyExistUser) {
    throw new errorHandler(
      409,
      "User with email and username is already exist"
    );
  }
  // check for cover images and check for avatar
  // multer give us req.files object

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
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
// Generate Access And RefreshTokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken().toString();
    const refreshToken = user.generateRefreshToken().toString();
    user.refreshToken = refreshToken;
    // validateBeforeSave used for validation removed
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new errorHandler(
      500,
      "Something went wrong while generating refresh and access tikem"
    );
  }
};

// Login User
const loginUser = asyncHandler(async (req, res, next) => {
  // get user detail from frontend
  // username or email validation
  // find the user
  // password match
  // generate access token and refresh token
  // send data to cookies
  const { email, userName, password } = req.body;
  if (!userName && !email) {
    throw new errorHandler(400, "User Name and Email Required!");
  }
  const user = await User.findOne({
    $or: [{ userName: userName }, { email: email }],
  });
  if (!user) {
    throw new errorHandler(400, "User doesnot exist");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new errorHandler(401, "Invalid user crediential");
  }
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User?.findById(user?._id).select(
    "-password -refreshToken"
  );
  // send cookies
  // by these options cookies can only be modified from server
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new responseHandler(200, {
        user: loggedInUser,
        refreshToken,
        accessToken,
        message: "User loggedIn Successfully",
      })
    );
});

// Logout User

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new responseHandler(200, {}, "User logged out"));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new errorHandler(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new errorHandler(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new errorHandler(401, "Refresh token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user?.id);
    return res
      .status(200)
      .Cookie("accessToken", accessToken, options)
      .Cookie("refreshToken", newRefreshToken, options)
      .json(
        new responseHandler(
          200,
          { accessToken: accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new errorHandler(401, error?.message || "Invalid refresh token");
  }
});

// Change Current Password

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  // if(!(newPassword===confPassword)){
  //   throw new errorHandler(400,"New password and confirm password does not match")
  // }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new errorHandler(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new responseHandler(200, {}, "Password change successfully!"));
});

// Getting Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new responseHandler(200, req.user, "current user fetched successfully")
    );
});

// Update Account Details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new errorHandler(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.body?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new responseHandler(200, user, "Account detail updated successfully!")
    );
});

// Update User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new errorHandler(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new errorHandler(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.body?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new responseHandler(200, user, "Avatar updated successfully!"));
});

// Update User ConverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new errorHandler(400, "CoverImage file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new errorHandler(400, "Error while uploading CoverImage");
  }
  const user = await User.findByIdAndUpdate(
    req.body?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new responseHandler(200, user, "CoverImage updated successfully!"));
});

// Get User Channel Profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new errorHandler(400, "Username is missing");
  }
  // Aggregation
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // db make every model lowercase and plural
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // Field
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new errorHandler(400, "channel does not exist!");
  }
  return res
    .status(200)
    .json(
      new responseHandler(200, channel[0], "User Channel fetched successfully")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
