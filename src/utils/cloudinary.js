import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided for upload");
    }
    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto", // Automatically detect the resource type
    });

    console.log("File uploaded successfully:", result.url);
    return result;
  } catch (error) {
    fs.unlinkSync(file); // Clean up the file if it exists
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

export { uploadOnCloudinary };
