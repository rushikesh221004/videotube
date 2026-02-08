import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteImageFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
        return res.status(400).json({
            status: 400,
            error: "Public id not found."
        })
    }

    // upload the file on cloudinary
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });

  } catch (error) {
    return res.status(500).json({
        status: 500,
        error: error?.message ?? "Internal server error."
    })
  }
};

export { deleteImageFromCloudinary };
