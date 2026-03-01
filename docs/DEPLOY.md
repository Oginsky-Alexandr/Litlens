# SageRead hosting (Render + litlense.com)

This document describes the current deploy and hosting setup. Use it to reproduce the deployment and understand the infrastructure.

---

## Current hosting stack

| Component | Service | Domain / URL |
|-----------|--------|--------------|
| Frontend (React) | Render **Static Site** | https://litlense.com, https://www.litlense.com |
| Backend (Express) | Render **Web Service** | https://sage-read-api.onrender.com |
| Domain, DNS | Reg.ru, **ispmanager** panel | litlense.com |

Repository: **GitHub** `Oginsky-Alexandr/Litlens`, branch **master**. Pushing to master triggers auto-deploy of both services.

---

## Backend (Web Service)

- **Render service:** sage-read-api (Web Service).
- **Repository:** Oginsky-Alexandr/Litlens, branch **master**.
- **Root Directory:** `sage-read-backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Instance Type:** Free (instance spins down when idle; see Cold start below).
- **Environment:**
  - `DEEPSEEK_API_KEY` — DeepSeek API key (set in Render, not in the repo).
- **URL:** https://sage-read-api.onrender.com

Optionally, you can add **api.litlense.com** via Custom Domains (CNAME in DNS). Not required for the app to work.

---

## Frontend (Static Site)

- **Render service:** sage-read-app (Static Site).
- **Repository:** Oginsky-Alexandr/Litlens, branch **master**.
- **Root Directory:** `sage-read-app`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`
- **Environment:**
  - `REACT_APP_API_URL` — API base URL. Currently: `https://sage-read-api.onrender.com`. If you add api.litlense.com to the Web Service, you can set this to `https://api.litlense.com` and run Manual Deploy.
- **Custom Domains:** litlense.com, www.litlense.com (www redirects to litlense.com).

---

## Domain litlense.com

- **Registrar / DNS:** Reg.ru, zone managed in ispmanager (DNS Management).
- **Domain assignment:**
  - **litlense.com**, **www.litlense.com** → Static Site (sage-read-app).
  - **api.litlense.com** (optional) → Web Service (sage-read-api).

---

## DNS in ispmanager (Reg.ru)

Create records under **DNS Management** → select domain **litlense.com** → **DNS records** → **Create record**.

| Name (subdomain) | Type | Value | Purpose |
|------------------|------|-------|---------|
| www | CNAME | sage-read-app.onrender.com | www.litlense.com → frontend |
| litlense.com. (root) | A | 216.24.57.1 | litlense.com → frontend |

Notes:

- For the **root** domain use an **A** record (CNAME at root is not suitable in ispmanager). IP **216.24.57.1** is from Render’s Custom Domains instructions.
- If **www** already had an AAAA record, delete it before creating the CNAME (one name — one record type).
- If the **root** had two A records (old host and Render), keep only A → 216.24.57.1; remove the old A and, if needed, the root AAAA so Render verification can succeed.
- Follow ispmanager hints for “Name” / “Domain” fields (sometimes a trailing dot; for www subdomain, often just `www`).

DNS changes take effect within about an hour (Reg.ru); full propagation can take up to 24 hours (per Render).

---

## SSL

Render issues certificates for litlense.com and www.litlense.com after domain verification (Custom Domains → Verify). No SSL setup in ispmanager is required.

---

## Free tier limits (cold start)

On the **Free** plan, the Web Service (sage-read-api) **spins down** after several minutes without requests. The **first request after idle** waits for the instance to wake — delay **up to ~50 seconds or more** (as stated in Render). Subsequent requests in an active session are served without that delay.

Users may experience one long wait (e.g. after “Start Analysis”). Usually acceptable for a pet project and limited audience. Options: paid instance (no spin-down), frontend message (“please wait up to a minute”), or external keep-alive (check Free tier rules).

---

## Updating the deployment

- **Code:** push to **master** → Render automatically rebuilds and deploys both services.
- **Environment variables:** after changing them in Render, **Static Site** needs a **Manual Deploy** (or a push) so `REACT_APP_API_URL` and other vars are baked into the new build.
- **Domain / DNS:** after changing records in ispmanager, re-run verification in Render via Custom Domains → Verify (allow time for DNS propagation if needed).
