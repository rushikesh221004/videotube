import { Router } from "express";
import { changeCurrentPassword, deleteUserAccount, deleteUserCoverImage, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRoutes = Router();

userRoutes.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

userRoutes.route("/login").post(loginUser);

// secured routes
userRoutes.route("/logout").post(verifyJWT, logoutUser);
userRoutes.route("/refresh-token").post(refreshAccessToken);

// get user
userRoutes.route("get-user").get(verifyJWT, getCurrentUser);
userRoutes.route("/c/:username").get(verifyJWT, getUserChannelProfile);
userRoutes.route("/get-watch-history").get(verifyJWT, getWatchHistory);

// update routes
userRoutes.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
userRoutes.route("/update-password").post(verifyJWT, changeCurrentPassword);
userRoutes.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRoutes.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// delete routes 
userRoutes.route("/delete-coverImage").delete(verifyJWT, deleteUserCoverImage);
userRoutes.route("/delete-userAccount").delete(verifyJWT, deleteUserAccount);

export default userRoutes;
