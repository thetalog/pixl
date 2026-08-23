const prisma = require("../../lib/prisma");

const userSelect = {
  id: true,
  userName: true,
  name: true,
  profilePic: true,
};

async function getFollowersByUsername(username) {
  try {
    const profile = await prisma.user.findUnique({
      where: { userName: username },
      select: { id: true },
    });
    if (!profile) return { status: 404, message: "User not found.", data: [] };

    const rows = await prisma.follow.findMany({
      where: { targetId: profile.id },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });

    return {
      status: 200,
      message: "Followers fetched successfully",
      data: rows.map((row) => row.user).filter(Boolean),
    };
  } catch (error) {
    console.error("getFollowersByUsername failed:", error);
    return { status: 500, message: "Failed to fetch followers", data: [] };
  }
}

async function getFollowingByUsername(username) {
  try {
    const profile = await prisma.user.findUnique({
      where: { userName: username },
      select: { id: true },
    });
    if (!profile) return { status: 404, message: "User not found.", data: [] };

    const rows = await prisma.follow.findMany({
      where: { userId: profile.id },
      include: { target: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });

    return {
      status: 200,
      message: "Following fetched successfully",
      data: rows.map((row) => row.target).filter(Boolean),
    };
  } catch (error) {
    console.error("getFollowingByUsername failed:", error);
    return { status: 500, message: "Failed to fetch following", data: [] };
  }
}

module.exports = { getFollowersByUsername, getFollowingByUsername };
