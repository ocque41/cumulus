import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { URL } from "node:url";

import posts from "../src/content/posts.json" with { type: "json" };

const DIST = new URL("../dist/", import.meta.url);
const ORIGIN = "https://cumulush.com";
const template = await readFile(new URL("index.html", DIST), "utf8");
const publishedPosts = posts.filter((post) => post.status === "published");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderDocument({ canonicalPath, description, noIndex = false, title, type = "website" }) {
  const canonical = `${ORIGIN}${canonicalPath}`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const social = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:site_name" content="Cumulus" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
    noIndex ? `<meta name="robots" content="noindex, nofollow" />` : "",
  ].filter(Boolean).join("\n    ");

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${safeDescription}" />`,
    )
    .replace(
      /<!-- route-meta:start -->[\s\S]*?<!-- route-meta:end -->/,
      `<!-- route-meta:start -->\n    ${social}\n    <!-- route-meta:end -->`,
    );
}

async function writeRoute(pathname, document) {
  const relative = pathname === "/" ? "index.html" : join(pathname.slice(1), "index.html");
  const target = new URL(relative, DIST);
  await mkdir(dirname(target.pathname), { recursive: true });
  await writeFile(target, document);
}

const publicRoutes = [
  {
    canonicalPath: "/",
    description: "Cumulus is a public laboratory for evidence-backed field notes on systems, interfaces, operations, and software design.",
    title: "Cumulus lab — Field notes from the build",
  },
  {
    canonicalPath: "/logs",
    description: "Browse every public Cumulus field note, with project filters, first-party evidence limits, and related reading.",
    title: "Log index — Cumulus lab",
  },
  {
    canonicalPath: "/work",
    description: "Explore current Cumulus lab projects, their reviewed public summaries, stated status, and source boundaries.",
    title: "Public work — Cumulus lab",
  },
  {
    canonicalPath: "/privacy",
    description: "How Cumulus handles the email identity and minimal delivery records used for optional new-log notifications.",
    title: "Notification privacy — Cumulus lab",
  },
  ...publishedPosts.map((post) => ({
    canonicalPath: `/logs/${post.slug}`,
    description: post.excerpt,
    title: `${post.title} — Cumulus lab`,
    type: "article",
  })),
];

for (const route of publicRoutes) {
  await writeRoute(route.canonicalPath, renderDocument(route));
}

for (const route of [
  { canonicalPath: "/auth/callback", title: "Notification access — Cumulus lab" },
]) {
  await writeRoute(route.canonicalPath, renderDocument({
    ...route,
    description: "Private notification preference flow for Cumulus readers.",
    noIndex: true,
  }));
}

await writeFile(
  new URL("404.html", DIST),
  renderDocument({
    canonicalPath: "/404",
    description: "The requested Cumulus log could not be found.",
    noIndex: true,
    title: "Not found — Cumulus lab",
  }),
);

await writeFile(
  new URL("robots.txt", DIST),
  `User-agent: *\nAllow: /\nDisallow: /auth/callback\nSitemap: ${ORIGIN}/sitemap.xml\n`,
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes.map(({ canonicalPath }) => `  <url><loc>${ORIGIN}${canonicalPath}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(new URL("sitemap.xml", DIST), sitemap);

console.log(`STATIC_ROUTES_OK ${publicRoutes.length} public routes`);
