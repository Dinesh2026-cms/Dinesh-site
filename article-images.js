// Use in your admin/developer article form.
// HTML:
//   <input type="file" id="img1" accept="image/*">
//   <img id="prev1" style="max-width:100%">
//   <input type="file" id="img2" accept="image/*">
//   <img id="prev2" style="max-width:100%">
//   <label><input type="checkbox" id="featured"> Feature at top of Home</label>

async function resizeToWebp(file, maxSide = 1280, quality = 0.82) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, "image/webp", quality));
}

async function uploadArticleImage(articleId, n, file) {
  const blob = await resizeToWebp(file);
  const r = await fetch(`/api/upload?article=${encodeURIComponent(articleId)}&n=${n}`, {
    method: "POST",
    headers: { "Content-Type": "image/webp" },
    body: blob,
    credentials: "same-origin",
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Upload failed");
  return data.path; // store this in article.images[n-1]
}

// Wire up inputs: call after you know the article id
function bindImageInputs(getArticleId, article) {
  [1, 2].forEach((n) => {
    const input = document.getElementById("img" + n);
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const path = await uploadArticleImage(getArticleId(), n, file);
        article.images = article.images || [];
        article.images[n - 1] = path;
        document.getElementById("prev" + n).src =
          `/api/image?p=${encodeURIComponent(path)}&v=${Date.now()}`;
      } catch (e) { alert(e.message); }
    });
  });
}

// Featured flag: set article.featured = document.getElementById("featured").checked
// Home sorting (put in your Home articles API or front-end):
//   articles.sort((a, b) =>
//     (b.featured === true) - (a.featured === true) ||
//     new Date(b.date) - new Date(a.date));
// Show images: <img src="/api/image?p=${encodeURIComponent(article.images[0])}">
