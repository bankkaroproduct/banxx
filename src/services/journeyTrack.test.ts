import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The Journey Track payload contract.
 *
 * Attribution reaching JT is the whole point of the partner link: without it an
 * event cannot be credited to the campaign that paid for the visit. These tests
 * pin the shape the backend consumes, and the fallback that keeps the first
 * event of a session from going out unattributed.
 */

vi.mock('react-ga4', () => ({ default: { event: vi.fn() } }));
vi.mock('@/services/authManager', () => ({
  authManager: { getToken: vi.fn().mockResolvedValue('test-token') },
}));

const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

/** The body of the last POST to /api/journey-track. */
const lastPayload = () => {
  const call = fetchMock.mock.calls.filter((c) => String(c[0]).includes('journey-track')).pop();
  return call ? JSON.parse((call[1] as RequestInit).body as string) : null;
};

const setUrl = (search: string) => {
  window.history.replaceState({}, '', `/${search}`);
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  setUrl('');
  vi.stubGlobal('fetch', fetchMock);
});

describe('journey track attribution', () => {
  it('attaches stored attribution at the top level, leaving metadata alone', async () => {
    sessionStorage.setItem(
      'banxx_attribution',
      JSON.stringify({ p2: 'U777', p3: 'DSA42', utm_source: 'creditlinks', utm_campaign: 'sept26' })
    );
    const { trackListingPageView } = await import('./journeyTrack');
    trackListingPageView(14, 12);
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const payload = lastPayload();
    expect(payload).toMatchObject({
      event_name: 'listing_page_view',
      p2: 'U777',
      p3: 'DSA42',
      utm_source: 'creditlinks',
      utm_campaign: 'sept26',
    });
    // Event-specific data stays under metadata and is not polluted.
    expect(payload.metadata).toEqual({ total_cards: 14, displayed_count: 12 });
    expect(payload.metadata.utm_source).toBeUndefined();
  });

  /**
   * On a partner landing the attribution is persisted by an effect in
   * BanxxHome while the page-view event fires from an effect in its child, and
   * React runs child effects first. Without the URL fallback the first and most
   * valuable event of a paid session goes out with nothing attached.
   */
  it('falls back to the live URL when the store has not been written yet', async () => {
    setUrl('?utm_source=creditlinks&utm_medium=affiliate&p2=U999');
    const { trackHomePageView } = await import('./journeyTrack');
    trackHomePageView();
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    expect(lastPayload()).toMatchObject({
      event_name: 'home_page_view',
      utm_source: 'creditlinks',
      utm_medium: 'affiliate',
      p2: 'U999',
    });
  });

  it('prefers the store over the URL once it is populated', async () => {
    sessionStorage.setItem('banxx_attribution', JSON.stringify({ utm_source: 'stored' }));
    setUrl('?utm_source=from-url');
    const { trackHomePageView } = await import('./journeyTrack');
    trackHomePageView();
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    expect(lastPayload().utm_source).toBe('stored');
  });

  it('omits absent keys rather than sending them empty', async () => {
    setUrl('?utm_source=creditlinks&p1=&p3=');
    const { trackHomePageView } = await import('./journeyTrack');
    trackHomePageView();
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const payload = lastPayload();
    expect(payload.utm_source).toBe('creditlinks');
    expect('p1' in payload).toBe(false);
    expect('p3' in payload).toBe(false);
  });

  it('sends no attribution keys when there is none, without throwing', async () => {
    const { trackHomePageView } = await import('./journeyTrack');
    trackHomePageView();
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const payload = lastPayload();
    expect(payload.event_name).toBe('home_page_view');
    for (const key of ['p1', 'p2', 'p3', 'utm_source', 'utm_medium', 'utm_campaign']) {
      expect(key in payload).toBe(false);
    }
  });
});
