const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const {
  createEmailOTP,
  getUniqueEmailOTP,
  updateEmailOTP,
} = require("../database/query/user/authentication/emailOTP");
dotenv.config();
const { signJWT } = require("./jwt");

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
    const dbResponse = await createEmailOTP(name, email, OTP);
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

async function verifyOTP({ email, otp }) {
  try {
    const dbResponse = await getUniqueEmailOTP(email, otp);
    if (!dbResponse) return { message: "Wrong OTP!", status: 400 };
    if (dbResponse.isEmailAlreadyVerified)
      return { message: "Email already verified!", status: 400 };
    const dateDuringOTPCreation = dbResponse.createAt.getDate();
    const timeDuringOTPCreation = Math.round(
      dbResponse.createAt.getTime() / 1000 / 60
    );
    const todayDate = new Date().getDate();
    const todayTime = Math.round(new Date().getTime() / 1000 / 60);
    if (
      dateDuringOTPCreation === todayDate &&
      timeDuringOTPCreation + 5 <= todayTime
    ) {
      return { message: "OTP Timeout", status: 400 };
    } else {
      if (parseInt(otp) !== dbResponse.otp)
        return { message: "Wrong OTP!", status: 400 };
      const response = await updateEmailOTP(
        dbResponse.id,
        email,
        otp,
        new Date().toISOString().replace("Z", "+00:00")
      );

      const jwtResponse = await signJWT(dbResponse?.email, dbResponse?.name);
      if (jwtResponse?.status !== 201)
        return {
          status: 500,
          message: "Something went wrong",
        };
      return {
        message: response,
        status: response ? 200 : 400,
        data: jwtResponse?.data,
      };
    }
  } catch (error) {
    return { message: error?.message, status: 500 };
  }
}
module.exports = { sendOTP, verifyOTP };
