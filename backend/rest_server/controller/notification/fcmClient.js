const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");

const PROJECT_ID = "pixl-caf6b"; // your Firebase project id

const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    // OR omit keyFile if running on GCP
});

async function sendFCM({ token, title, body, data = {} }) {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    const payload = {
        message: {
            token,
            notification: {
                title,
                body,
            },
            data,
        },
    };

    const res = await axios.post(url, payload, {
        headers: {
            Authorization: `Bearer ${accessToken.token}`,
            "Content-Type": "application/json",
        },
    });

    return res.data;
}

module.exports = { sendFCM };
