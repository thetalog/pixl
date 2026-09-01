const prisma = require("../prisma");

const DEFAULT_FLAGS = [
  { key: "registrations_disabled", description: "Disable new account registration", enabled: false },
  { key: "comments_disabled", description: "Disable new comments", enabled: false },
  { key: "uploads_disabled", description: "Disable media uploads (posts, reels, stories)", enabled: false },
  { key: "livestreaming_disabled", description: "Disable starting new livestreams", enabled: false },
  { key: "maintenance_mode", description: "Block non-staff application traffic", enabled: false },
  { key: "emergency_moderation_mode", description: "Hold new uploads for review before they appear in feeds", enabled: false },
];

let cache = { at: 0, flags: {} };
const TTL_MS = 5000;

async function ensureFlags() {
  for (const flag of DEFAULT_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
}

async function loadFlags(force = false) {
  if (!force && Date.now() - cache.at < TTL_MS && cache.flags) {
    return cache.flags;
  }
  try {
    const rows = await prisma.featureFlag.findMany();
    const flags = {};
    for (const row of rows) flags[row.key] = Boolean(row.enabled);
    for (const def of DEFAULT_FLAGS) {
      if (flags[def.key] == null) flags[def.key] = def.enabled;
    }
    cache = { at: Date.now(), flags };
    return flags;
  } catch (error) {
    console.warn("[flags] load failed, using safe defaults:", error.message);
    const flags = Object.fromEntries(DEFAULT_FLAGS.map((f) => [f.key, f.enabled]));
    cache = { at: Date.now(), flags };
    return flags;
  }
}

function invalidateFlags() {
  cache = { at: 0, flags: {} };
}

async function isFlagEnabled(key) {
  const flags = await loadFlags();
  return Boolean(flags[key]);
}

function assertFlagOff(flags, key, message) {
  if (flags[key]) {
    const err = new Error(message);
    err.status = 403;
    err.code = "FEATURE_DISABLED";
    throw err;
  }
}

module.exports = {
  DEFAULT_FLAGS,
  ensureFlags,
  loadFlags,
  invalidateFlags,
  isFlagEnabled,
  assertFlagOff,
};
