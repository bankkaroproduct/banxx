import { beforeEach, describe, expect, it } from 'vitest';
import {
  getStoredAttribution,
  persistAttribution,
  readAttributionFromParams,
} from './attribution';

const params = (query: string) => new URLSearchParams(query);

beforeEach(() => {
  sessionStorage.clear();
});

describe('readAttributionFromParams', () => {
  it('reads every attribution key', () => {
    expect(
      readAttributionFromParams(
        params('p1=a&p2=user-42&p3=DSA-7&utm_source=creditlinks&utm_medium=affiliate&utm_campaign=jan')
      )
    ).toEqual({
      p1: 'a',
      p2: 'user-42',
      p3: 'DSA-7',
      utm_source: 'creditlinks',
      utm_medium: 'affiliate',
      utm_campaign: 'jan',
    });
  });

  it('drops empty values so p1= does not become a stored empty string', () => {
    expect(readAttributionFromParams(params('p1=&p2=user-42'))).toEqual({ p2: 'user-42' });
  });

  it('ignores unrelated params', () => {
    expect(readAttributionFromParams(params('sal=50000&pin=560001&category=fuel'))).toEqual({});
  });
});

describe('persistAttribution', () => {
  /**
   * Spec test cases 8 and 11: p2/p3 must survive a chip edit and a refresh.
   * The URL only carries them on the landing hit, so the session store is what
   * keeps attribution alive for the click-out.
   */
  it('survives a re-read after the URL no longer carries the params', () => {
    persistAttribution(readAttributionFromParams(params('p2=user-42&p3=DSA-7&utm_source=creditlinks')));

    // Simulates a later navigation whose URL has no attribution on it.
    expect(getStoredAttribution()).toEqual({
      p2: 'user-42',
      p3: 'DSA-7',
      utm_source: 'creditlinks',
    });
  });

  it('merges, with URL values winning on re-entry', () => {
    persistAttribution({ p2: 'user-42', p3: 'DSA-7', utm_campaign: 'jan' });
    persistAttribution({ p3: 'DSA-9' });

    expect(getStoredAttribution()).toEqual({
      p2: 'user-42',
      p3: 'DSA-9',
      utm_campaign: 'jan',
    });
  });

  it('does not wipe stored values when a later navigation has no params', () => {
    persistAttribution({ p2: 'user-42', p3: 'DSA-7' });
    persistAttribution(readAttributionFromParams(params('category=fuel')));

    expect(getStoredAttribution()).toEqual({ p2: 'user-42', p3: 'DSA-7' });
  });

  it('returns an empty object rather than throwing on corrupt storage', () => {
    sessionStorage.setItem('banxx_attribution', '{not json');
    expect(getStoredAttribution()).toEqual({});
  });
});
