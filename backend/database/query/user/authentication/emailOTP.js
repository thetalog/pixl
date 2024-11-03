const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    console.log(error);
    return false;
  }
}
async function getUniqueEmailOTP(email, otp) {
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
        return data
          ? {
              ...data,
              isEmailAlreadyVerified: isUserFound.isEmailVerified,
              name: isUserFound?.name,
              email: isUserFound?.email,
            }
          : false;
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
          email: email,
          otp: parseInt(otp),
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
    return false;
  }
}
module.exports = { createEmailOTP, getUniqueEmailOTP, updateEmailOTP };
