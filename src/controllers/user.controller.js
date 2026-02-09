import { asyncHandler } from "../utils/asyncHandler.util.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { deleteImageFromCloudinary } from "../utils/deleteImage.util.js";

dotenv.config();

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Something went wrong while generating refresh and access token.",
    });
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation  - not empty
  // check if user already exist : username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for use creattion
  // return response

  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((val) => val?.trim() === "")) {
    return res.status(400).json({
      status: 400,
      error: "All fields are required.",
    });
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    return res.status(409).json({
      status: 409,
      error: "User already exist.",
    });
  }

  // console.log("IMAGE FILES: ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    return res.status(400).json({
      status: 400,
      error: "Avatar file is required.",
    });
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return res.status(400).json({
      status: 400,
      error: "Avatar file is required.",
    });
  }

  const user = await User.create({
    fullName,
    avatar: {
      url: avatar?.url,
      publicId: avatar?.public_id,
    },
    coverImage: coverImage
      ? {
          url: coverImage?.url,
          publicId: coverImage?.public_id,
        }
      : null,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    return res.status(500).json({
      status: 500,
      error: "Something went wrong while registering the user.",
    });
  }

  return res.status(201).json({
    status: 200,
    message: "User registered successfully.",
    data: createdUser,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> body
  // username or email
  // find the user
  // password check
  // generate access and refresh token
  // send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    return res.status(400).json({
      status: 400,
      error: "username or email is required",
    });
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    return res.status(404).json({
      status: 404,
      error: "User does not exist.",
    });
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      status: 401,
      error: "Invalid user credentials.",
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      status: 200,
      message: "User login successfully.",
      data: loggedInUser,
      accessToken,
      refreshToken,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json({
      status: 200,
      message: "User loggedout.",
    });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      error: 401,
      error: "Unauthorized request.",
    });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res.status(401).json({
        status: 401,
        error: "Invalid refresh token.",
      });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({
        status: 401,
        error: "Refresh token is expired or used.",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json({
        status: 200,
        message: "refresh and access token created successfully.",
        accessAndRefreshTokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
  } catch (error) {
    return res.status(401).json({
      status: 401,
      error: error?.message || "Invalid refresh token",
    });
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!(newPassword === confirmPassword)) {
    return res.status(401).json({
      status: 401,
      error: "New password and confirm password must be same.",
    });
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    return res.status(400).json({
      status: 400,
      error: "Please enter a correct old password.",
    });
  }

  user.password = newPassword;

  await user.save({
    validateBeforeSave: false,
  });

  return res.status(200).json({
    status: 200,
    message: "Password changed successfully.",
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "Current user fetched successfully.",
    user: req.user,
  });
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!email || !fullName) {
    return res.status(401).json({
      status: 401,
      error: "Atleast one field is required.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json({
    status: 200,
    message: "Account details updated successfully.",
    user,
  });
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    return res.status(400).json({
      status: 400,
      error: "Avatar file is missing.",
    });
  }

  const loginUser = await User.findById(req.user?._id);

  const result = await deleteImageFromCloudinary(loginUser.avatar.publicId);

  if (!result.success) {
    return res.status(400).json({
      status: false,
      error: "Cloudinary delete failed.",
    });
  }

  if (loginUser && loginUser.avatar) {
    loginUser.avatar.url = null;
    loginUser.avatar.publicId = null;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    return res.status(400).json({
      status: 400,
      error: "Error while uploading avatar.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          url: avatar?.url,
          publicId: avatar?.public_id,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json({
    status: 200,
    message: "Avatar file updated successfully.",
    user,
  });
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    return res.status(400).json({
      status: 400,
      error: "Cover image file is missing.",
    });
  }

  const loginUser = await User.findById(req.user?._id);

  if (loginUser.coverImage.url && loginUser.coverImage.publicId) {
    const result = await deleteImageFromCloudinary(
      loginUser.coverImage.publicId
    );

    if (!result.success) {
      return res.status(400).json({
        status: false,
        error: "Cloudinary delete failed.",
      });
    }

    loginUser.coverImage.url = null;
    loginUser.coverImage.publicId = null;
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    return res.status(400).json({
      status: 400,
      error: "Error while uploading cover image.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          url: avatar?.url,
          publicId: avatar?.public_id,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json({
    status: 200,
    message: "Cover image file updated successfully.",
    user,
  });
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
