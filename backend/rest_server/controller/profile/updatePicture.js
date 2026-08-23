const prisma = require("../../lib/prisma");
const { uploadProfilePicToMinIO } = require("../storage/uploadToMinIO");

exports.updateProfilePictureController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Profile image is required." });
    }

    const profilePic = await uploadProfilePicToMinIO(req.user.id, req.file);
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePic },
      select: {
        id: true,
        userName: true,
        name: true,
        profilePic: true,
      },
    });

    return res.status(200).json({
      message: "Profile picture updated.",
      data: updated,
    });
  } catch (error) {
    console.error("Update profile picture error:", error);
    return res.status(500).json({ message: "Failed to update profile picture." });
  }
};
