const router = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcrypt");

// UPDATE USER
router.put("/:id", async (req, res) => {
    if (req.body.userId == req.params.id || req.body.isAdmin) {
        if (req.body.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            } catch (err) {
                return res.status(500).json(err);
                console.log(err)
            }
        }

        try {
            const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body })
            res.status(200).json("Account has been updated")
        } catch (err) {
            return res.status(500).json(err);
            console.log(err)
        }
    } else {
        return res.status(403).json("You can update only your account!")
    }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
    if (req.body.userId == req.params.id || req.body.isAdmin) {
        if (req.body.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            } catch (err) {
                return res.status(500).json(err);
                console.log(err)
            }
        }

        try {
            const user = await User.findByIdAndDelete({ _id: req.params.id });
            if (!user) {
                return res.status(404).json("User not found");
            }

            res.status(200).json("Account has been deleted");
        } catch (err) {
            return res.status(500).json(err);
            console.log(err)
        }
    } else {
        return res.status(403).json("You can delete only your account!")
    }
});

// GET A USER
router.get("/", async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;
    try {
        if (!userId && !username) {
            return res.status(400).json({ error: "userId or username query parameter is required" });
        }
        const user = userId 
            ? await User.findById(userId) 
            : await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET ALL USERS
router.get("/all", async (req, res) => {
    try {
        const users = await User.find({}, { username: 1, profilePicture: 1, _id: 1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET USER FRIENDS (Legacy - used for Home Rightbar)
router.get("/friends/:userId", async (req, res) => {
    try {
        if (!req.params.userId || req.params.userId === "undefined") {
            return res.status(200).json([]);
        }
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(200).json([]);
        const friends = await Promise.all(
            (user.followings || []).map(friendId => {
                return User.findById(friendId);
            })
        );
        let friendList = [];
        friends.map((friend) => {
            if(friend) {
                const {_id, username, profilePicture, dob } = friend;
                friendList.push({ _id, username, profilePicture, dob });
            }
        })
        res.status(200).json(friendList)
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET USER CONNECTIONS (Followers, Followings, Mutual Friends)
router.get("/connections/:userId", async (req, res) => {
    try {
        if (!req.params.userId || req.params.userId === "undefined") {
            return res.status(200).json({ mutuals: [], followers: [], followings: [] });
        }
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(200).json({ mutuals: [], followers: [], followings: [] });

        const followersIds = user.followers || [];
        const followingsIds = user.followings || [];

        // Mutual Friends (in both)
        const mutualIds = followersIds.filter(id => followingsIds.includes(id));
        // Strict Followers (in followers but not in followings)
        const strictFollowersIds = followersIds.filter(id => !followingsIds.includes(id));
        // Strict Followings (in followings but not in followers)
        const strictFollowingsIds = followingsIds.filter(id => !followersIds.includes(id));

        const getBasicInfo = async (ids) => {
            const users = await Promise.all(ids.map(id => User.findById(id)));
            return users.filter(u => u !== null).map(u => ({ _id: u._id, username: u.username, profilePicture: u.profilePicture }));
        };

        const mutuals = await getBasicInfo(mutualIds);
        const followers = await getBasicInfo(strictFollowersIds);
        const followings = await getBasicInfo(strictFollowingsIds);

        res.status(200).json({ mutuals, followers, followings });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// FOLLOW A USER
router.put("/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (!user || !currentUser) {
                return res.status(404).json({ error: "User not found" });
            }
            if (!user.followers.includes(req.body.userId)) {
                await user.updateOne({ $push: { followers: req.body.userId } });
                await currentUser.updateOne({ $push: { followings: req.params.id } });

                // Create follow notification
                try {
                    const notif = new Notification({
                        receiverId: user._id.toString(),
                        receiverName: user.username,
                        senderId: currentUser._id.toString(),
                        senderName: currentUser.username,
                        senderProfilePicture: currentUser.profilePicture || "",
                        type: "follow",
                        postId: "",
                        text: "started following you.",
                        isRead: false,
                    });
                    await notif.save();

                    const io = req.app.get("io");
                    const getUser = req.app.get("getUser");
                    if (io && getUser) {
                        const onlineReceiver = getUser(user.username);
                        if (onlineReceiver) {
                            io.to(onlineReceiver.socketId).emit("getNotification", {
                                _id: notif._id,
                                id: notif._id,
                                senderId: currentUser._id.toString(),
                                senderName: currentUser.username,
                                senderProfilePicture: currentUser.profilePicture,
                                receiverName: user.username,
                                type: "follow",
                                postId: "",
                                text: "started following you.",
                                createdAt: notif.createdAt,
                                isRead: false,
                            });
                        }
                    }
                } catch (notifErr) {
                    console.error("Failed to create follow notification:", notifErr);
                }

                res.status(200).json("User has been followed");
            } else {
                res.status(403).json("You already follow this user");
            }
        } catch (err) {
            console.error("FOLLOW ERROR:", err);
            return res.status(500).json({ message: err.message });
        }
    } else {
        res.status(403).json("You can't follow yourself");
    }
});

// UNFOLLOW A USER
router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (!user || !currentUser) {
                return res.status(404).json({ error: "User not found" });
            }
            if (user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { followings: req.params.id } });
                res.status(200).json("User has been unfollowed");
            } else {
                res.status(403).json("You don't follow this user");
            }
        } catch (err) {
            console.error("FOLLOW ERROR:", err);
            return res.status(500).json({ message: err.message });
        }
    } else {
        res.status(403).json("You can't unfollow yourself");
    }
});

module.exports = router;