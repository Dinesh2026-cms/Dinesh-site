// GET /api/image?p=images/articles/<id>-<n>.webp
const OWNER = "Dinesh2026-cms", REPO = "Dinesh-data", BRANCH = "main";

export async function onRequestGet({ request, env }) {
  const p = new URL(request.url).searchParams.get("p") || "";
  if (!/^images\/articles\/[a-zA-Z0-9_-]{1,64}-[12]\.webp$/.test(p))
    return new Response("Not found", { status: 404 });

  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${p}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "dinesh-site",
        Accept: "application/vnd.github.raw+json",
      },
    }
  );
  if (!r.ok) return new Response("Not found", { status: 404 });

  return new Response(r.body, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
