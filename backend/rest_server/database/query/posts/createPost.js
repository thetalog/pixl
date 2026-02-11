const { PrismaClient, MediaType } = require("@prisma/client");
const prisma = new PrismaClient();

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

async function dbCreatePost(userId, taggedUsers, location, caption, tags, files) {
  try {
    if (!userId || !isObjectId(userId)) {
      return { message: "Invalid userId", status: 400 };
    }

    console.log("dbCreatePost - tags received:", tags, "type:", typeof tags);

    // taggedUsers now contains usernames (strings), not IDs
    const safeTaggedUsers = Array.isArray(taggedUsers)
      ? taggedUsers.filter((username) => username && typeof username === "string")
      : taggedUsers && typeof taggedUsers === "string"
        ? [taggedUsers]
        : [];

    // Ensure tags is an array
    const safeTags = Array.isArray(tags)
      ? tags.filter((tag) => tag && typeof tag === "string")
      : tags && typeof tags === "string"
        ? [tags]
        : [];

    console.log("dbCreatePost - safeTags after processing:", safeTags);

    const post = await prisma.post.create({
      data: {
        location,
        caption,
        userTags: safeTags,
        taggedUsers: safeTaggedUsers, // Store usernames directly
        media: {
          createMany: {
            data: files.map(file => {
              // Determine media type based on mimeType
              const mediaType = file?.mimeType?.startsWith("video/") ? "VIDEO" : "IMAGE";
              return {
                url: file.url,
                mimeType: mediaType,
                thumbnail: mediaType === "VIDEO" ? file?.thumbnail : ""
              };
            })
          }
        },

        user: {
          connect: { id: userId },
        },
      },
    })

    console.log("Post created:", JSON.stringify(post, null, 2));
    await prisma.user.update({
      where: { id: userId },
      data: {
        postsCount: { increment: 1 },
      },
    });
    return { message: "Post created Successfully", status: 201, post };
  } catch (error) {
    console.error("Error in dbCreatePost:", error);
    return { message: "Post failed", status: 500 };
  }
}

module.exports = { dbCreatePost };
