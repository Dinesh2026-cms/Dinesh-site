# Dinesh Rajbanshi website: phone setup guide (everything stored in GitHub)

No database is needed. Your photos AND all text (articles, discussion messages, bookings, contact messages, About) are saved as files inside ONE private GitHub repo called `farming-data`.

You have 3 files:

| File | What to do with it |
|---|---|
| `public-site.js` | Upload to GitHub repo `farming-public` (the public website) |
| `admin-site.js` | Upload to GitHub repo `farming-admin` (developer login website) |
| `SETUP-GUIDE.md` | This guide |

Do not rename or edit the two site files.

## 1. GitHub (10 min)
1. github.com > **+ > New repository**. Make these three, each with **Add a README** ticked:
   - `farming-data` : choose **Private** (it will hold phone numbers of people who book, so it must be private)
   - `farming-public` : Public or Private
   - `farming-admin` : Public or Private
2. Open `farming-public` > **Add file > Upload files** > choose `public-site.js` > **Commit changes**.
3. Open `farming-admin` > **Add file > Upload files** > choose `admin-site.js` > **Commit changes**.
4. Make the access token: GitHub profile photo > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
   - Repository access: **Only select repositories > farming-data**
   - Repository permissions: **Contents = Read and write**
   - Generate, copy the token (starts with `github_pat_`). You only see it once, so paste it into a note.

## 2. Public website (Cloudflare Worker)
Cloudflare's new screen creates a "Worker" (not a "Pages" project). That is fine: our file is a Worker.
1. dash.cloudflare.com > **Workers & Pages > Create > Import a repository** (Git) > pick `farming-public`.
2. Project name: `farming-public`. Production branch: `main`.
3. Build settings (open the advanced / build section):
   - Build command: leave EMPTY
   - Deploy command (replace what is there):
     `npx wrangler deploy public-site.js --name farming-public --compatibility-date 2025-09-01 --keep-vars`
   - Root directory: `/`
4. **Deploy.** It should end with "Deployed farming-public".
5. Open the Worker > **Settings > Variables and secrets > Add** (these are NOT the "Build variables"):
   - `GH_REPO` : `YOURGITHUBUSERNAME/farming-data`  (use type **Secret** so it is never wiped)
   - `GH_TOKEN` : the `github_pat_...` token (type **Secret**)
   Save and deploy.
6. **Settings > Domains & Routes > Add > Custom domain**: `dineshrajbanshi.com.np`.

## 3. Admin (developer) website (Cloudflare Worker)
1. Same again: **Create > Import a repository** > `farming-admin`, project name `farming-admin`.
2. Build command EMPTY. Deploy command:
   `npx wrangler deploy admin-site.js --name farming-admin --compatibility-date 2025-09-01 --keep-vars`
3. After it deploys: **Settings > Variables and secrets > Add**, all type **Secret**:
   - `ADMIN_PASSWORD` : your own strong password (12+ characters). This is your developer login.
   - `GH_TOKEN` : the same `github_pat_...` token
   - `GH_REPO` : `YOURGITHUBUSERNAME/farming-data`
4. **Settings > Domains & Routes > Add > Custom domain**: `admin.dineshrajbanshi.com.np`.

If you named a Worker something other than `farming-public` / `farming-admin`, put that exact name after `--name`.

## 4. First use
Open admin.dineshrajbanshi.com.np, log in, go to **Profile** to upload your photo and write About, then write your first article. Delete the sample "Welcome" article if you like.

## Where is my data?
Open your `farming-data` repo on GitHub:
- `img/` : all uploaded photos
- `data/articles.json`, `classes.json`, `posts.json` (discussion), `bookings.json`, `messages.json`, `settings.json` (About/Contact text)
You can read or download them any time. That is your backup.

## Things to know about GitHub-only storage
- **Short delay:** a new post, article or booking can take up to about 15 seconds to appear for other visitors. The person who posted sees it at once. The admin site always shows the latest.
- **Every save is a GitHub commit.** Two people saving at the same moment are handled automatically (the second one retries).
- **Size:** it is made for a small or medium site (hundreds of articles, thousands of messages). If it grows very large, a database would be better later.
- **Keep the token safe:** if you ever think it leaked, delete it on GitHub, make a new one and update `GH_TOKEN` in both Cloudflare projects.
- **Password limit:** the "6 wrong tries" lock is best-effort. Use a long password.
- **.com.np domain:** its nameservers must point to Cloudflare. If Cloudflare shows "pending", change the nameservers at your .np registrar to the two Cloudflare gives you.
- **Payments:** a booking records the request and shows your payment instructions (edit them in Profile). Online payment can be added later.
- **Listen button:** uses the phone's built-in speech engine (Google voices on Android Chrome). Nepali needs "Speech Services by Google" with Nepali installed.
- **If the deploy fails** with "entry-point not found": the file in the repo must be named exactly `public-site.js` (or `admin-site.js`) and the deploy command must match.
- **Changing the password:** edit the `ADMIN_PASSWORD` secret, then deploy again.
