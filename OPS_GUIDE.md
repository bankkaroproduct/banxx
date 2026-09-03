# Product Ops Guide: Setting Up a Whitelabel Partner

This guide explains how to configure and deploy a branded version of the Credit Card Demo site for a new partner.

## 1. Quick Setup (Vercel)

Most configuration happens in the **Environment Variables** section of your Vercel project correctly.

### Required Variables
Set these variables to customize the site.

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_BRAND_NAME | Name of the partner | `MoneyControl` |
| VITE_BRAND_TAGLINE | Tagline below the logo | `India's #1 Financial Platform` |
| VITE_BRAND_EMAIL | Support email | `support@moneycontrol.com` |
| VITE_BRAND_LOGO | Path to logo file | `/mc-logo.png` |
| VITE_BRAND_FAVICON | Path to favicon file | `/favicon.svg` |
| VITE_PRIMARY_COLOR | Brand's main Hex Color | `#2e8b57` (Sea Green) |
| VITE_SECONDARY_COLOR | Secondary/Accent Hex | `#1e90ff` (Dodger Blue) |
| VITE_GA_MEASUREMENT_ID | Google Analytics 4 ID | `G-XXXXXXXXXX` |
| VITE_PARTNER_API_KEY | Partner's Unique API Key | `abc123...` (Get from Eng) |


> [!TIP]
> **Getting Brand Colors:**
> 1. Go to the partner's existing website.
> 2. Right-click on a button or header and select **Inspect**.
> 3. Look for `color` or `background-color` in the Styles pane.
> 4. Copy the Hex code (e.g., `#FF5733`).

## 2. Managing Logos (Multiple Brands)

To support multiple partners in the same repository, use **unique filenames** for each logo.

1. **supported Formats:** `.png`, `.jpg`, `.svg` (SVG is best for crispness).
2. **Upload to Repo:**
    - Upload the file to the `public/` folder.
    - **Naming Convention:** Use the partner's name to avoid overwriting others.
    - Example: `public/moneycontrol-logo.svg`, `public/tide_logo_white.svg`.
3. **Link in Config:**
    - **Project A (MoneyControl):** Set `VITE_BRAND_LOGO` = `/moneycontrol-logo.svg`
    - **Project B (TIDE):** Set `VITE_BRAND_LOGO` = `/tide_logo_white.svg` (Crucial: `/logo.svg` is the generic placeholder now!)

> [!IMPORTANT]
> **If your TIDE logo looks like a "CG" square:**
> Update your Vercel Environment Variable `VITE_BRAND_LOGO` from `/logo.svg` to `/tide_logo_white.svg`.


> [!NOTE]
> Ensure the logo has a **transparent background** for best results.

## 3. Analytics Setup

We use **Google Analytics 4** to track user behavior.

1. Create a new **property** in GA4 for the partner.
2. Get the **Measurement ID** (`G-XXXXXXXX`).
3. Add it to Vercel env vars as `VITE_GA_MEASUREMENT_ID`.
4. **Important:** In GA4 Admin > Custom Definitions, create a Custom Dimension named `partner_name` (Event scoped).

## 4. Troubleshooting

### Vercel "Invalid Characters" Error
If Vercel says *"The name contains invalid characters"*, check the **Name** field of your environment variable.
- **Correct:** `VITE_BRAND_NAME` (Underscores, Uppercase)
- **Incorrect:** `Brand Name`, `VITE-BRAND-NAME`, `1_BRAND`
- **Fix:** Copy the variable name *exactly* from the table in Section 1.

### Other Common Issues
- **Logo not showing?** verification usage of the leading slash (e.g., `/logo.png`, not `logo.png`).
- **Colors look wrong?** Ensure the Hex code includes the `#` symbol.
- **Card data missing?** The `VITE_PARTNER_API_KEY` might be incorrect. Contact Engineering.
