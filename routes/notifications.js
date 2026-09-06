const router = require("express").Router();
const Notification = require("../models/Notification");

// CREATE NOTIFICATION
router.post("/", async (req, res) => {
  const {
    receiverId,
    receiverName,
    senderId,
    senderName,
    senderProfilePicture,
    type,
    postId,
    text,
  } = req.body;

  if (!receiverId || !senderId || !type) {
    return res.status(400).json({ error: "Missing required notification fields" });
  }

  // Prevent notifying oneself
  if (receiverId === senderId) {
    return res.status(200).json({ message: "Self-notification skipped" });
  }

  try {
    // Prevent spam/duplicate notifications for the same action within 10 seconds
    const existing = await Notification.findOne({
      receiverId,
      senderId,
      type,
      postId: postId || "",
      createdAt: { $gte: new Date(Date.now() - 10 * 1000) },
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const newNotification = new Notification({
      receiverId,
      receiverName: receiverName || "",
      senderId,
      senderName: senderName || "User",
      senderProfilePicture: senderProfilePicture || "",
      type,
      postId: postId || "",
      text: text || "",
      isRead: false,
    });

    const savedNotification = await newNotification.save();
    res.status(200).json(savedNotification);
  } catch (err) {
    console.error("Failed to create notification:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL NOTIFICATIONS FOR A USER
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Query by receiverId OR receiverName (to support both ID-based and username-based lookups)
    const notifications = await Notification.find({
      $or: [{ receiverId: userId }, { receiverName: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: err.message });
  }
});

// MARK SINGLE NOTIFICATION AS READ
router.put("/:id/read", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    res.status(500).json({ error: err.message });
  }
});

// MARK ALL NOTIFICATIONS AS READ FOR A USER
router.put("/read-all/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      {
        $or: [{ receiverId: userId }, { receiverName: userId }],
        isRead: false,
      },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE A NOTIFICATION
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Failed to delete notification:", err);
    res.status(500).json({ error: err.message });
  }
});

// CLEAR ALL NOTIFICATIONS FOR A USER
router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.deleteMany({
      $or: [{ receiverId: userId }, { receiverName: userId }],
    });
    res.status(200).json({ message: "All notifications cleared successfully" });
  } catch (err) {
    console.error("Failed to clear notifications:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
