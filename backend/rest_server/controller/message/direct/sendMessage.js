const {
  dbSendMessage,
} = require("../../../database/query/message/direct/sendMessage");

const {
  uploadDirectMediaToMinIO,
} = require("../../object_storage/uploadFilesToMinIO");

exports.sendDirectMessageController = async (req, res) => {
  try {
    const user = req.user;
    const files = req.files;

    const body = JSON.parse(req.body.postData || "{}");

    const { receiverUsername, message } = body;

    /* ================= VALIDATION ================= */

    if (!receiverUsername) {
      return res.status(400).json({
        message: "Receiver Username is required",
      });
    }

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    /* ================= UPLOAD MEDIA ================= */

    let uploadResults = [];

    if (files?.length) {
      uploadResults = await uploadDirectMediaToMinIO(user?.id, files);

      if (!uploadResults || uploadResults.length === 0) {
        return res.status(500).json({
          message: "No files uploaded.",
        });
      }
    }

    /* ================= DATABASE ================= */

    const response = await dbSendMessage(
      user,
      receiverUsername,
      message,
      uploadResults
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Direct message failed.",
      });
    }

    /* ================= SUCCESS ================= */

    return res.status(200).json({
      message: "Direct message sent successfully.",
    });

  } catch (error) {
    console.error("Send direct message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
