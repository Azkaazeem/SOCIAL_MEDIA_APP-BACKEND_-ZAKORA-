const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// CREATE POST
router.post("/" , async (req, res) => {
    if (!req.body.userId) {
        return res.status(401).json({ error: "Authentication required to create a post" });
    }
    const newPost = await new Post(req.body);
    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// UPDATE POST
router.put("/:id" , async (req, res) => {
    try {
    const post = await Post.findById(req.params.id);
    if(post.userId === req.body.userId) {
        await post.updateOne({$set: req.body});
        res.status(200).json("The post has been updated");
    } else {
        res.status(403).json("You can update only your post!");
    }
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

// DELETE POST
router.delete("/:id" , async (req, res) => {
    try {
    const post = await Post.findById(req.params.id);
    if(post.userId === req.body.userId) {
        await post.deleteOne({$set: req.body});
        res.status(200).json("The post has been deleted");
    } else {
        res.status(403).json("You can delete only your post!");
    }
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

// LIKE / UNLIKE POST
router.put("/:id/like" , async (req, res) => {
    if (!req.body.userId) {
        return res.status(401).json({ error: "Authentication required to like a post" });
    }
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({$push: { likes: req.body.userId}});

            // Send notification to post owner if liking someone else's post
            if (post.userId && post.userId !== req.body.userId) {
                try {
                    const sender = await User.findById(req.body.userId);
                    const receiver = await User.findById(post.userId);
                    if (sender && receiver) {
                        const notif = new Notification({
                            receiverId: receiver._id.toString(),
                            receiverName: receiver.username,
                            senderId: sender._id.toString(),
                            senderName: sender.username,
                            senderProfilePicture: sender.profilePicture || "",
                            type: "like",
                            postId: post._id.toString(),
                            text: "liked your post.",
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
                                    type: "like",
                                    postId: post._id.toString(),
                                    text: "liked your post.",
                                    createdAt: notif.createdAt,
                                    isRead: false,
                                });
                            }
                        }
                    }
                } catch (notifErr) {
                    console.error("Failed to create like notification:", notifErr);
                }
            }

            res.status(200).json("The post has been liked");
        } else {
            await post.updateOne({$pull: {likes: req.body.userId}});
            res.status(200).json("The post has been disliked");
        }
    } catch (err) {
        res.status(500).json({error: err.message})
    }
});

// GET ALL POSTS
router.get("/all" , async (req , res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

// GET TIMELINE POSTS
router.get("/timeline/:userId" , async (req , res) => {
    try {
        if (!req.params.userId || req.params.userId === "undefined") {
            return res.status(200).json([]);
        }
        const currentUser = await User.findById(req.params.userId);
        if (!currentUser) {
            return res.status(200).json([]);
        }
        const userPost = await Post.find({ userId: currentUser._id });
        const friendPosts = await Promise.all(
            (currentUser.followings || []).map((friendId) => {
                return Post.find({ userId: friendId });
            })
        );
        res.status(200).json(userPost.concat(...friendPosts));
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

// GET A POST
router.get("/:id" , async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

// GET USER'S ALL POSTS
router.get("/profile/:username" , async (req , res) => {
    try {
        const username = req.params.username;
        if (!username || username === "undefined") {
            return res.status(200).json([]);
        }
        // Case-insensitive lookup so funwithme and funWithMe both match
        const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (!user) {
            return res.status(200).json([]);
        }
        const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

module.exports = router;