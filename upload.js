// POST /api/upload?article=<id>&n=<1|2>   body: image/webp (binary)
// Saves to Dinesh-data/images/articles/<id>-<n>.webp
const OWNER = "Dinesh2026-cms", REPO = "Dinesh-data", BRANCH = "main";
const MAX_BYTES = 1.5 * 1024 * 1024;

// TODO: replace with your existing admin/developer session check
async function isAdmin(request, env) {
  return false; // must return true only for logged-in admin/developer
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env)))
    return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const article = url.searchParams.get("article") || "";
  const n = url.searchParams.get("n") || "";
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(article) || !["1", "2"].includes(n))
    return json({ error: "Bad article id or image number" }, 400);

  const buf = await request.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > MAX_BYTES)
    return json({ error: "Image empty or over 1.5 MB" }, 413);

  const path = `images/articles/${article}-${n}.webp`;
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "dinesh-site",
    Accept: "application/vnd.github+json",
  };

  // get sha if file exists (needed to overwrite)
  let sha;
  const head = await fetch(`${api}?ref=${BRANCH}`, { headers });
  if (head.ok) sha = (await head.json()).sha;

  const put = await fetch(api, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Upload ${path}`,
      content: toBase64(buf),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!put.ok) return json({ error: "GitHub error", detail: await put.text() }, 502);

  return json({ ok: true, path, url: `/api/image?p=${encodeURIComponent(path)}&v=${Date.now()}` });
}

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
