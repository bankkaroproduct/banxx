import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Hydration behaviour of the listing surface: does a partner arrival skip the
 * form, and does an incomplete one fall back to it?
 *
 * The view is mocked down to its collaborators so the test exercises the
 * hydration decision rather than the card grid.
 */

const checkEligibility = vi.fn();
const getCardListing = vi.fn();

vi.mock('@/services/cardService', () => ({
  cardService: {
    checkEligibility: (...args: unknown[]) => checkEligibility(...args),
    getCardListing: (...args: unknown[]) => getCardListing(...args),
    calculateCardGenius: vi.fn().mockResolvedValue({}),
  },
  extractEligibleAliases: (response: { data?: { eligible?: boolean; seo_card_alias?: string }[] }) =>
    (response?.data ?? [])
      .filter((c) => c.eligible === true)
      .map((c) => c.seo_card_alias)
      .filter(Boolean),
}));

let searchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('@/services/journeyTrack', () => ({
  trackCardClicked: vi.fn(),
  trackCardDetailsClicked: vi.fn(),
  trackDiscoverPageView: vi.fn(),
  trackDiscoverSearchBarFocused: vi.fn(),
  trackDiscoverSearchQueryTyped: vi.fn(),
  trackDiscoverSearchSubmitted: vi.fn(),
  trackEligibilityCheckClicked: vi.fn(),
  trackEligibilityChecked: vi.fn(),
  trackEligibilityDetailsFilled: vi.fn(),
  trackFilterCategorySelected: vi.fn(),
  trackFilterFeeRangeSelected: vi.fn(),
  trackFilterNetworkSelected: vi.fn(),
  trackFiltersCleared: vi.fn(),
  trackListingApplyNowClicked: vi.fn(),
  trackListingClearAllFilters: vi.fn(),
  trackListingFiltersSelected: vi.fn(),
  trackListingLoadMoreClicked: vi.fn(),
  trackListingPageView: vi.fn(),
}));

