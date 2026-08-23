const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

module.exports = globalForPrisma.prisma;
