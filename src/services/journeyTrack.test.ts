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
    const { trackCatalogViewed } = await import('./journeyTrack');
    trackCatalogViewed(14, 'direct');
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const payload = lastPayload();
    expect(payload).toMatchObject({
      event_name: 'catalog_viewed',
      p2: 'U777',
      p3: 'DSA42',
      utm_source: 'creditlinks',
      utm_campaign: 'sept26',
    });
    // Event-specific data stays under metadata and is not polluted.
    expect(payload.metadata).toEqual({ total_cards: 14, entry_source: 'direct' });
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
    const { trackPageView } = await import('./journeyTrack');
    trackPageView('/');
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    expect(lastPayload()).toMatchObject({
      event_name: 'page_view',
      utm_source: 'creditlinks',
      utm_medium: 'affiliate',
      p2: 'U999',
    });
  });

  it('prefers the store over the URL once it is populated', async () => {
    sessionStorage.setItem('banxx_attribution', JSON.stringify({ utm_source: 'stored' }));
    setUrl('?utm_source=from-url');
    const { trackPageView } = await import('./journeyTrack');
    trackPageView('/');
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    expect(lastPayload().utm_source).toBe('stored');
  });

  it('omits absent keys rather than sending them empty', async () => {
    setUrl('?utm_source=creditlinks&p1=&p3=');
    const { trackPageView } = await import('./journeyTrack');
    trackPageView('/');
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const payload = lastPayload();
    expect(payload.utm_source).toBe('creditlinks');
    expect('p1' in payload).toBe(false);
    expect('p3' in payload).toBe(false);
  });

  it('sends no attribution keys when there is none, without throwing', async () => {
    const { trackPageView } = await import('./journeyTrack');
    trackPageView('/');
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const payload = lastPayload();
    expect(payload.event_name).toBe('page_view');
    for (const key of ['p1', 'p2', 'p3', 'utm_source', 'utm_medium', 'utm_campaign']) {
      expect(key in payload).toBe(false);
    }
  });
});

describe('privacy reduction', () => {
  /**
   * "BAND IT. Raw salary must never leave the client." and "pincode: first 3
   * digits only." The replaced eligibility_checked event sent 110018 and 87500
   * verbatim, so these assert on the payload rather than on the helpers.
   */
  it('never puts a raw salary or a full pincode on the wire', async () => {
    const { trackEligibilitySubmitted } = await import('./journeyTrack');
    trackEligibilitySubmitted({ monthlyIncome: 87500, pincode: '110018', empStatus: 'salaried' });
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const body = JSON.stringify(lastPayload());
    expect(body).not.toContain('87500');
    expect(body).not.toContain('110018');
    expect(lastPayload().metadata).toEqual({
      monthly_salary_band: '75k-100k',
      pincode_prefix: '110',
      salary_type: 'salaried',
    });
  });

  it('bands salaries across the range', async () => {
    const { salaryBand } = await import('./journeyTrack');
    expect(salaryBand(20_000)).toBe('0-25k');
    expect(salaryBand(60_000)).toBe('50k-75k');
    expect(salaryBand(87_500)).toBe('75k-100k');
    expect(salaryBand(250_000)).toBe('200k+');
    expect(salaryBand('1,20,000'.replace(/,/g, ''))).toBe('100k-150k');
    expect(salaryBand(0)).toBeUndefined();
    expect(salaryBand(undefined)).toBeUndefined();
  });

  it('truncates the pincode and normalises salary type', async () => {
    const { pincodePrefix, salaryTypeOf } = await import('./journeyTrack');
    expect(pincodePrefix('110018')).toBe('110');
    expect(pincodePrefix('11')).toBeUndefined();
    expect(salaryTypeOf('self-employed')).toBe('self_employed');
    expect(salaryTypeOf('self_employed')).toBe('self_employed');
    expect(salaryTypeOf('salaried')).toBe('salaried');
  });

  it('identifies the partner and the browser on every event', async () => {
    const { trackCatalogViewed } = await import('./journeyTrack');
    trackCatalogViewed(170);
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());

    const p = lastPayload();
    expect(p.partner_id).toBe('banxx');
    expect(p.session_id).toMatch(/^s_/);
    expect(p.user_pseudo_id).toMatch(/^u_/);
    expect(p.device_type).toBeTruthy();
  });

  it('fires session_start only once per session', async () => {
    const { trackSessionStart } = await import('./journeyTrack');
    trackSessionStart();
    await vi.waitFor(() => expect(lastPayload()).not.toBeNull());
    const after = fetchMock.mock.calls.length;
    trackSessionStart();
    trackSessionStart();
    expect(fetchMock.mock.calls.length).toBe(after);
  });
});
