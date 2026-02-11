const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsernameExist(req, res) {
    try {
        const { userName } = req.body;
        if (!userName) {
            return res.status(400).json({ message: "Username is required" });
        }

        const user = await prisma.user.findUnique({
            where: { userName: userName },
        });

        if (user) {
            return res.status(200).json({ exists: true, message: "Username already exists" });
        } else {
            return res.status(200).json({ exists: false, message: "Username is available" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { checkUsernameExist };
