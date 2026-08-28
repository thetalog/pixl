const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

function resolveMongoSrv(hostname) {
  const script = `
    const dns = require("node:dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    if (typeof dns.setDefaultResultOrder === "function") dns.setDefaultResultOrder("ipv4first");
    const host = ${JSON.stringify(hostname)};
    Promise.all([
      new Promise((resolve, reject) => dns.resolveSrv("_mongodb._tcp." + host, (err, rec) => err ? reject(err) : resolve(rec))),
      new Promise((resolve) => dns.resolveTxt(host, (err, rec) => resolve(err ? [] : rec))),
    ]).then(([srv, txt]) => {
      process.stdout.write(JSON.stringify({ srv, txt }));
    }).catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    timeout: 8000,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Mongo SRV lookup failed").trim());
  }
  return JSON.parse(result.stdout);
}

function toDirectMongoUrl(raw) {
  if (!raw || !raw.startsWith("mongodb+srv://")) return raw;
  const parsed = new URL(raw.replace(/^mongodb\+srv:\/\//, "https://"));
  const { srv, txt } = resolveMongoSrv(parsed.hostname);
  if (!Array.isArray(srv) || srv.length === 0) {
    throw new Error("Mongo SRV lookup returned no hosts");
  }
  const hosts = srv
    .map((row) => `${String(row.name || "").replace(/\.$/, "")}:${row.port || 27017}`)
    .join(",");
  const user = parsed.username ? decodeURIComponent(parsed.username) : "";
  const pass = parsed.password ? decodeURIComponent(parsed.password) : "";
  const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
  const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/";
  const params = new URLSearchParams(parsed.search);
  for (const chunk of txt.flat()) {
    const text = String(chunk || "");
    for (const part of text.split("&")) {
      if (!part || !part.includes("=")) continue;
      const [key, ...rest] = part.split("=");
      if (!params.has(key)) params.set(key, rest.join("="));
    }
  }
  params.set("tls", "true");
  return `mongodb://${auth}${hosts}${path}?${params.toString()}`;
}

if (!globalForPrisma.prisma) {
  try {
    const rewritten = toDirectMongoUrl(process.env.DATABASE_URL);
    if (rewritten && rewritten !== process.env.DATABASE_URL) {
      process.env.DATABASE_URL = rewritten;
    }
  } catch (error) {
    console.error("[prisma] mongodb+srv rewrite failed, using original DATABASE_URL:", error.message);
  }
  globalForPrisma.prisma = new PrismaClient();
}

module.exports = globalForPrisma.prisma;
