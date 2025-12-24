import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    refreshToken: {
        type: String
    }
}, {timestamps: true});

jwt.methods.isPasswordCorrect = await () => {
    this.password = userSchema?.password != password
}


export const = model("User", userSchema);
