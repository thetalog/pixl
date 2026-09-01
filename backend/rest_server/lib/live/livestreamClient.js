const axios = require("axios");

function baseUrl() {
  return (process.env.LIVESTREAM_SERVICE_URL || "http://localhost:8085").replace(/\/$/, "");
}

function client() {
  return axios.create({
    baseURL: baseUrl(),
    timeout: Number(process.env.LIVESTREAM_TIMEOUT_MS || 8000),
    headers: {
      "X-Internal-Secret":
        process.env.LIVE_INTERNAL_SECRET || "dev-internal-secret-change-me",
      "Content-Type": "application/json",
    },
  });
}

async function createStream(payload) {
  const res = await client().post("/internal/v1/streams", payload);
  return res.data;
}

async function startStream(streamId, actorUserId) {
  const res = await client().post(`/internal/v1/streams/${encodeURIComponent(streamId)}/start`, {
    actorUserId,
  });
  return res.data;
}

async function endStream(streamId, actorUserId) {
  const res = await client().post(`/internal/v1/streams/${encodeURIComponent(streamId)}/end`, {
    actorUserId,
  });
  return res.data;
}

async function forceEndStream(streamId, actorUserId, reason) {
  const res = await client().post(`/internal/v1/streams/${encodeURIComponent(streamId)}/force-end`, {
    actorUserId,
    reason: reason || "platform_moderation",
  });
  return res.data;
}

async function getStream(streamId) {
  const res = await client().get(`/internal/v1/streams/${encodeURIComponent(streamId)}`);
  return res.data;
}

async function joinStream(streamId, payload) {
  const res = await client().post(`/internal/v1/streams/${encodeURIComponent(streamId)}/join`, payload);
  return res.data;
}

async function getViewers(streamId) {
  const res = await client().get(`/internal/v1/streams/${encodeURIComponent(streamId)}/viewers`);
  return res.data;
}

async function listLive() {
  const res = await client().get("/internal/v1/streams");
  return res.data;
}

function unwrapAxios(error) {
  let status = error?.response?.status || 503;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Livestream service unavailable";
  // Java internal 401 must not become a browser logout (Pixl treats 401 as bad login JWT).
  if (status === 401 || status === 403) {
    status = 503;
  }
  const err = new Error(
    message === "Invalid internal secret"
      ? "Livestream service auth failed. Set LIVE_INTERNAL_SECRET in rest_server/.env to match the Java container."
      : message
  );
  err.status = status;
  err.body = error?.response?.data;
  return err;
}

module.exports = {
  baseUrl,
  createStream,
  startStream,
  endStream,
  forceEndStream,
  getStream,
  joinStream,
  getViewers,
  listLive,
  unwrapAxios,
};
