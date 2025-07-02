import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const userRegister = asyncHandler(async (req, res) => {
  // 1. Extract user details from request body
  const { userName, email, fullName, password, bio } = req.body;

  // 2. Validate required fields
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3. Check if user already exists (username or email)
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this username or email already exists");
  }

  // 4. Validate and extract avatar and cover image paths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files?.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // 5. Upload files to Cloudinary (avatar is mandatory, coverImage is optional)
  const [avatar, coverImage] = await Promise.all([
    uploadOnCloudinary(avatarLocalPath),
    coverImageLocalPath
      ? uploadOnCloudinary(coverImageLocalPath)
      : Promise.resolve(null),
  ]);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary");
  }

  // 6. Create user in database
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    bio,
    avatar: avatar.url,
    coverImage: coverImage?.url || null,
  });

  // 7. Remove sensitive fields before sending response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  // 8. Return success response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};
const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  const { username, email, password } = req.body;
  // Validate required fields

  // console.log("Login request body:", req.body);
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // Find user by username or email
  const user = await User.findOne({
    $or: [{ userName: username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // Check password

  // here isPasswordMatch is a method defined in user model
  // that checks if the entered password matches the hashed password stored in the database

  const isPasswordMatch = await user.isPasswordMatch(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid password");
  }

  //access and referesh token
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // we set option beacuse we want to set cookie as httpOnly and secure httpOnly
  //  means that the cookie cannot be accessed via JavaScript, and secure means
  // that the cookie will only be sent over HTTPS connections.

  const options = {
    httpOnly: true,
    secure: true,
  };
  res.cookie("refreshToken", refreshToken, options);

  // diffrence between access token and refresh token is that access
  // token is used to authenticate the user and refresh token is used to refresh
  //  the access token when it expires

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
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
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshedAccessToken = asyncHandler(async (req, res) => {
  const IncomingrefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!IncomingrefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      IncomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== IncomingrefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const changedPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordMatch = await user.isPasswordMatch(oldPassword);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {});

const updateAccountDetails = asyncHandler(async (req, res) => {});

const updateUserAvatar = asyncHandler(async (req, res) => {});

const updateUserCoverImage = asyncHandler(async (req, res) => {});

const getUserChannelProfile = asyncHandler(async (req, res) => {});

const getWatchHistory = asyncHandler(async (req, res) => {});

export {
  userRegister,
  loginUser,
  logoutUser,
  refreshedAccessToken,
  changedPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
