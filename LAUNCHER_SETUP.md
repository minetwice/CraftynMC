# Launcher Integration & In-Game Skin/Cape Sync Guide

This backend implements a full **Yggdrasil & authlib-injector** compatible skin server. Any skin or cape uploaded through the web dashboard will automatically display in Minecraft **Singleplayer**, **SMP Servers**, and **Multiplayer** without any failures or missing textures.

---

## How It Works

1. **Upload via Dashboard:** When a player uploads or selects a skin/cape on the CraftynMC dashboard, it is saved directly to the database and signed with your server's RSA private key.
2. **Yggdrasil API:** The backend exposes standard Yggdrasil auth endpoints (`/authserver/authenticate`, `/sessionserver/session/minecraft/profile/:uuid`, `/skins/:uuid.png`).
3. **In-Game Rendering:** When the launcher passes the `authlib-injector` Java agent argument to Minecraft, the game fetches texture signatures directly from this server.

---

## 1. Setting Up Any Custom Launcher (PojavLauncher, HMCL, Prism, Custom Launcher)

### A. Authlib-Injector Flag (For PC Launchers / Minecraft Java Edition)
Download the latest `authlib-injector.jar` from [https://github.com/yushijinhun/authlib-injector/releases](https://github.com/yushijinhun/authlib-injector/releases).

Add the following JVM argument when launching Minecraft:
```bash
-javaagent:authlib-injector.jar=http://YOUR-SERVER-DOMAIN.com
```
*(Replace `http://YOUR-SERVER-DOMAIN.com` with your deployed server URL, e.g., `http://localhost:3000` or `https://your-app.onrender.com`)*

### B. Android / Mobile Launcher Integration (e.g. PojavLauncher / Custom App)
In your launcher code or account settings:
- **Auth Type:** Yggdrasil / Custom Auth
- **Auth Server URL:** `http://YOUR-SERVER-DOMAIN.com`
- **Skin URL Template:** `http://YOUR-SERVER-DOMAIN.com/skins/name/{username}.png`

---

## 2. Server-side / SMP Server Setup (Optional for Online Mode Servers)

If you run a dedicated Minecraft SMP server and want skins to render for offline/custom auth players:

1. Install **authlib-injector** or **SkinsRestorer / CustomSkinLoader** on your Minecraft server (Fabric / Forge / Paper / Velocity).
2. For **CustomSkinLoader** (`CustomSkinLoader/ExtraList.json`), add your skin server URL:
```json
{
  "name": "CraftynMC Network",
  "type": "CustomSkinAPI",
  "root": "http://YOUR-SERVER-DOMAIN.com/"
}
```

---

## 3. API Summary Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /` (or `/?json=true`) | GET | Root metadata & RSA Public Key |
| `POST /authserver/authenticate` | POST | Log in player with dashboard credentials |
| `GET /sessionserver/session/minecraft/profile/:uuid` | GET | Delivers signed skin & cape payload to client |
| `GET /skins/:uuid.png` | GET | Direct skin PNG download |
| `GET /skins/:uuid_cape.png` | GET | Direct cape PNG download |
| `GET /skins/name/:username.png` | GET | Avatar icon by username |

With these settings enabled in your launcher, any skin or cape selected on the website will immediately show up in **Singleplayer and SMP** seamlessly!
