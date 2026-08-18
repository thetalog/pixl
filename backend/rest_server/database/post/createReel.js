const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

function toMediaType(mimeType) {
  const value = String(mimeType || "").toUpperCase();
  if (value === "VIDEO" || value.startsWith("VIDEO/")) return "VIDEO";
  if (value === "IMAGE" || value.startsWith("IMAGE/")) return "IMAGE";
  return "VIDEO";
}

async function createReelRecord(
  userId,
  musicCredit,
  tags,
  caption,
  taggedUsers,
  files
) {
  try {
    if (!userId || !isObjectId(userId)) {
      return { message: "Invalid userId", status: 400 };
    }

    const filesArray = Array.isArray(files) ? files : files ? [files] : [];
    if (!filesArray.length) {
      return { message: "Reel media required", status: 400 };
    }

    const safeTags = Array.isArray(tags)
      ? tags.filter((tag) => tag && typeof tag === "string")
      : typeof tags === "string" && tags.trim()
        ? [tags.trim()]
        : [];

    const taggedUsernames = Array.isArray(taggedUsers)
      ? taggedUsers.filter((name) => name && typeof name === "string")
      : typeof taggedUsers === "string" && taggedUsers.trim()
        ? [taggedUsers.trim()]
        : [];

    const mentionedUsers = taggedUsernames.length
      ? await prisma.user.findMany({
          where: { userName: { in: taggedUsernames } },
          select: { id: true },
        })
      : [];

    await prisma.reels.create({
      data: {
        caption: caption || " ",
        tags: safeTags,
        taggedUsers: taggedUsernames,
        media: {
          create: filesArray.map((file) => ({
            url: file.url,
            mimeType: toMediaType(file.mimeType),
            thumbnail: file.thumbnail || null,
            musicCredit: musicCredit || null,
          })),
        },
        user: {
          connect: { id: userId },
        },
        ...(mentionedUsers.length > 0 && {
          mentions: {
            create: mentionedUsers.map((u) => ({ userId: u.id })),
          },
        }),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { postsCount: { increment: 1 } },
    });

    return { message: "Reel created Successfully", status: 201 };
  } catch (error) {
    console.error("Error in createReelRecord:", error);
    return { message: "Reel failed", status: 500 };
  }
}

module.exports = { createReelRecord };
