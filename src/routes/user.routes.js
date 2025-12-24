import express from "express";

const userRoutes = express.Router();

userRoutes.route("/register").get(registerUser);

export { userRoutes };