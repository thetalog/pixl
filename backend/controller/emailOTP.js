const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { emailOTP } = require("../database/query/user/authentication/emailOTP");
dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
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
    const dbResponse = await emailOTP(name, email, OTP);
    if (!dbResponse) throw Error("Something went wrong!");
    // send mail with defined transport object
    const response = await transporter.sendMail({
      from: process.env.EMAIL_USER, // sender address
      to: email, // list of receivers
      subject: "Hello " + name, // Subject line
      html: `<b>Pixl OTP: ${OTP}</b>`, // html body
    });
    return response.response.startsWith("250");
  } catch (error) {
    return false;
  }
}

module.exports = { sendOTP };
