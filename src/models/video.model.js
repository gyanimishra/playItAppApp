import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    videoFile: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true, // Duration in seconds
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: "https://example.com/default-thumbnail.png", // Default thumbnail URL
    },

    views: {
      type: Number,
      default: 0, // Default view count
    },

    isPublished: {
      type: Boolean,
      default: true, // Default to not published
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", videoSchema);
export default Video;
