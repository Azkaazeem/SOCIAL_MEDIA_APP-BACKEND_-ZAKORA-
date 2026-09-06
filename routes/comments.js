const router = require("express").Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// CREATE COMMENT OR REPLY
router.post("/", async (req, res) => {
  const { postId, userId, username, userProfilePicture, text, parentId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required to comment" });
  }
  if (!postId || !text || text.trim() === "") {
    return res.status(400).json({ error: "Post ID and comment text are required" });
  }

  try {
    const newComment = new Comment({
      postId,
      userId,
      username: username || "User",
      userProfilePicture: userProfilePicture || "",
      text: text.trim(),
      parentId: parentId || null,
      likes: [],
    });

    const savedComment = await newComment.save();

    // Create notification for post owner or parent comment author
    try {
      let receiverUserId = null;
      let notifType = "comment";
      let notifText = "commented on your post.";

      if (parentId) {
        // Reply to a comment
        const parentComment = await Comment.findById(parentId);
        if (parentComment) {
          receiverUserId = parentComment.userId;
          notifType = "reply";
          notifText = "replied to your comment.";
        }
      } else {
        // Top-level comment on post
        const post = await Post.findById(postId);
        if (post) {
          receiverUserId = post.userId;
        }
      }

      if (receiverUserId && receiverUserId.toString() !== userId.toString()) {
        const receiver = await User.findById(receiverUserId);
        const sender = await User.findById(userId);
        if (receiver && sender) {
          const notif = new Notification({
            receiverId: receiver._id.toString(),
            receiverName: receiver.username,
            senderId: sender._id.toString(),
            senderName: sender.username,
            senderProfilePicture: sender.profilePicture || "",
            type: notifType,
            postId: postId.toString(),
            text: notifText,
            isRead: false,
          });
          await notif.save();

          const io = req.app.get("io");
          const getUser = req.app.get("getUser");
          if (io && getUser) {
            const onlineReceiver = getUser(receiver.username);
            if (onlineReceiver) {
              io.to(onlineReceiver.socketId).emit("getNotification", {
                _id: notif._id,
                id: notif._id,
                senderId: sender._id.toString(),
                senderName: sender.username,
                senderProfilePicture: sender.profilePicture,
                receiverName: receiver.username,
                type: notifType,
                postId: postId.toString(),
                text: notifText,
                createdAt: notif.createdAt,
                isRead: false,
              });
            }
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to generate comment notification:", notifErr);
    }

    res.status(200).json(savedComment);
  } catch (err) {
    console.error("Failed to create comment:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL COMMENTS FOR A POST
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    res.status(500).json({ error: err.message });
  }
});

// LIKE / UNLIKE A COMMENT
router.put("/:id/like", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required to like a comment" });
  }

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (!comment.likes.includes(userId)) {
      await comment.updateOne({ $push: { likes: userId } });
      res.status(200).json({ message: "Comment liked", liked: true });
    } else {
      await comment.updateOne({ $pull: { likes: userId } });
      res.status(200).json({ message: "Comment unliked", liked: false });
    }
  } catch (err) {
    console.error("Failed to like comment:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE A COMMENT
router.delete("/:id", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId === userId) {
      // If it's a parent comment, delete its replies too
      if (!comment.parentId) {
        await Comment.deleteMany({ parentId: comment._id.toString() });
      }
      await comment.deleteOne();
      res.status(200).json({ message: "Comment has been deleted" });
    } else {
      res.status(403).json({ error: "You can delete only your own comment!" });
    }
  } catch (err) {
    console.error("Failed to delete comment:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
