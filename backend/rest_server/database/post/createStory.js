const prisma = require("../../lib/prisma");

async function createStory(
  userId,
  taggedUsers = [],
  files = []
) {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      return { message: "Story media required", status: 400 };
    }

    const file = files[0];

    const taggedUserIds = Array.isArray(taggedUsers)
      ? taggedUsers.filter(
        (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)
      )
      : [];

    const data = {
      user: {
        connect: { id: userId },
      },

      media: {
        create: {
          url: file.url,              // from S3
          mimeType: file.mimeType,    // IMAGE | VIDEO
          thumbnail:
            file.mimeType === "VIDEO" ? file.thumbnail ?? null : null,
        },
      },

      ...(taggedUserIds.length > 0 && {
        mentions: {
          create: taggedUserIds.map((id) => ({ userId: id })),
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

module.exports = { createStory };
