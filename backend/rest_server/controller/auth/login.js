const crypto = require("crypto");
const { signJWT } = require("../jwt");

const { getUserByEmailAndPassword } = require("../../database/auth/user");
const { createLogin } = require("../../database/auth/login");
const { loginSchema } = require("./validator");
const prisma = require("../../lib/prisma");
const { isStaff } = require("../../lib/admin/authorize");
const { writeAudit } = require("../../lib/admin/audit");

async function auditLogin(...args) {
  try {
    await createLogin(...args);
  } catch (err) {
    console.error("login audit skipped:", err.message || err);
  }
}

exports.loginController = async (req, res) => {
  try {
    const bodyValidation = loginSchema.validate(req.body || {});
    if (bodyValidation.error) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed! Check email and password.",
      });
    }

    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");
    const IPAddress = String(req.headers?.["x-forwarded-for"] || req.ip || req.headers?.host || "unknown");

    const hashedPassword = crypto
      .createHash("sha3-512")
      .update(password)
      .digest("hex");

    const dbResponse = await getUserByEmailAndPassword(email, hashedPassword);

    if (!dbResponse || dbResponse.error) {
      await auditLogin(
        email,
        null,
        hashedPassword,
        false,
        IPAddress,
        "Invalid email or password."
      );

      return res.status(401).json({
        status: 401,
        message: "Invalid email or password.",
      });
    }

    const jwtResponse = await signJWT(
      dbResponse.email || email,
      dbResponse.name,
      dbResponse.userName,
      { sid: dbResponse.sessionVersion || 0 }
    );

    if (jwtResponse.status !== 201 || !jwtResponse.data) {
      await auditLogin(
        email,
        dbResponse.id,
        hashedPassword,
        true,
        IPAddress,
        "Failed to create session."
      );

      return res.status(500).json({
        status: 500,
        message: "Failed to create session. Try again.",
      });
    }

    await auditLogin(
      email,
      dbResponse.id,
      hashedPassword,
      true,
      IPAddress,
      "Login successful!"
    );

    prisma.user.update({
      where: { id: dbResponse.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    if (isStaff(dbResponse)) {
      writeAudit({
        actor: dbResponse,
        action: "STAFF_LOGIN",
        targetType: "USER",
        targetId: dbResponse.id,
        req: { headers: req.headers, ip: req.ip, requestId: req.headers["x-request-id"] },
      }).catch(() => {});
    }

    return res.status(200).json({
      status: 200,
      message: "Login successful!",
      data: jwtResponse.data,
      userName: dbResponse.userName,
      roleKey: dbResponse.roleKey || "USER",
      accountStatus: dbResponse.accountStatus || "ACTIVE",
    });
  } catch (error) {
    console.error("loginController error:", error);
    return res.status(500).json({
      status: 500,
      message: error?.message || "Internal server error",
    });
  }
};
