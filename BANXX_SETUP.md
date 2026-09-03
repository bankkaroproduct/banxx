# Banxx deployment setup

Partner entity: Credit Links. Deployment: `banxx.bankkaro.com`.

This repo serves Banxx only. There are no sibling partner deployments here, so
components are edited directly rather than behind opt-in flags.

## Before you deploy

Set the environment variables in `.env.example`. Two of them are launch
blocking:

| Variable | Why it blocks launch |
|---|---|
| `PARTNER_API_KEY` | Server-only. Credits Credit Links for conversions. Unset means `/api/token` 500s and no card data loads. A non-Banxx key means clicks land in a shared pool and the partner is not credited. |
| `NEXT_PUBLIC_APP_URL` | Must be exactly `https://banxx.bankkaro.com`. It is the only dynamic entry in the `/api/token` origin allowlist. Unset or wrong means every token request 403s and the app renders blank. |

## Verify the config before announcing

```
curl -s https://banxx.bankkaro.com/api/health | jq
```

Returns `200 {"ok": true}` when the deployment is configured, or `503` with a
`problems` array naming what is wrong. It reports booleans and the resolved
origin only, never the API key.

This endpoint exists because both historical whitelabel failures presented as a
blank page rather than an error:

- a 403 on `/api/token` from an `NEXT_PUBLIC_APP_URL` mismatch (including a
  trailing slash, which is now tolerated by normalisation but still reported)
- a 502 on `cardgenius/cards`, most plausibly a production `PARTNER_BASE_URL`
  with a UAT-issued key

## Partner entry URL

Credit Links links to the root, not `/cards`:

```
https://banxx.bankkaro.com/?utm_source=<partner>&utm_medium=affiliate
  &utm_campaign=<campaign>&p1=&p2=<user_id>&p3=<dsa_code>
  &sal=<monthly_salary>&pin=<pincode>&st=<salary_type>
```

| Param | Handling |
|---|---|
| `sal` | Monthly rupees. Commas, spaces and currency symbols stripped. Sanity band ₹1,000 to ₹1,00,00,000. |
| `pin` | `^[1-9][0-9]{5}$`. A leading zero is rejected: no Indian PIN starts with 0. |
| `st` | Normalised to `salaried` or `self_employed`. Accepts `self-employed`, `self employed`, `selfemployed`, `SELF_EMPLOYED`. |
| `p2` / `p3` | Stored raw, appended to the outbound apply URL. |
| `p1` | Reserved. Accepted and passed through, never parsed. |
| `utm_*` | Stored raw. |

When all three of `sal`, `pin` and `st` resolve, the form is skipped and the
user lands on filtered results with an editable chip row. When any one fails,
the form renders prefilled with whatever did resolve and focus goes to the
first unresolved field. **A failed parameter is never defaulted**: a defaulted
salary produces a wrong card set that looks plausible and survives UAT.

Every arrival emits one structured `[banxx:hydration]` log line recording which
params were present, which resolved, and why each failure failed. It is
deliberately value-free and never logs the salary or pincode.

## Income units

The eligibility API takes **monthly** in-hand rupees:

```
POST https://bk-prod-external.bankkaro.com/sp/api/cg-eligiblity
{ "pincode": "560001", "inhandIncome": "50000", "empStatus": "salaried" }
```

`sal` maps 1:1. There is no conversion. `toBreIncome()` in
`src/lib/eligibilityParams.ts` is an identity function that exists so the unit
has one documented home, with a test that fails if anyone introduces a 12x.

`empStatus` must be the underscore form `self_employed`. The hyphenated form
would not match and would still return a plausible-looking card set.

## Eligibility filtering is client-side

`cardgenius/cards` does not filter by eligibility. It is called as a GET and
only `slug` and `sort_by` reach the network. Eligibility works by POSTing
`cg-eligiblity`, taking the aliases it marks eligible, and filtering the
already-fetched list client-side. A chip edit is therefore one POST plus a
re-filter, not a fresh listing fetch.

## Theming

Design tokens live in `src/app/globals.css`. The Banxx brand constants are
defined once as HSL triplets with the source hex in a comment beside each.

Light is the default; dark is user-toggleable via `next-themes`.

**The accessibility rule is encoded as a token.** `--banxx-indigo` (#6A35FF) on
`#121212` is 3.18:1, which fails WCAG AA for body text. So:

- `--primary` is a **fill** colour in both modes, always paired with
  `--primary-foreground` (white on indigo is 5.89:1).
- `--accent-text` is the indigo that is safe as text in the current mode:
  indigo in light (5.89:1 on white), indigo-300 in dark (5.95:1 on #121212).

There is deliberately no token that yields true indigo as text in dark mode.
Use `text-accent-text` for any indigo text, link or numeral.

Dense figures (fees, savings, income) use the `.figure` utility, which applies
tabular lining numerals. Raleway's default figures are proportional and light,
so columns of numbers otherwise jitter.

## Logo

Not yet supplied. `BrandWordmark` renders a text wordmark until
`NEXT_PUBLIC_BRAND_LOGO` (and optionally `NEXT_PUBLIC_BRAND_LOGO_DARK`) is set.
That is the single swap point. Brand book minimums are enforced in the
component: 124px wordmark width, 50px clear space.

Accepted inconsistency, not a bug: the logo gradient is orange-to-blue while
the UI accent is indigo.

## Outbound attribution

`p2` and `p3` are appended to the resolved apply URL after `get-link` returns,
immediately before the redirect. Append-only and string-level: existing params
are never reordered or re-encoded, because some bank URLs are signed or
hash-validated. An absent value omits the key entirely.

**Still to verify manually before launch:** the top five banks by volume, in
UAT, to confirm none of them strips the appended params. If any does, fall back
to passing `p2`/`p3` in the `get-link` request body for that bank.

## Commands

```
npm run dev        # local dev
npm run build      # production build
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
