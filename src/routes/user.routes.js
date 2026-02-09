import { Router } from "express";
import { deleteUserCoverImage, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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

// update routes
userRoutes.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRoutes.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// delete routes 
userRoutes.route("/delete-coverImage").delete(verifyJWT, deleteUserCoverImage);

export default userRoutes;
