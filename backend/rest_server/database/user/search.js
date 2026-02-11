const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getUserByUsername(user, username) {
  try {
    const response = await prisma.user.findUnique({
      where: {
        userName: username,
      },
      omit: {
        password: true
      },// Exclude password field
      include: {
        posts: {
          include: {
            media: true,
            comments: {
              include: {
                user: true,
              },
            },
            reactions: true
          }
        },
        reels: {
          include: {
            media: true,
            reactions: true
          }
        },
        stories: {
          include: {
            media: true,
            reactions: true
          }
        },
      },
    });
    const followers = await prisma.follow.findMany({
      where: {
        targetId: response.id
      }
    });
    const following = await prisma.follow.findMany({
      where: {
        userId: response.id
      }
    });
    const isFollowed = await prisma.follow.findFirst({
      where: {
        userId: user.id,
        targetId: response.id
      }
    });
    response.followersCount = followers.length;
    response.followingCount = following.length;
    response.isFollowed = isFollowed ? true : false;

    return response;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function searchUsers(searchQuery) {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            userName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      omit: {
        password: true
      },// Exclude password field
      include: {
        posts: {
          include: {
            media: true,
            comments: {
              include: {
                user: true,
              },
            },
            reactions: true
          }
        },
        reels: {
          include: {
            media: true,
            reactions: true
          }
        },
        stories: {
          include: {
            media: true,
            reactions: true
          }
        }
      },
    });

    // Map to add default profilePic if it doesn't exist
    const usersWithPic = users.map(user => ({
      ...user,
      profilePic: user.profilePic || "https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y"
    }));

    return usersWithPic;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

module.exports = { getUserByUsername, searchUsers };