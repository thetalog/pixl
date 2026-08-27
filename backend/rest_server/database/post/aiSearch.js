const prisma = require("../../lib/prisma");
const { ProfileVisibility } = require("@prisma/client");

function tokenizeQuery(q) {
  return String(q || "")
    .toLowerCase()
    .split(/[^a-z0-9#]+/i)
    .map((t) => t.replace(/^#/, "").trim())
    .filter((t) => t.length >= 2);
}

function caseVariants(token) {
  const t = String(token || "").toLowerCase();
  if (!t) return [];
  const titled = t.charAt(0).toUpperCase() + t.slice(1);
  return [...new Set([t, titled, t.toUpperCase(), `#${t}`, `#${titled}`])];
}

function scorePost(post, tokens) {
  if (!tokens.length) return 0;
  const hay = [
    post.caption || "",
    ...(post.userTags || []),
    ...(post.systemTags || []),
    ...((post.media || []).flatMap((m) => m.labels || [])),
    typeof post.location === "string"
      ? post.location
      : post.location?.label || post.location?.name || "",
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += 3;
    for (const label of [
      ...(post.userTags || []),
      ...(post.systemTags || []),
      ...((post.media || []).flatMap((m) => m.labels || [])),
    ]) {
      const l = String(label || "").toLowerCase();
      if (l === token) score += 5;
      else if (l.includes(token) || token.includes(l)) score += 2;
    }
  }
  return score;
}

function jaccard(a, b) {
  const A = new Set((a || []).map((x) => String(x).toLowerCase()));
  const B = new Set((b || []).map((x) => String(x).toLowerCase()));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function visibilityWhere(viewerUserId) {
  if (viewerUserId) {
    return {
      OR: [
        { user: { profileVisibility: ProfileVisibility.PUBLIC } },
        { userId: viewerUserId },
      ],
    };
  }
  return { user: { profileVisibility: ProfileVisibility.PUBLIC } };
}

async function findPostsByNaturalLanguage(query, { take = 24, viewerUserId } = {}) {
  const rawQuery = String(query || "").trim();
  const tokens = tokenizeQuery(rawQuery);
  if (!tokens.length) {
    return {
      status: 200,
      data: [],
      message: "Empty query",
      query: rawQuery,
      tokens: [],
    };
  }

  const orFilters = [];
  for (const token of tokens) {
    orFilters.push({ userTags: { has: token } });
    orFilters.push({ systemTags: { has: token } });
    orFilters.push({ media: { some: { labels: { has: token } } } });
    for (const variant of caseVariants(token)) {
      // MongoDB: no `mode: insensitive` — use explicit case variants.
      orFilters.push({ caption: { contains: variant } });
    }
  }

  let candidates = [];
  try {
    candidates = await prisma.post.findMany({
      where: {
        postDisabled: false,
        AND: [visibilityWhere(viewerUserId), { OR: orFilters }],
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            userName: true,
            name: true,
            profilePic: true,
            profileVisibility: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(take * 5, 150),
    });
  } catch (err) {
    console.error("AI search structured query failed, falling back:", err.message);
    candidates = [];
  }

  // Fallback: score recent visible posts in memory (covers private-own + case issues).
  if (!candidates.length) {
    candidates = await prisma.post.findMany({
      where: {
        postDisabled: false,
        ...visibilityWhere(viewerUserId),
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            userName: true,
            name: true,
            profilePic: true,
            profileVisibility: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    });
  }

  const ranked = candidates
    .map((post) => ({ post, score: scorePost(post, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.post.createdAt - a.post.createdAt)
    .slice(0, take)
    .map(({ post, score }) => ({ ...post, _searchScore: score }));

  return {
    status: 200,
    message: "AI image search results",
    data: ranked,
    query: rawQuery,
    tokens,
  };
}

async function findSimilarPostsByLabels(
  labels,
  { excludePostId, take = 24, viewerUserId } = {}
) {
  const clean = [
    ...new Set(
      (labels || [])
        .map((l) => String(l).toLowerCase().trim())
        .filter(Boolean)
    ),
  ];
  if (!clean.length) {
    return { status: 200, data: [], message: "No labels to compare", labels: [] };
  }

  let candidates = [];
  try {
    candidates = await prisma.post.findMany({
      where: {
        postDisabled: false,
        ...(excludePostId ? { id: { not: excludePostId } } : {}),
        AND: [
          visibilityWhere(viewerUserId),
          {
            OR: [
              { media: { some: { labels: { hasSome: clean } } } },
              { systemTags: { hasSome: clean } },
              { userTags: { hasSome: clean } },
            ],
          },
        ],
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            userName: true,
            name: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(take * 5, 150),
    });
  } catch (err) {
    console.error("Similar search query failed, falling back:", err.message);
    candidates = await prisma.post.findMany({
      where: {
        postDisabled: false,
        ...(excludePostId ? { id: { not: excludePostId } } : {}),
        ...visibilityWhere(viewerUserId),
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            userName: true,
            name: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    });
  }

  const ranked = candidates
    .map((post) => {
      const postLabels = [
        ...(post.userTags || []),
        ...(post.systemTags || []),
        ...((post.media || []).flatMap((m) => m.labels || [])),
      ];
      return { post, score: jaccard(clean, postLabels) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map(({ post, score }) => ({
      ...post,
      _similarity: Number(score.toFixed(4)),
    }));

  return {
    status: 200,
    message: "Similar images",
    data: ranked,
    labels: clean,
  };
}

async function getPostLabels(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { media: true },
  });
  if (!post) return null;
  const labels = [
    ...(post.userTags || []),
    ...(post.systemTags || []),
    ...((post.media || []).flatMap((m) => m.labels || [])),
  ];
  return {
    post,
    labels: [...new Set(labels.map((l) => String(l).toLowerCase()))],
  };
}

module.exports = {
  tokenizeQuery,
  findPostsByNaturalLanguage,
  findSimilarPostsByLabels,
  getPostLabels,
  jaccard,
};
