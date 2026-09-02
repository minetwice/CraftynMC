# FearLauncher Network — Skin/Auth/Coins Server

A free-to-run backend that gives your launcher its own login system, custom
skins that actually show up **in-game**, a coins wallet, and the foundation
for a cosmetics system — all compatible with `authlib-injector`, the same
mechanism Ely.by uses.

## What this does

- **Website** (`public/index.html`) — register, login, upload a skin (classic/slim), see your coin balance.
- **Yggdrasil / authlib-injector API** — the actual protocol Minecraft speaks to fetch your skin. This is what makes the skin show up in the real game, not just the website.
- **Coins** — every new account starts with 100 coins, balance + transaction history endpoints ready.
- **Cosmetics (foundation only)** — a `cosmetics` list + equip/unequip API is built into each account. ⚠️ Important: vanilla Minecraft **cannot render** cosmetics like hats/wings — only skin + cape. To actually show cosmetics in-game you'll eventually need a small Fabric/Forge client mod that renders them; that's a separate project from this server.

## 1. Free MongoDB database (5 min)

1. Go to https://cloud.mongodb.com and create a free account.
2. Create a free "M0" cluster (no credit card needed).
3. Database Access → add a user with a username/password.
4. Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0) — fine for a small free project.
5. Database → Connect → Drivers → copy the connection string, looks like:
   `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Add `/fearlauncher` before the `?` so it targets a database name, e.g.
   `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/fearlauncher?retryWrites=true&w=majority`

## 2. Free hosting on Render.com (5 min)

1. Push this folder to a GitHub repo (or use Render's "Deploy from a public Git repo" with your own fork).
2. Go to https://render.com → New → Web Service → connect your repo.
3. Settings:
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: **Free**
4. Add environment variables (Render dashboard → Environment):
   - `MONGODB_URI` → the connection string from step 1
   - `JWT_SECRET` → any long random string (e.g. generate one at https://generate-secret.vercel.app/32)
   - `PUBLIC_BASE_URL` → your Render URL once assigned, e.g. `https://fearlauncher-skinserver.onrender.com`
   - `SERVER_NAME` → whatever you want shown as your network's name
5. Deploy. First boot will auto-generate an RSA keypair inside the running instance and print it's ready in the logs.

**Free tier heads-up:** Render's free web services spin down after ~15 minutes idle and take ~30-60s to wake up on the next request. Fine for testing/early users; if it becomes a problem later you can upgrade that one service for a few dollars a month without touching any code.

## 3. Test it

Visit your Render URL in a browser — you should see the login/register page.
Register an account, upload a PNG skin, and you should see it preview immediately.

Check the raw API is alive:
```
curl https://YOUR-URL.onrender.com/
```
should return JSON with a `signaturePublickey` field — that confirms the authlib-injector protocol is live.

## 4. Next step: wiring this into the Android app

This package is the **server only**. To make the launcher app itself log in
against this server (instead of Ely.by/Microsoft/offline) and pull skins from
it automatically at launch, `AuthType.java` and the login screens need a new
"custom" auth type pointed at your `PUBLIC_BASE_URL`, plus `GameRunner.java`
needs to pass your server's URL to the `authlib-injector` javaagent the same
way it already does for Ely.by accounts.

I didn't build that half yet since it touches your Android app rather than
this server — say the word and I'll wire it up next.

## Local testing before deploying

```bash
npm install
cp .env.example .env
# edit .env with your real MONGODB_URI and a JWT_SECRET
npm start
```
Then open http://localhost:3000
