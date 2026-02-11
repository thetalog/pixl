const express = require("express");
const router = express.Router();

const {
    dbCheckIfTargetExist,
} = require("../../database/query/follow/dbCheckIfTargetExist.js");

const {
    dbApproveIncomingRequest,
} = require("../../database/query/follow/dbApproveIncomingRequest.js");

// ✅ Approve incoming follow request
router.post("/approve-incoming-follow-request", async (req, res) => {
    try {
        const { targetUsername } = req.body; // ✅ better for POST

        if (!targetUsername) {
            return res.status(400).json({
                error: true,
                message: "targetUsername is required",
                status: 400,
            });
        }

        const checkIfTargetExist = await dbCheckIfTargetExist(targetUsername);

        if (checkIfTargetExist?.error) {
            return res.status(checkIfTargetExist.status || 400).json(checkIfTargetExist);
        }

        const result = await dbApproveIncomingRequest(req.user, targetUsername);

        return res.status(result.status || 200).json(result);
    } catch (error) {
        console.log("approve-incoming-follow-request error:", error);
        return res.status(500).json({
            error: true,
            message: "Something went wrong.",
            status: 500,
        });
    }
});

module.exports = router;
