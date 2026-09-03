# BankkaroTide Frontend

A whitelabel credit card comparison and recommendation platform built with Next.js. Can be branded for any partner via environment variables.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Setup

Copy the example below into a `.env` file in the project root (never commit this file):

```env
# Brand / whitelabel
NEXT_PUBLIC_BRAND_NAME=YourBrand Cards
NEXT_PUBLIC_BRAND_TAGLINE=Find Your Perfect Credit Card
NEXT_PUBLIC_BRAND_EMAIL=support@yourbrand.com
NEXT_PUBLIC_BRAND_LOGO=/logo.png

# Theme colors (hex or hsl)
NEXT_PUBLIC_PRIMARY_COLOR=#2563eb
NEXT_PUBLIC_SECONDARY_COLOR=#7c3aed

# Partner API
PARTNER_API_KEY=your_api_key_here
PARTNER_TOKEN_URL=https://your-token-endpoint.com/token

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Whitelabel Configuration

1. Add your `logo.png` and `favicon.png` to the `public/` folder.
2. Set `NEXT_PUBLIC_*` variables in `.env` for your brand.
3. Each partner deployment gets its own Vercel project pointing to the same repo, with different environment variables.

## Features

- **Card Genius** — AI-powered card recommendations based on monthly spending
- **Category Card Genius** — Best cards for a specific spending category
- **Beat My Card** — Compare your current card against smarter alternatives
- **Card Listing** — Browse and filter 100+ credit cards with GST-inclusive fee display
- **Card Details** — Full breakdown of benefits, fees, and rewards
- **Card Comparison** — Side-by-side comparison of up to 3 cards

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

## Project Structure

```
src/
├── app/               # Next.js App Router pages
├── components/        # Shared UI components
│   └── comparison/    # Card comparison panel
├── config/
│   └── brand.config.ts  # Central brand/theme config
├── lib/
│   ├── cardGenius.ts  # Card Genius recommendation engine
│   └── feeUtils.ts    # GST-inclusive fee calculations
├── services/          # API calls (card data, auth)
├── utils/
│   └── redirectHandler.ts  # Card application redirect logic
└── views/             # Page-level view components
```

## Deployment (Vercel)

1. Connect this repo to a new Vercel project.
2. Go to **Project Settings → Environment Variables** and add all `NEXT_PUBLIC_*` and `PARTNER_*` variables.
3. Deploy. Each brand/partner gets its own Vercel project.
