const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");

// Load .env reliably from the backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const multer = require("multer");

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const aiRoute = require("./routes/ai");
const commentRoute = require("./routes/comments");
const notificationRoute = require("./routes/notifications");
const Notification = require("./models/Notification");

// MongoDB Connection
const MONGO_URI = (process.env.MONGO_URL || process.env.MONGO_URI || "").trim();

if (!MONGO_URI) {
  console.error("MONGO_URL is missing in environment variables!");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch((err) => console.log("MongoDB connection error:", err));
}

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS policy violation: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization"
  ]
};

app.use(cors(corsOptions));

// Static files for images
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Middleware
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("common"));

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || "").trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
  timeout: 600000 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-app",
    resource_type: "auto",
  },
});

const upload = multer({ storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json({ url: req.file.path });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/ai", aiRoute);
app.use("/api/comments", commentRoute);
app.use("/api/notifications", notificationRoute);

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend server is running successfully!" });
});

const PORT = process.env.PORT || 8800;

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins (Vercel, localhost, local network, etc.)
      callback(null, true);
    },
    credentials: true,
  },
});

let onlineUsers = [];

const addNewUser = (username, socketId) => {
  if (!username) return;
  // Always update to the latest socketId on reconnect/refresh
  onlineUsers = onlineUsers.filter((user) => user.username.toLowerCase() !== username.toLowerCase());
  onlineUsers.push({ username, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (username) => {
  if (!username) return null;
  return onlineUsers.find((user) => user.username.toLowerCase() === username.toLowerCase());
};

// Expose io and getUser to express routes
app.set("io", io);
app.set("getUser", getUser);

io.on("connection", (socket) => {
  socket.on("newUser", (username) => {
    addNewUser(username, socket.id);
  });

  socket.on("sendNotification", async (data) => {
    const {
      senderId,
      senderName,
      senderProfilePicture,
      receiverId,
      receiverName,
      type,
      postId,
      text,
    } = data;

    // Persist to MongoDB so notifications are never lost
    if ((receiverId || receiverName) && (senderId || senderName) && type) {
      try {
        const notifDoc = new Notification({
          receiverId: receiverId || receiverName,
          receiverName: receiverName || "",
          senderId: senderId || senderName,
          senderName: senderName || "User",
          senderProfilePicture: senderProfilePicture || "",
          type,
          postId: postId || "",
          text: text || "",
          isRead: false,
        });
        await notifDoc.save();
      } catch (e) {
        console.error("Socket notification save error:", e);
      }
    }

    const receiver = getUser(receiverName);
    if (receiver) {
      io.to(receiver.socketId).emit("getNotification", {
        senderId,
        senderName,
        senderProfilePicture,
        receiverName,
        type,
        postId,
        text,
        createdAt: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

module.exports = app;