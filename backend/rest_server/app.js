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
const usersRoutes = require("./routes/users.routes");
const profileRoutes = require("./routes/profile.routes");
const servicesRoutes = require("./routes/services.routes");
const { proxyStoredMedia } = require("./controller/storage/proxyMedia");

// ================= CORS (for browser clients) =================
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= PUBLIC ROUTES ================= */

app.use(authRoutes);
app.use(notificationRoutes);
app.use(servicesRoutes);
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
