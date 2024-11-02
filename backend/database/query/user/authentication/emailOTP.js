const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function emailOTP(name, email, otp) {
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
      await prisma.emailOTP.create({
        data: {
          email: email,
          name: name,
          otp: parseInt(otp),
        },
      });
      return true;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}
module.exports = { emailOTP };
