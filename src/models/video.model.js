import mongoose, { Schema } from "mongoose";
// whith the help of mongooseAggregatePaginate we can write aggrigation queries
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //Cloudnairy url
      required: [true, "Video is required"],
    },
    thumbnail: {
      type: String, //Cloudnairy url
      required: [true, "Video is required"],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //Cloudnairy
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
// we can add our own plugin
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);
