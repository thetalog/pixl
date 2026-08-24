const { sendGroupMessage } = require("../../../database/message/group/sendMessage");

const {
  uploadGroupMedia,
} = require("../../storage/uploadToS3");

const generateConversationId = require("../../../utils/generateId");

exports.sendGroupMessageController = async (req, res) => {
  try {
    const user = req.user;
    const files = req.files;

    const body = JSON.parse(req.body.postData || "{}");
    const { groupId, message } = body;

    /* ================= VALIDATION ================= */

    if (!groupId) {
      return res.status(400).json({
        message: "groupId is required",
      });
    }

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    /* ================= MEDIA UPLOAD ================= */

    const conversationId = generateConversationId();
    let uploadResults = [];

    if (files?.length) {
      uploadResults = await uploadGroupMedia(
        user?.id,
        conversationId,
        files
      );

      if (!uploadResults || uploadResults.length === 0) {
        return res.status(500).json({
          message: "No files uploaded.",
        });
      }
    }

    /* ================= DATABASE ================= */

    const response = await sendGroupMessage(
      user,
      groupId,
      conversationId,
      message,
      uploadResults
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Group message send failed.",
      });
    }

    /* ================= SUCCESS ================= */

    return res.status(200).json({
      message: "Group message sent successfully.",
    });

  } catch (error) {
    console.error("Send group message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
