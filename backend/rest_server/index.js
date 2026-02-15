const express = require("express");
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

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= PUBLIC ROUTES ================= */

app.use(authRoutes);
app.use(notificationRoutes);
app.use(servicesRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Hi there!!");
});

app.use("/.well-known", express.static("public/.well-known"));

/* ================= AUTH MIDDLEWARE ================= */

app.use(authenticationMiddleware);

/* ================= PROTECTED ROUTES ================= */

app.use("/posts", postsRoutes);
app.use("/message", messageRoutes);
app.use("/stories", storiesRoutes);
app.use("/live", liveRoutes);
app.use("/users", usersRoutes);
app.use("/profile", profileRoutes);

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================= ERROR HANDLER ================= */

// Make multer errors readable in clients (Flutter/Postman)
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
