const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: String,
      required: true,
      index: true,
    },
    receiverName: {
      type: String,
      default: "",
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderProfilePicture: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["like", "comment", "reply", "follow"],
      required: true,
    },
    postId: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
