const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// REGISTER ROUTER
router.post("/register", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password || !username) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        // GENERATE NEW PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // CREATE NEW USER
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            dob: req.body.dob || "",
            profilePicture: req.body.profilePicture || "",
        });

        // SAVE USER AND RESPOND
        const user = await newUser.save();
        res.status(200).json(user);
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: err.message || "Registration failed" });
    }
});

// LOGIN ROUTER
router.post("/login", async (req, res) => {
    try {
        const rawEmail = (req.body.email || "").trim();
        const password = req.body.password;

        if (!rawEmail || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Case-insensitive email lookup
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${rawEmail}$`, "i") }
        });

        if (!user) {
            return res.status(400).json({ message: "No account found with this email." });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: "Incorrect password. Please try again." });
        }

        return res.status(200).json(user);
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: err.message || "Server error" });
    }
});


module.exports = router;