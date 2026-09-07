/**
 * Origin allowlist for /api/token.
 *
 * Lives in lib rather than in the route file because a Next.js route module may
 * only export route handlers, and /api/health needs to report on the same list
 * that the token route enforces. Keeping one copy is the point: the historical
 * 403 was a mismatch nobody could see.
 */

/**
 * Normalise an origin so a trailing slash or a case difference in the host is
 * not fatal.
 *
 * The list is compared by exact string, so a NEXT_PUBLIC_APP_URL of
 * "https://banxx.bankkaro.com/" (with the slash) previously 403'd every token
 * request, which presents as a completely blank app rather than a config error.
 */
export const normalizeOrigin = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Vercel serves each deployment from its own host and injects it as VERCEL_URL
 * (plus the stable production and branch aliases). Those hosts are never equal
 * to NEXT_PUBLIC_APP_URL, so a deployment reached on its .vercel.app domain
 * 403'd every token request and rendered an empty app — the same failure as a
 * misconfigured APP_URL, but on a domain nobody had configured. Trusting the
 * platform-supplied host keeps preview deployments working without pinning a
 * domain per environment. These are server-only vars; this module is imported
 * exclusively by /api/token and /api/health.
 */
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
]
  .filter((host): host is string => Boolean(host))
  .map((host) => (host.includes('://') ? host : `https://${host}`));

export const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_APP_URL,
  ...vercelOrigins,
  'https://banxx.bankkaro.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://bankkaro.com',
]
  .map(normalizeOrigin)
  .filter((origin): origin is string => Boolean(origin))
  // De-duplicate: APP_URL and the Vercel production alias often coincide.
  .filter((origin, i, all) => all.indexOf(origin) === i);

export const isAllowedOrigin = (requestOrigin: string | null | undefined): boolean => {
  const normalized = normalizeOrigin(requestOrigin);
  return Boolean(normalized && ALLOWED_ORIGINS.includes(normalized));
};
