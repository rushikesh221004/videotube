import { asyncHandler } from "../utils/asyncHandler.util.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";

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

  if (
    [fullName, email, username, password].some((val) => val?.trim() === "")
  ) {
    return res.status(400).json({
      status: 400,
      error: "All fields are required."
    })
  }


  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    return res.status(409).json({
      status: 409,
      error: "User already exist."
    })
  }
  // console.log("IMAGE FILES: ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    return res.status(400).json({
      status: 400,
      error: "Avatar file is required."
    })
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return res.status(400).json({
      status: 400,
      error: "Avatar file is required."
    })
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
      error: "Something went wrong while registering the user."
    })
  }

  return res.status(201).json({
    status: 200,
    message: "User registered successfully.",
    data: createdUser
  })
});

export { registerUser };
