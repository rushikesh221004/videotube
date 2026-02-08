import { v2 as cloudinary } from "cloudinary";

const deleteImageFromCloudinary = async (
  publicId,
  resourceType = "image"
) => {
  if (!publicId) return { success: false, reason: "NO_PUBLIC_ID" };

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok") {
      return { success: false, reason: result.result };
    }

    return { success: true };
  } catch (error) {
    return { success: false, reason: error.message };
  }
};

export { deleteImageFromCloudinary };
