const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const connectDB = require("./config/db");
const initEventListeners = require("./events/listeners");
const {
  initSocketManager,
  registerSocket,
  removeSocket,
} = require("./socket/socketManager");
const { Server } = require("socket.io");
const User = require("./models/User");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);

connectDB();
initEventListeners();

// ── CORS ─────────────────────────────────────────────────────────────────────
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");
const configuredOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  "http://localhost:5173",
  "http://localhost:3000",
]);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.has(normalizeOrigin(origin));
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS for sockets"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocketManager(io);

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const user = await User.findById(decoded.id).select("_id");
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    return next();
  } catch (error) {
    return next(new Error("Invalid authentication token"));
  }
});

io.on("connection", (socket) => {
  registerSocket(socket.userId, socket.id);
  console.log(
    `[Socket] Authenticated user ${socket.userId} → socket ${socket.id}`,
  );

  socket.on("disconnect", () => {
    if (socket.userId) {
      removeSocket(socket.userId, socket.id);
    }
    console.log(`[Socket] Socket ${socket.id} disconnected`);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Net-Centric Application Backend Services API",
    timestamp: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", interactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
