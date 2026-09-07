/**
 * Partner token holder.
 *
 * Every card request needs a partner-token, and the token is fetched from
 * /api/token (which signs it server-side with PARTNER_API_KEY). Two properties
 * matter here beyond plain caching:
 *
 *  - Coalescing. The listing mounts several data fetches at once (init-bundle,
 *    cards, journey-track), and they all call getToken() in the same tick.
 *    Without an in-flight promise every one of them misses the empty cache and
 *    fires its own /api/token, so a single page load hit the partner token
 *    endpoint three times. That burst is what tripped the upstream rate limit,
 *    and the resulting 429 surfaced to the user as "Failed to fetch auth token"
 *    with no cards. Concurrent callers now share one request.
 *
 *  - Retry. A 429 or a 5xx from the token endpoint is usually transient, so it
 *    is retried with backoff rather than failing the whole page.
 */

/** Treat a token as expired this early, so it cannot lapse mid-request. */
const EXPIRY_SKEW_MS = 60_000;

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class AuthManager {
  private token: string | null = null;
  private expiresAt: Date | null = null;
  /** Shared promise for a token fetch already in progress, if any. */
  private inflight: Promise<string> | null = null;
  private readonly tokenUrl: string;

  constructor() {
    this.tokenUrl = '/api/token';
  }

  private isFresh(): boolean {
    return Boolean(
      this.token &&
        this.expiresAt &&
        this.expiresAt.getTime() > Date.now() + EXPIRY_SKEW_MS
    );
  }

  async getToken(): Promise<string> {
    if (this.isFresh()) return this.token as string;

    // Join the request already in flight instead of starting a second one.
    if (this.inflight) return this.inflight;

    this.inflight = this.fetchToken().finally(() => {
      this.inflight = null;
    });

    return this.inflight;
  }

  private async fetchToken(): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(this.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        // 429 and 5xx are transient: back off and try again. A 4xx other than
        // 429 means the request itself is wrong, so retrying cannot help.
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Token endpoint returned ${response.status}`);
        }
        if (!response.ok) {
          throw Object.assign(
            new Error(`Token request rejected (${response.status})`),
            { fatal: true }
          );
        }

        const data = await response.json();

        if (data?.status === 'success' && data?.data?.jwttoken) {
          this.token = data.data.jwttoken as string;
          this.expiresAt = new Date(data.data.expiresAt);
          return this.token;
        }

        throw Object.assign(new Error('Invalid token response'), { fatal: true });
      } catch (error) {
        lastError = error as Error;
        if ((error as { fatal?: boolean }).fatal || attempt === MAX_ATTEMPTS) break;
        await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
      }
    }

    console.error('Auth error:', lastError);
    throw lastError ?? new Error('Failed to fetch auth token');
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'partner-token': token,
        'Content-Type': 'application/json',
      },
    });
  }
}

export const authManager = new AuthManager();
