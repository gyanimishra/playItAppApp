import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: 'dhnx7ksxa',
  api_key: 583812445671391,
  api_secret:'ljkyVNqj8U-wgRUowt_KapnUZW8',
});

// const uploadOnCloudinary = async (file) => {
//   try {
//     if (!file) {
//       throw new Error("No file provided for upload");
//     }
//     const result = await cloudinary.uploader.upload(file, {
//       resource_type: "auto", // Automatically detect the resource type
//     });

//     console.log("File uploaded successfully:", result.url);
//     return result;
//   } catch (error) {
//     fs.unlinkSync(file); // Clean up the file if it exists
//     console.error("Error uploading to Cloudinary:", error);
//     throw error;
//   }
// };
const uploadOnCloudinary = async (file) => {
  try {
    if (!file) {
       throw new Error("No file provided for upload");
       
        throw new Error("No file provided for upload");
    }

    // Check if the file exists locally
    if (!fs.existsSync(file)) {
      throw new Error("File does not exist locally");
    }

    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });

    console.log("File uploaded successfully:", result.url);
    
    // Delete the local file after successful upload
    fs.unlinkSync(file);
    return result;
  } catch (error) {
    // Only delete if the file exists and is valid
    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    console.error("Error uploading to Cloudinary:", error);
    return null; // Return null instead of throwing to handle gracefully
  }
};

export { uploadOnCloudinary };
