const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbCheckIfTargetExist(targetUsername) {
  
  const isTargetUser = await prisma.user.findUnique({
    where: {
      userName: targetUsername
    }
  })
    .then(async (response) => {
        if(response){
            return { message:"User Exist", status:201};
        }
        else{
            return { error:"Target User Does not Exist", status:500};
        }
    })
    .catch((error) => {
        console.log(error)
      return { error: "Something went wrong", status: 500 };
    });
  await prisma.$disconnect();
  return isTargetUser;
}

module.exports = { dbCheckIfTargetExist };
