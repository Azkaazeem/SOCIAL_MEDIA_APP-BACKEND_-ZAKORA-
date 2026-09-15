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

// Fix querySrv ECONNREFUSED on local machines/Windows DNS resolvers
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  // Ignore in environments where setting DNS servers is restricted
}

// MongoDB Connection (Serverless Compatible)
let cachedDb = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (cachedDb) {
    return cachedDb;
  }

  const MONGO_URI = (process.env.MONGO_URL || process.env.MONGO_URI || "").trim();
  if (!MONGO_URI) {
    throw new Error("MONGO_URL is missing in environment variables! Please add MONGO_URL in Vercel Project Settings > Environment Variables.");
  }

  cachedDb = await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("Connected to MongoDB successfully");
  return cachedDb;
};

// Immediate background connect for local and long-running servers
connectDB().catch((err) => console.log("Initial MongoDB connection notice:", err.message));

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

// Signature endpoint for direct Cloudinary uploads (bypasses Vercel 4.5MB serverless limit for large videos)
app.get("/api/upload/signature", (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "social-media-app";
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();

    if (!apiSecret || !apiKey || !cloudName) {
      return res.status(500).json({ error: "Cloudinary is not configured properly in environment variables" });
    }

    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      apiSecret
    );

    res.status(200).json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (err) {
    console.error("Signature generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Diagnostic Health Check Route
app.get("/api/health", async (req, res) => {
  const hasMongoUrl = Boolean(process.env.MONGO_URL || process.env.MONGO_URI);
  const stateCodes = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbState = stateCodes[mongoose.connection.readyState] || mongoose.connection.readyState;
  
  let dbError = null;
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      dbError = e.message;
    }
  }

  res.status(200).json({
    status: "ok",
    hasMongoUrl,
    dbConnected: mongoose.connection.readyState === 1,
    dbState,
    dbError,
    hasCloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

// Database connection middleware for serverless execution
app.use(async (req, res, next) => {
  if (req.path === "/" || req.path === "/api/health") {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
    return res.status(500).json({
      error: "Database connection failed",
      message: err.message,
      tip: !process.env.MONGO_URL && !process.env.MONGO_URI
        ? "MONGO_URL is not set in Vercel Environment Variables. Please add MONGO_URL in Vercel Project Settings."
        : "Make sure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access."
    });
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

    // Deduplication check: prevent duplicate notifications within 5 seconds
    if ((receiverId || receiverName) && (senderId || senderName) && type) {
      try {
        const queryOr = [];
        if (receiverId) queryOr.push({ receiverId: receiverId.toString() });
        if (receiverName) queryOr.push({ receiverName: receiverName });

        const existing = await Notification.findOne({
          $or: queryOr,
          type,
          postId: postId ? postId.toString() : "",
          createdAt: { $gte: new Date(Date.now() - 5000) },
        });

        if (existing) {
          // Already saved/emitted by REST controller or recent socket, ignore duplicate
          return;
        }

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

        const receiver = getUser(receiverName);
        if (receiver) {
          io.to(receiver.socketId).emit("getNotification", {
            _id: notifDoc._id,
            id: notifDoc._id,
            senderId,
            senderName,
            senderProfilePicture,
            receiverName,
            type,
            postId,
            text,
            createdAt: notifDoc.createdAt,
            isRead: false,
          });
        }
      } catch (e) {
        console.error("Socket notification save error:", e);
      }
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n⚠️ Port ${PORT} is already in use by another process!`);
    console.error(`Backend pehle se background me port ${PORT} par chal raha hai.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

module.exports = app;