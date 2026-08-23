const prisma = require("../../lib/prisma");

function tagVariants(raw) {
  const tag = String(raw || "").replace(/^#/, "").trim();
  if (!tag) return [];
  const lower = tag.toLowerCase();
  const upper = tag.toUpperCase();
  return Array.from(new Set([
    tag,
    lower,
    upper,
    `#${tag}`,
    `#${lower}`,
  ]));
}

async function findPostsByTag(rawTag) {
  try {
    const variants = tagVariants(rawTag);
    if (!variants.length) {
      return { message: "Tag is required", status: 400, data: [] };
    }

    const tag = String(rawTag || "").replace(/^#/, "").trim();
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { userTags: { hasSome: variants } },
          { systemTags: { hasSome: variants } },
          { caption: { contains: `#${tag}` } },
        ],
      },
      include: {
        media: true,
        user: {
          select: {
            userName: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return {
      message: "Tagged posts fetched successfully",
      status: 200,
      data: posts,
    };
  } catch (error) {
    console.error("findPostsByTag failed:", error);
    return { message: "Failed to fetch tagged posts", status: 500, data: [] };
  }
}

module.exports = { findPostsByTag };
