const express = require("express");
const app = express();
const dotenv = require("dotenv");
const dns = require("dns")

dotenv.config();

dns.setServers(['8.8.8.8', '1.1.1.1'])
dotenv.config();

const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const aiRoute = require("./routes/ai");
const commentRoute = require("./routes/comments");

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI;

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
app.options("/{*path}", cors(corsOptions)); // Handle all preflight requests directly

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
    origin: allowedOrigins,
    credentials: true,
  },
});

let onlineUsers = [];

const addNewUser = (username, socketId) => {
  !onlineUsers.some((user) => user.username === username) &&
    onlineUsers.push({ username, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (username) => {
  return onlineUsers.find((user) => user.username === username);
};

io.on("connection", (socket) => {
  // console.log("a user connected");
  
  socket.on("newUser", (username) => {
    addNewUser(username, socket.id);
  });

  socket.on("sendNotification", ({ senderName, senderProfilePicture, receiverName, type, postId }) => {
    const receiver = getUser(receiverName);
    if(receiver) {
      io.to(receiver.socketId).emit("getNotification", {
        senderName,
        senderProfilePicture,
        type,
        postId,
      });
    }
  });

  socket.on("disconnect", () => {
    // console.log("user disconnected");
    removeUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

module.exports = app;