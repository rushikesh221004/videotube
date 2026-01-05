import { Schema, model } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
        },

        avatar: {
            type: String,
            required: true
        },

        coverImage: {
            type: String,
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

export const User = model("User", userSchema);
