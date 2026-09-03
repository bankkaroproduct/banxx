# Banxx

Credit card eligibility and comparison for **Banxx** (`banxx.bankkaro.com`),
partner entity **Credit Links**. Built on the BankKaro CardGenius whitelabel
shell, Next.js App Router.

Users arriving from a Credit Links affiliate link have their eligibility
hydrated from the URL and land straight on filtered results. Everyone else gets
the standard three-field eligibility form.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in PARTNER_API_KEY
npm run dev
```

Open http://localhost:3000

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |

## Configuration

See **[BANXX_SETUP.md](./BANXX_SETUP.md)** for the full deployment guide: the
two launch-blocking env vars, the `/api/health` config check, the partner entry
URL contract, the income-unit decision, and the theming and accessibility
rules.

`.env.example` documents every variable. Colour is **not** configured by env: it
lives as design tokens in `src/app/globals.css`.

## Layout

```
src/
  app/                  App Router routes and API routes
    api/health/         Deployment config check (run before announcing a deploy)
    api/token/          Partner JWT proxy, origin-allowlisted
    api/proxy/          Partner API passthrough
  lib/
    eligibilityParams   Shared validators. One source of truth for pincode,
                        income and employment rules, used by the URL adapter
                        AND every form surface.
    hydration           Credit Links URL parameter adapter
    attribution         Session-durable p2/p3/utm store
    outboundUrl         Apply-URL construction and the placeholder guard
    eligibilityStore    Session-scoped eligibility basis
  views/
    BanxxHome           Root route: results for a partner arrival, else landing
    BanxxLanding        Landing page
    CardListing         Eligibility form, hydration target, results
  components/
    EligibilityChips    Editable eligibility basis shown above results
    BrandWordmark       The only place the logo asset is referenced
```

## Things worth knowing before you change something

- **The eligibility API takes monthly rupees, not annual.** `toBreIncome()` is
  an identity function on purpose, with a test that fails if a 12x appears.
- **`empStatus` on the wire is `self_employed`, with an underscore.** The
  hyphenated form Credit Links sends is accepted as input and never emitted.
- **A failed URL parameter is never defaulted.** It is absent from the
  hydration result, which makes the rule a property of the return type.
- **`cardgenius/cards` does not filter by eligibility.** Only `slug` and
  `sort_by` reach the network. Eligibility filtering is client-side by alias.
- **Indigo is a fill colour in dark mode, never text.** Use `text-accent-text`,
  which resolves to indigo-300 in dark mode. See BANXX_SETUP.md.
- **Every outbound apply URL is asserted placeholder-free before navigation.**
  A previous deployment shipped live `{click_id}` in production redirects.
