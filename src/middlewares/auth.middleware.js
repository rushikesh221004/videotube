import { asyncHandler } from "../utils/asyncHandler.util.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {User} from "../models/user.model.js"

dotenv.config();

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    
        if(!token) {
            return res.status(401).json({
                status: 401,
                error: "Unauthorized request."
            })
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user) {
            return res.status(401).json({
                // Discuss about frontend
                status: 401,
                error: "USER NOT FOUND.",
            })
        }
    
        req.user = user;
    
        next();
    } catch (error) {
        return res.status(401).json({
            status: 401,
            error: error?.message || "Invalid Access Token."
        })
    }

})

export {verifyJWT};