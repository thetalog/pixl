const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbCreateStories(
  userId,
  taggedUsers = [],
  files = []
) {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      return { message: "Story media required", status: 400 };
    }

    const file = files[0];

    const data = {
      user: {
        connect: { id: userId },
      },

      media: {
        create: {
          url: file.url,              // from MinIO
          mimeType: file.mimeType,    // IMAGE | VIDEO
          thumbnail:
            file.mimeType === "VIDEO" ? file.thumbnail ?? null : null,
        },
      },

      ...(Array.isArray(taggedUsers) && taggedUsers.length > 0 && {
        mentions: {
          createMany: {
            data: taggedUsers.map((id) => ({ userId: id })),
          },
        },
      }),
    };

    await prisma.stories.create({ data });

    return { error: false, message: "Story created successfully", status: 201 };
  } catch (error) {
    console.error(error);
    return { error: true, message: "Story creation failed", status: 500 };
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { dbCreateStories };
