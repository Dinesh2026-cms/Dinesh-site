# DINESH RAJBANSHI

All data is stored in GitHub only. Cloudflare just runs the site.

Repo 1 (site code, public or private): worker.js, wrangler.toml, _headers, index.html, style.css, app.js, header.webp, README.md

Repo 2 (data): create a PRIVATE repo, e.g. dinesh-data, with a README so it is not empty. The site writes users.json, articles.json, courses.json, lessons.json, topics.json, replies.json, enrollments.json and messages.json there. Git history is your audit log.

GitHub token: Settings > Developer settings > Fine-grained tokens. Only the data repo, permission Contents: Read and write.

Cloudflare: Workers & Pages > Create > connect repo 1. Deploy command: npx wrangler deploy
Worker > Settings > Variables and Secrets, add as Secrets:
- GITHUB_TOKEN
- GITHUB_REPO (yourname/dinesh-data)
- ADMIN_PASSWORD
- SESSION_SECRET (long random text)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- MODERATE_FIRST = 1 (optional)
- GITHUB_BRANCH (optional, default main)

Google Cloud redirect: https://YOUR-DOMAIN/auth/google/callback
Admin login: hidden page /admin
