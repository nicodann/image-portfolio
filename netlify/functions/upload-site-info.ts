import { verifyToken } from "@/lib/verifyToken";
import { SiteInfo } from "@/types/types";
import { Handler } from "@netlify/functions";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ARTWORK_PATH = "content/site-info.json";

// HELPERS

async function editGithubSiteInfo(siteInfo: SiteInfo): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo)
    throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO env vars");

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  //GET current file
  const getRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${ARTWORK_PATH}?ref=${branch}`,
    { headers },
  );
  if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);

  const fileData = (await getRes.json()) as {
    content: string;
    sha: string;
  };
  const current: SiteInfo = JSON.parse(
    Buffer.from(fileData.content, "base64").toString("utf-8"),
  );

  const updated = { ...current, ...siteInfo };

  const newContent = Buffer.from(
    JSON.stringify(updated, null, 2) + "\n",
  ).toString("base64");

  // PUT updated file
  const putRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${ARTWORK_PATH}`,
    {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Edit title: ${siteInfo.title}`,
        content: newContent,
        sha: fileData.sha,
        branch,
      }),
    },
  );
  if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status}`);
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // --- Auth ---
  const authHeader =
    event.headers["authorization"] ?? event.headers["Authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "User not logged in: Missing authorization token.",
      }),
    };
  }

  const tokenValid = await verifyToken(token);
  if (!tokenValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "Session expired, please login again: Invalid or expired token",
      }),
    };
  }

  // PARSE
  let parsed: { title: string };
  try {
    parsed = JSON.parse(event.body ?? "{}");
  } catch (err) {
    console.error("Form parse error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Failed to parse form data" }),
    };
  }

  // VALIDATE
  const { title } = parsed;
  if (!title) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing fields",
      }),
    };
  }

  //EDIT SITE INFO FILE on GITHUB
  try {
    await editGithubSiteInfo(parsed);
  } catch (err) {
    console.error("Github error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save siteInfo" }),
    };
  }

  // --- In local dev, also write directly to disk so the Next.js server sees it immediately ---
  if (process.env.NETLIFY_DEV === "true") {
    const localPath = join(process.cwd(), ARTWORK_PATH);
    const current: SiteInfo = JSON.parse(readFileSync(localPath, "utf-8"));
    writeFileSync(
      localPath,
      JSON.stringify({ ...current, ...parsed }, null, 2) + "\n",
    );
  }

  //////////

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  };
};
