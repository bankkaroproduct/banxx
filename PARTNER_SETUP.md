# New Partner Setup Checklist

Use this checklist when setting up a demo for a new partner.

## Prerequisites
- [ ] Partner's brand name
- [ ] Partner's logo (PNG, ideally 200px+ height)
- [ ] Partner's primary brand color (get HEX, we'll convert to HSL)
- [ ] Partner's contact email for demo

---

## Step 1: Prepare Logo

1. Get the partner's logo in PNG format
2. Rename it (e.g., `partnername-logo.png`)
3. Add to `public/` folder in the repo
4. Commit and push to GitHub

---

## Step 2: Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same GitHub repo
3. **Project Name**: `demo-partnername` (this becomes the URL)
4. Click **Deploy** (it will fail first time - that's OK)

---

## Step 3: Set Environment Variables

Go to **Project Settings → Environment Variables** and add:

### 🚨 CRITICAL: Partner API Key (Required for Attribution)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_PARTNER_API_KEY` | `abc123...` | **GET FROM BANKKARO** - Unique per partner! |

> ⚠️ **Without this, all clicks go to a shared pool and partner won't get credited!**

### Branding Variables

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `VITE_BRAND_NAME` | `PartnerName Cards` | Shows in footer, title |
| `VITE_BRAND_TAGLINE` | `Find Your Perfect Credit Card` | Optional |
| `VITE_BRAND_LOGO` | `/partnername-logo.png` | Path to logo in public/ |
| `VITE_BRAND_EMAIL` | `support@partner.com` | Shows in footer |
| `VITE_PRIMARY_HUE` | `200` | See color table below |
| `VITE_PRIMARY_SAT` | `100%` | Usually 80-100% |
| `VITE_PRIMARY_LIGHT` | `40%` | Usually 30-50% |

### API Endpoints (Usually Same for All)

| Variable | Value |
|----------|-------|
| `VITE_PARTNER_TOKEN_URL` | `https://uat-platform.bankkaro.com/partner/token` |
| `VITE_PARTNER_BASE_URL` | `https://uat-platform.bankkaro.com/partner` |

---

## Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for build to complete
4. Your demo is live at: `demo-partnername.vercel.app`

---

## Color Conversion Reference

### HEX to HSL Quick Reference

| Brand Color | HEX | HUE | SAT | LIGHT |
|-------------|-----|-----|-----|-------|
| Green | #00A651 | 145 | 100% | 33% |
| Blue | #0066CC | 211 | 100% | 40% |
| Purple | #8B5CF6 | 270 | 70% | 45% |
| Orange | #F97316 | 25 | 95% | 50% |
| Teal | #14B8A6 | 175 | 80% | 35% |
| Red | #DC2626 | 0 | 85% | 45% |
| Navy | #1E3A5F | 210 | 55% | 25% |
| Gold | #EAB308 | 48 | 96% | 47% |

### Need a different color?
Use this free converter: [https://htmlcolors.com/hex-to-hsl](https://htmlcolors.com/hex-to-hsl)

---

## Active Demos Tracker

| Partner | URL | Primary Color | Status |
|---------|-----|---------------|--------|
| CardGenius (Default) | `your-project.vercel.app` | Green (145) | ✅ Live |
| _Partner A_ | `demo-partnera.vercel.app` | _Blue (211)_ | _Pending_ |

---

## Troubleshooting

**Logo not showing?**
- Ensure the file is in `public/` folder
- Check the path starts with `/` (e.g., `/logo.png`)
- Make sure you pushed to GitHub before redeploying

**Colors not changing?**
- Verify all three color variables are set (HUE, SAT, LIGHT)
- Ensure SAT and LIGHT include the `%` symbol
- Redeploy after changing variables

**Old content still showing?**
- Clear browser cache or try incognito mode
- Vercel caches aggressively - wait 1-2 minutes after deploy
