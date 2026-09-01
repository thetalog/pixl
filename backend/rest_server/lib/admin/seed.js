const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const crypto = require("crypto");
const prisma = require("../prisma");
const { defaultRoleSeed, DEFAULT_REPORT_CATEGORIES } = require("./permissions");
const { ensureFlags } = require("./flags");

function hashPassword(password) {
  return crypto.createHash("sha3-512").update(String(password)).digest("hex");
}

async function seedRoles() {
  const seeds = defaultRoleSeed();
  for (const role of seeds) {
    const existing = await prisma.role.findUnique({ where: { key: role.key } });
    if (!existing) {
      await prisma.role.create({ data: role });
      continue;
    }
    if (existing.isSystem) {
      await prisma.role.update({
        where: { key: role.key },
        data: {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          rank: role.rank,
          isSystem: true,
        },
      });
    }
  }
}

async function seedSettings() {
  await prisma.systemSetting.upsert({
    where: { key: "report_categories" },
    update: {},
    create: {
      key: "report_categories",
      value: DEFAULT_REPORT_CATEGORIES,
    },
  });
  await prisma.systemSetting.upsert({
    where: { key: "strike_policy" },
    update: {},
    create: {
      key: "strike_policy",
      value: {
        warningLimit: 3,
        strikeLimit: 3,
        autoSuspendAfterStrikes: false,
      },
    },
  });
}

async function ensureStaffAccount({ email, password, userName, name, roleKey }) {
  if (!email) return null;
  let user = await prisma.user.findFirst({ where: { email } });
  const data = { roleKey };
  if (password) data.password = hashPassword(password);
  if (!user) {
    if (!password) {
      console.warn(`[admin] ${roleKey} ${email} does not exist; set a bootstrap password to create it.`);
      return null;
    }
    const taken = await prisma.user.findFirst({ where: { userName } });
    user = await prisma.user.create({
      data: {
        email,
        userName: taken ? `${userName}_${Date.now().toString(36)}` : userName,
        name,
        password: data.password,
        isEmailVerified: true,
        age: 30,
        roleKey,
        accountStatus: "ACTIVE",
      },
    });
    console.info(`[admin] created ${roleKey} ${email}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data,
    });
    console.info(`[admin] ensured ${roleKey} for ${email}`);
  }
  const active = await prisma.staffAssignment.findFirst({
    where: { userId: user.id, roleKey, active: true },
  });
  if (!active) {
    await prisma.staffAssignment.create({
      data: { userId: user.id, roleKey, assignedById: user.id, active: true },
    });
  }
  return user;
}

async function bootstrapSuperAdmin() {
  return ensureStaffAccount({
    email: String(process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase(),
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    userName: process.env.ADMIN_BOOTSTRAP_USERNAME || "pixladmin",
    name: "Pixl Admin",
    roleKey: "SUPER_ADMIN",
  });
}

async function bootstrapModerator() {
  return ensureStaffAccount({
    email: String(process.env.ADMIN_MODERATOR_EMAIL || "").trim().toLowerCase(),
    password: process.env.ADMIN_MODERATOR_PASSWORD,
    userName: process.env.ADMIN_MODERATOR_USERNAME || "pixlmod",
    name: "Pixl Moderator",
    roleKey: "MODERATOR",
  });
}

async function seedAdminSystem() {
  try {
    await seedRoles();
    await ensureFlags();
    await seedSettings();
    await bootstrapSuperAdmin();
    await bootstrapModerator();
  } catch (error) {
    console.error("[admin] seed failed:", error.message || error);
  }
}

module.exports = {
  seedAdminSystem,
  seedRoles,
  bootstrapSuperAdmin,
  bootstrapModerator,
};
