const prisma = require("../../lib/prisma");

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

function normalizeMediaType(value) {
  const raw = String(value || "").toUpperCase();
  if (raw === "VIDEO" || raw.startsWith("VIDEO/")) return "VIDEO";
  return "IMAGE";
}

function buildMediaRows(files, { withLabels }) {
  return files.map((file) => {
    const mediaType = normalizeMediaType(file?.mimeType);
    const row = {
      url: file.url,
      mimeType: mediaType,
      thumbnail: mediaType === "VIDEO" ? file?.thumbnail || "" : "",
    };
    if (withLabels) {
      row.labels = Array.isArray(file.labels) ? file.labels : [];
      row.labelScores = file.labelScores || {};
    }
    return row;
  });
}

async function createPostRecord(userId, taggedUsers, location, caption, tags, files) {
  try {
    if (!userId || !isObjectId(userId)) {
      return { message: "Invalid userId", status: 400 };
    }

    const safeTaggedUsers = Array.isArray(taggedUsers)
      ? taggedUsers.filter((username) => username && typeof username === "string")
      : taggedUsers && typeof taggedUsers === "string"
        ? [taggedUsers]
        : [];

    const safeTags = Array.isArray(tags)
      ? tags.filter((tag) => tag && typeof tag === "string").map((t) => t.toLowerCase())
      : tags && typeof tags === "string"
        ? [tags.toLowerCase()]
        : [];

    const aiLabels = [
      ...new Set(
        (files || [])
          .flatMap((f) => (Array.isArray(f.labels) ? f.labels : []))
          .map((l) => String(l).toLowerCase().trim())
          .filter(Boolean)
      ),
    ];

    const systemTags = [...new Set([...safeTags, ...aiLabels])];

    const baseData = {
      location,
      caption,
      userTags: safeTags,
      systemTags,
      taggedUsers: safeTaggedUsers,
      user: { connect: { id: userId } },
    };

    let post;
    try {
      post = await prisma.post.create({
        data: {
          ...baseData,
          media: {
            createMany: {
              data: buildMediaRows(files, { withLabels: true }),
            },
          },
        },
      });
    } catch (schemaErr) {
      // Older DB before `npx prisma db push` — retry without Media.labels
      console.warn(
        "createPost with labels failed, retrying without labels:",
        schemaErr.message
      );
      post = await prisma.post.create({
        data: {
          ...baseData,
          media: {
            createMany: {
              data: buildMediaRows(files, { withLabels: false }),
            },
          },
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        postsCount: { increment: 1 },
      },
    });
    return { message: "Post created Successfully", status: 201, post };
  } catch (error) {
    console.error("Error in dbCreatePost:", error);
    return { message: error.message || "Post failed", status: 500 };
  }
}

module.exports = { createPostRecord };
