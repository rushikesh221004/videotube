import { asyncHandler } from "../utils/asyncHandler.util.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: "Something went wrong while generating refresh and access token."
    })
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: true
}

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
    avatar: avatar.url,
    coverImage: coverImage?.url ?? null,
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

  if (!username || !email) {
    return res.status(400).json({
      status: 400,
      error: "username or email is required",
    });
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

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

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      status: 200,
      message: "User login successfully.",
      data: loggedInUser, accessToken, refreshToken
    })

});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  return res
  .status(200)
  .clearCookie("accessToken", cookieOptions)
  .clearCookie("refreshToken", cookieOptions).
  json({
    status: 200,
    message: "User loggedout."
  })
})

export { registerUser, loginUser, logoutUser };
