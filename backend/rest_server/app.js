const path = require("path");
const express = require("express");

require("dotenv").config();

const app = express();

const { authenticationMiddleware } = require("./middlewares/authentication");

const authRoutes = require("./routes/authentication.routes");
const postsRoutes = require("./routes/posts.routes");
const messageRoutes = require("./routes/message.routes");
const notificationRoutes = require("./routes/notification.routes");
const storiesRoutes = require("./routes/stories.routes");
const liveRoutes = require("./routes/live.routes");
const liveInternalRoutes = require("./routes/live.internal.routes");
const usersRoutes = require("./routes/users.routes");
const profileRoutes = require("./routes/profile.routes");
const servicesRoutes = require("./routes/services.routes");
const adminRoutes = require("./routes/admin.routes");
const reportsRoutes = require("./routes/reports.routes");
const appealsRoutes = require("./routes/appeals.routes");
const { proxyStoredMedia } = require("./controller/storage/proxyMedia");

function corsAllowOrigin(origin) {
  if (!origin) return null;
  const extra = String(process.env.FRONTEND_URL || "")
    .trim()
    .replace(/\/$/, "");
  const allowed = new Set([
    "https://pixl-personal-project.online",
    "https://www.pixl-personal-project.online",
    "http://localhost:3000",
    "https://localhost:3000",
  ]);
  if (extra) allowed.add(extra);
  if (allowed.has(origin)) return origin;
  try {
    const host = new URL(origin).hostname;
    if (
      host === "pixl-personal-project.online" ||
      host.endsWith(".pixl-personal-project.online")
    ) {
      return origin;
    }
  } catch {
    return null;
  }
  return null;
}

// ================= CORS (for browser clients) =================
app.use((req, res, next) => {
  const allowOrigin = corsAllowOrigin(req.headers.origin);
  if (allowOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= PUBLIC ROUTES ================= */

app.use(authRoutes);
app.use(notificationRoutes);
app.use(servicesRoutes);
app.use(liveInternalRoutes);
app.use("/storage", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  return proxyStoredMedia(req, res);
});

app.get("/", (req, res) => {
  res.status(200).send("Hi there!!");
});

app.use(
  "/.well-known",
  express.static(path.join(__dirname, "public", ".well-known"))
);

/* ================= AUTH MIDDLEWARE ================= */

app.use(authenticationMiddleware);

/* ================= PROTECTED ROUTES ================= */

app.use("/posts", postsRoutes);
app.use("/message", messageRoutes);
app.use("/stories", storiesRoutes);
app.use("/live", liveRoutes);
app.use("/users", usersRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminRoutes);
app.use("/reports", reportsRoutes);
app.use("/appeals", appealsRoutes);

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  if (err && (err.name === "MulterError" || err.code === "LIMIT_UNEXPECTED_FILE")) {
    return res.status(400).json({
      error: true,
      message: err.message || "Upload error",
      code: err.code,
      field: err.field,
    });
  }

  return next(err);
});

module.exports = app;
