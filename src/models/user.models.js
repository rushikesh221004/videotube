import { Schema, model } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 12
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        avatar: {
            type: String // cloudinary url
        },

        coverImage: {
            type: String // cloudinary url
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            maxlength: 20
        },

        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export const User = model("User", userSchema);

