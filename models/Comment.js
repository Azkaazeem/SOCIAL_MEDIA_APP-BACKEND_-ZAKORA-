const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    userProfilePicture: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      max: 1000,
    },
    likes: {
      type: Array,
      default: [],
    },
    parentId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
