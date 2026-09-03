# Whitelabel Product Handover & Setup Checklist

## 1. Prerequisites for Tech Team
Before deploying a new partner site, ensure you have the following:

- [ ] **Partner Name:** Formal name (e.g., "MoneyControl Cards").
- [ ] **Partner Logo:** High-res PNG/SVG (transparent background, min-height 200px).
- [ ] **Brand Colors:** Primary and Secondary colors (Hex codes).
- [ ] **API Key:** Unique `VITE_PARTNER_API_KEY` provided by the backend team (Critical for attribution!).
- [ ] **Hosting Access:** Access to the deployment platform (Vercel/Netlify/AWS).

## 2. Configuration (Environment Variables)
The application is 100% configured via environment variables. **No code changes are required for branding.**

### Build-Time Variables
| Variable | Description | Required? | Example |
| :--- | :--- | :--- | :--- |
| `VITE_BRAND_NAME` | Display name of the partner | ✅ Yes | `Tide Cards` |
| `VITE_BRAND_TAGLINE` | Tagline under the logo | ❌ No | `Business Banking Simplified` |
| `VITE_BRAND_EMAIL` | Support email in footer | ✅ Yes | `support@tide.co` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 ID | ❌ No | `G-12345678` |

### Branding Assets
1.  **Logo:** Upload `partner-logo.png` to the `public/` directory in the repo.
2.  **Favicon:** Upload `favicon.ico` or `.png` to `public/`.
3.  **Variable Configuration:**
    *   `VITE_BRAND_LOGO`: `/partner-logo.png` (Must start with `/`)
    *   `VITE_BRAND_FAVICON`: `/favicon.png`

### Theme Colors (HSL Format)
The app uses HSL for dynamic theming. You **must** convert Hex colors to HSL.
*Tool: [hex-to-hsl](https://htmlcolors.com/hex-to-hsl)*

| Variable | Description | Example (for `#00FF00`) |
| :--- | :--- | :--- |
| `VITE_PRIMARY_HUE` | Hue angle (0-360) | `120` |
| `VITE_PRIMARY_SAT` | Saturation (with %) | `100%` |
| `VITE_PRIMARY_LIGHT` | Lightness (with %) | `50%` |
| `VITE_SECONDARY_HUE` | Secondary Hue | `240` |
| `VITE_SECONDARY_SAT` | Secondary Sat | `100%` |
| `VITE_SECONDARY_LIGHT` | Secondary Light | `50%` |

Alternatively, use the **Override** variables with Hex codes directly (if supported by newer build):
*   `VITE_PRIMARY_COLOR` (`#RRGGBB`)
*   `VITE_SECONDARY_COLOR` (`#RRGGBB`)

## 3. Deployment Steps
1.  **Clone/Pull** the `whitelabel-base` repository.
2.  **Configure Build Command:** `npm install && npm run build`
3.  **Output Directory:** `dist`
4.  **Set Environment Variables** in the CI/CD pipeline.
5.  **Deploy.**

## 4. Verification Checklist (Post-Deployment)
- [ ] **Visual Check:**
    - [ ] Logo matches the partner brand.
    - [ ] Primary buttons use the partner's primary color.
    - [ ] Page title and footer text show the Partner Name.
- [ ] **Functional Check:**
    - [ ] "Apply Now" buttons redirect to the bank application page.
    - [ ] URL parameters (if any attribution params are passed) are preserved.
- [ ] **Security Check:**
    - [ ] Verify `VITE_PARTNER_API_KEY` is not undefined in network requests (check Network tab -> `/token` or `/cards` calls).

## 5. Troubleshooting
*   **Logo 404:** Ensure `VITE_BRAND_LOGO` starts with a forward slash `/`.
*   **Wrong Colors:** Double-check HSL conversion. Ensure Saturation and Lightness include the `%` sign.
*   **Build Failures:** Check node version (Recommended: Node 18+).