vi.mock('@/services/analytics', () => ({
  analytics: {
    trackCardAction: vi.fn(),
    trackEvent: vi.fn(),
    trackFilterChange: vi.fn(),
    trackGeniusStart: vi.fn(),
    trackSearch: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Heavy children that are irrelevant to the hydration decision.
vi.mock('@/components/Navigation', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/GeniusDialog', () => ({ default: () => null }));
vi.mock('@/components/EligibilityDialog', () => ({ default: () => null }));

import CardListing from './CardListing';
import { ComparisonProvider } from '@/contexts/ComparisonContext';

/** CardListing consumes the comparison context, so it needs its provider. */
const renderListing = () =>
  render(
    <ComparisonProvider maxCompare={3}>
      <CardListing />
    </ComparisonProvider>
  );

const CARDS_RESPONSE = {
  status: 'success',
  data: {
    cards: [
      { id: 1, name: 'Card One', seo_card_alias: 'card-one' },
      { id: 2, name: 'Card Two', seo_card_alias: 'card-two' },
    ],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  getCardListing.mockResolvedValue(CARDS_RESPONSE);
  checkEligibility.mockResolvedValue({
    status: true,
    data: [
      { seo_card_alias: 'card-one', eligible: true },
      { seo_card_alias: 'card-two', eligible: false },
    ],
  });
});

describe('CardListing URL hydration', () => {
  // Spec test case 1.
  it('skips the form and shows the chip row when all three params resolve', async () => {
    searchParams = new URLSearchParams(
      'sal=50000&pin=560001&st=salaried&p2=user-42&p3=DSA-7&utm_source=creditlinks'
    );
    renderListing();

    await waitFor(() => expect(checkEligibility).toHaveBeenCalled());

    // Monthly rupees, and the underscore wire value.
    expect(checkEligibility).toHaveBeenCalledWith({
      pincode: '560001',
      inhandIncome: 50000,
      empStatus: 'salaried',
    });

    await waitFor(() => {
      expect(screen.getByTestId('eligibility-chips')).toBeInTheDocument();
    });
    expect(screen.getByText('₹50,000/mo')).toBeInTheDocument();
    expect(screen.getByText('560001')).toBeInTheDocument();
    expect(screen.getByText('Salaried')).toBeInTheDocument();

    // The form is not rendered at all.
    expect(document.getElementById('elig-pincode')).toBeNull();
    expect(screen.queryByRole('button', { name: /check eligibility/i })).toBeNull();
  });

  it('normalises a hyphenated employment type to the underscore wire value', async () => {
    searchParams = new URLSearchParams('sal=50,000&pin=560001&st=SELF%20EMPLOYED');
    renderListing();

    await waitFor(() =>
      expect(checkEligibility).toHaveBeenCalledWith({
        pincode: '560001',
        inhandIncome: 50000,
        empStatus: 'self_employed',
      })
    );
  });

  // Spec test case 3.
  it('renders the form prefilled and does not call the API when salary is unparseable', async () => {
    searchParams = new URLSearchParams('sal=abc&pin=560001&st=salaried');
    renderListing();

    await waitFor(() => expect(getCardListing).toHaveBeenCalled());

    const pincode = document.getElementById('elig-pincode') as HTMLInputElement;
    const income = document.getElementById('elig-income') as HTMLInputElement;
    expect(pincode).not.toBeNull();
    expect(pincode.value).toBe('560001');
    // Never defaulted: the field that failed to resolve stays empty.
    expect(income.value).toBe('');

    expect(checkEligibility).not.toHaveBeenCalled();
  });

  // Spec test case 4.
  it('leaves a zero-leading pincode empty rather than accepting it', async () => {
    searchParams = new URLSearchParams('sal=50000&pin=012345&st=salaried');
    renderListing();

    await waitFor(() => expect(getCardListing).toHaveBeenCalled());

    const pincode = document.getElementById('elig-pincode') as HTMLInputElement;
    const income = document.getElementById('elig-income') as HTMLInputElement;
    expect(pincode.value).toBe('');
    expect(income.value).toBe('50000');
    expect(checkEligibility).not.toHaveBeenCalled();
  });

  // Spec test case 7.
  it('renders the normal form flow with no params and makes no eligibility call', async () => {
    searchParams = new URLSearchParams('');
    renderListing();

    await waitFor(() => expect(getCardListing).toHaveBeenCalled());

    expect(document.getElementById('elig-pincode')).not.toBeNull();
    expect(checkEligibility).not.toHaveBeenCalled();
    expect(screen.queryByTestId('eligibility-chips')).toBeNull();
  });

  // Spec test cases 8 and 11: attribution is captured on arrival and survives.
  it('persists p2, p3 and utm values for the outbound apply URL', async () => {
    searchParams = new URLSearchParams(
      'sal=50000&pin=560001&st=salaried&p1=&p2=user-42&p3=DSA-7&utm_source=creditlinks&utm_campaign=jan'
    );
    renderListing();

    await waitFor(() => expect(checkEligibility).toHaveBeenCalled());

    expect(JSON.parse(sessionStorage.getItem('banxx_attribution') ?? '{}')).toEqual({
      p2: 'user-42',
      p3: 'DSA-7',
      utm_source: 'creditlinks',
      utm_campaign: 'jan',
    });
  });

  it('captures attribution even when eligibility does not resolve', async () => {
    searchParams = new URLSearchParams('sal=abc&p2=user-42&p3=DSA-7');
    renderListing();

    await waitFor(() => expect(getCardListing).toHaveBeenCalled());

    expect(JSON.parse(sessionStorage.getItem('banxx_attribution') ?? '{}')).toEqual({
      p2: 'user-42',
      p3: 'DSA-7',
    });
  });

  it('writes the hydrated basis to the session store so the per-card dialog does not re-ask', async () => {
    searchParams = new URLSearchParams('sal=50000&pin=560001&st=self_employed');
    renderListing();

    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem('banxx_eligibility') ?? '{}')).toEqual({
        pincode: '560001',
        inhandIncome: 50000,
        empStatus: 'self_employed',
        // Cached so the genius and beat-my-card flows can filter on the same
        // set without re-running the eligibility call per view.
        eligibleAliases: ['card-one'],
      })
    );
  });
});
