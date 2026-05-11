import { LinkChecker } from "linkinator";
import { spawn } from "node:child_process";

const base = process.env.LEGAL_LINK_BASE ?? "http://127.0.0.1:3000";
const baseHost = new URL(base).host;
const baseHostname = new URL(base).hostname;
const routes = [
  `${base}/es/privacy-policy`,
  `${base}/en/privacy-policy`,
  `${base}/es/terms-of-service`,
  `${base}/en/terms-of-service`,
];

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function canReach(url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function waitForServer(url, attempts = 45, delayMs = 1000) {
  for (let i = 0; i < attempts; i += 1) {
    if (await canReach(url)) {
      return true;
    }
    await wait(delayMs);
  }
  return false;
}

function isLocalBase() {
  return baseHostname === "127.0.0.1" || baseHostname === "localhost";
}

function isSameHostLink(url) {
  try {
    return new URL(url).host === baseHost;
  } catch {
    // Relative URLs are validated against the checked page and should be kept.
    return true;
  }
}

async function checkRoute(url) {
  const checker = new LinkChecker({
    concurrency: 6,
    retry: true,
    timeout: 15000,
  });

  const result = await checker.check({ path: url });
  const broken = result.links.filter((link) => link.state === "BROKEN" && isSameHostLink(link.url));
  const externalBroken = result.links.filter((link) => link.state === "BROKEN" && !isSameHostLink(link.url));

  if (broken.length > 0) {
    console.error(`Broken links detected on ${url}:`);
    for (const issue of broken) {
      console.error(` - ${issue.url} (${issue.status})`);
    }
    throw new Error(`Broken links found on ${url}`);
  }

  if (externalBroken.length > 0) {
    console.log(`ℹ Skipped ${externalBroken.length} external broken links on ${url}`);
  }

  console.log(`✔ Links healthy on ${url}`);
}

async function main() {
  let devServer;
  try {
    if (isLocalBase() && !(await canReach(base))) {
      devServer = spawn("npm", ["run", "dev"], {
        stdio: "ignore",
        env: process.env,
      });

      const serverReady = await waitForServer(base);
      if (!serverReady) {
        throw new Error(`Unable to reach local server at ${base} for legal link checks`);
      }
    }

    for (const route of routes) {
      await checkRoute(route);
    }
  } finally {
    if (devServer) {
      devServer.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
