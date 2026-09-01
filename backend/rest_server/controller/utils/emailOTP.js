const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const {
  createEmailOTP,
  getEmailOTP,
  updateEmailOTP,
} = require("../../database/utils/emailOTP");
dotenv.config();
const { signJWT } = require("../jwt");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: String(process.env.EMAIL_SECURE || "").toLowerCase() === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function generateOTP(length = 6) {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sendOTP({ name, email }) {
  try {
    const OTP = generateOTP();
    const dbResponse = await createEmailOTP(name, email, OTP);
    if (!dbResponse) throw Error("Something went wrong!");
    // send mail with defined transport object
    const response = await transporter.sendMail({
      from: process.env.EMAIL_USER, // sender address
      to: email, // list of receivers
      subject: "Hello " + name, // Subject line
      html: `<b>Pixl OTP: ${OTP}</b>`, // html body
    });
    return Boolean(response?.messageId) || String(response?.response || "").startsWith("250");
  } catch (error) {
    console.error("sendOTP failed:", error);
    return false;
  }
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function verifyOTP({ email, otp }) {
  try {
    const dbResponse = await getEmailOTP(email, otp);
    if (!dbResponse) return { message: "Wrong OTP!", status: 400 };
    if (dbResponse.isEmailAlreadyVerified)
      return { message: "Email already verified!", status: 400 };

    const createdAt = toDate(dbResponse.createdAt || dbResponse.createAt);
    if (!createdAt) return { message: "OTP record is invalid.", status: 400 };

    const ageMs = Date.now() - createdAt.getTime();
    if (ageMs > 5 * 60 * 1000) {
      return { message: "OTP expired. Request a new code.", status: 400 };
    }

    if (parseInt(otp, 10) !== dbResponse.otp) {
      return { message: "Wrong OTP!", status: 400 };
    }

    const updated = await updateEmailOTP(
      dbResponse.id,
      email,
      otp,
      new Date().toISOString()
    );
    if (!updated) {
      return { message: "Could not verify OTP.", status: 500 };
    }

    const jwtResponse = await signJWT(
      dbResponse.email,
      dbResponse.name,
      dbResponse.userName,
      { sid: dbResponse.sessionVersion || 0 }
    );
    if (jwtResponse?.status !== 201) {
      return { status: 500, message: "Something went wrong" };
    }

    return {
      message: "OTP verified.",
      status: 200,
      data: jwtResponse.data,
      userName: dbResponse.userName,
    };
  } catch (error) {
    console.error("verifyOTP failed:", error);
    return { message: "OTP failed during verification", status: 500 };
  }
}
module.exports = { sendOTP, verifyOTP };
