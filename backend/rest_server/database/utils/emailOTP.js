const prisma = require("../../lib/prisma");

async function createEmailOTP(name, email, otp) {
  try {
    const isUserFound = await prisma.user
      .findUnique({
        where: {
          email: email,
        },
      })
      .then((data) => (data ? data : false));
    if (isUserFound) {
      await prisma.emailOTP.create({
        data: {
          email: email,
          name: name,
          otp: parseInt(otp),
          userID: isUserFound?.id,
        },
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("createEmailOTP failed:", error);
    return false;
  }
}
async function getEmailOTP(email, otp) {
  try {
    const isUserFound = await prisma.user
      .findUnique({
        where: {
          email: email,
        },
      })
      .then((data) => (data ? data : false));
    return await prisma.emailOTP
      .findFirst({
        where: {
          email: email,
          otp: parseInt(otp),
        },
      })
      .then((data) => {
        if (!data || !isUserFound) return false;
        return {
          ...data,
          isEmailAlreadyVerified: isUserFound.isEmailVerified,
          name: isUserFound.name,
          email: isUserFound.email,
          userName: isUserFound.userName,
        };
      });
  } catch (error) {
    console.log(error);
    return false;
  }
}
async function updateEmailOTP(emailOTPID, email, otp, emailVerifiedAt) {
  try {
    const transactionResponse = await prisma.$transaction([
      prisma.emailOTP.update({
        where: {
          id: emailOTPID,
        },
        data: {
          isVerified: true,
          emailVerifiedAt: emailVerifiedAt,
        },
      }),
      prisma.user.update({
        where: {
          email: email,
        },
        data: {
          isEmailVerified: true,
        },
      }),
    ]);
    return transactionResponse.length > 0 ? true : false;
  } catch (error) {
    console.error("updateEmailOTP failed:", error);
    return false;
  }
}
module.exports = { createEmailOTP, getEmailOTP, updateEmailOTP };
