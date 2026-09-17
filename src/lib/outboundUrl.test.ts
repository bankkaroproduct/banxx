import { describe, expect, it } from 'vitest';
import {
  UnsubstitutedPlaceholderError,
  appendAttribution,
  assertNoPlaceholders,
  findPlaceholder,
  stripPlaceholderParams,
  substitutePlaceholders,
  PARTNER_ID,
} from './outboundUrl';

describe('appendAttribution', () => {
  // Spec test case 9.
  it('appends p2 and p3 to a URL that already has a query', () => {
    expect(
      appendAttribution('https://track.techtrack.in/click?campaign_id=99', {
        p2: 'user-42',
        p3: 'DSA-7',
      })
    ).toBe('https://track.techtrack.in/click?campaign_id=99&p2=user-42&p3=DSA-7');
  });

  it('starts a query string when the URL has none', () => {
    expect(appendAttribution('https://bank.example.com/apply', { p2: 'u1', p3: 'd1' })).toBe(
      'https://bank.example.com/apply?p2=u1&p3=d1'
    );
  });

  it('omits an absent key entirely rather than emitting an empty value', () => {
    expect(appendAttribution('https://b.example.com/a?x=1', { p2: 'u1' })).toBe(
      'https://b.example.com/a?x=1&p2=u1'
    );
    expect(appendAttribution('https://b.example.com/a?x=1', { p3: 'd1' })).toBe(
      'https://b.example.com/a?x=1&p3=d1'
    );
    const none = appendAttribution('https://b.example.com/a?x=1', {});
    expect(none).toBe('https://b.example.com/a?x=1');
    expect(none).not.toContain('p2=');
    expect(none).not.toContain('p3=');
  });

  it('treats an empty-string value as absent', () => {
    expect(appendAttribution('https://b.example.com/a', { p2: '', p3: '' })).toBe(
      'https://b.example.com/a'
    );
  });

  it('URL-encodes the values', () => {
    expect(appendAttribution('https://b.example.com/a', { p2: 'a b&c=d', p3: 'x/y?z' })).toBe(
      'https://b.example.com/a?p2=a%20b%26c%3Dd&p3=x%2Fy%3Fz'
    );
  });

  /**
   * Append-only matters: some bank tracking URLs are signed or hash-validated,
   * so a normalising round-trip through `new URL()` can invalidate them.
   */
  it('leaves existing params byte-identical, preserving order and encoding', () => {
    const signed =
      'https://track.example.com/c?sig=AbC%2FdEf%3D&b=2&a=1&empty=&repeat=x&repeat=y';
    const result = appendAttribution(signed, { p2: 'u1' });
    expect(result).toBe(`${signed}&p2=u1`);
    expect(result.startsWith(signed)).toBe(true);
  });

  it('appends before a fragment', () => {
    expect(appendAttribution('https://b.example.com/a?x=1#step2', { p2: 'u1' })).toBe(
      'https://b.example.com/a?x=1&p2=u1#step2'
    );
    expect(appendAttribution('https://b.example.com/a#step2', { p2: 'u1' })).toBe(
      'https://b.example.com/a?p2=u1#step2'
    );
  });

  it('does not double up separators on a trailing ? or &', () => {
    expect(appendAttribution('https://b.example.com/a?', { p2: 'u1' })).toBe(
      'https://b.example.com/a?p2=u1'
    );
    expect(appendAttribution('https://b.example.com/a?x=1&', { p2: 'u1' })).toBe(
      'https://b.example.com/a?x=1&p2=u1'
    );
  });
});

describe('findPlaceholder / assertNoPlaceholders', () => {
  // Spec test case 10.
  it('detects the placeholder that shipped to production', () => {
    const url = 'https://track.techtrack.in/click?campaign_id=99&click_id={click_id}';
    expect(findPlaceholder(url)).toBe('{click_id}');
    expect(() => assertNoPlaceholders(url)).toThrow(UnsubstitutedPlaceholderError);
  });

  it('detects a placeholder in the path or in a param key, not just in a value', () => {
    expect(findPlaceholder('https://b.example.com/{user_id}/apply')).toBe('{user_id}');
    expect(findPlaceholder('https://b.example.com/a?{click_id}=1')).toBe('{click_id}');
  });

  it('detects an empty placeholder', () => {
    expect(findPlaceholder('https://b.example.com/a?x={}')).toBe('{}');
  });

  it('passes a clean URL through unchanged', () => {
    const clean = 'https://track.techtrack.in/click?campaign_id=99&p2=u1&p3=d1';
    expect(findPlaceholder(clean)).toBeNull();
    expect(assertNoPlaceholders(clean)).toBe(clean);
  });

  it('carries the offending placeholder and URL on the error', () => {
    try {
      assertNoPlaceholders('https://b.example.com/a?c={click_id}');
      expect.unreachable('should have thrown');
    } catch (error) {
      const err = error as UnsubstitutedPlaceholderError;
      expect(err.placeholder).toBe('{click_id}');
      expect(err.url).toBe('https://b.example.com/a?c={click_id}');
    }
  });
});

describe('stripPlaceholderParams', () => {
  it('drops the whole pair rather than emitting an empty value', () => {
    const result = stripPlaceholderParams('https://b.example.com/a?x=1&click_id={click_id}&y=2');
    expect(result).toBe('https://b.example.com/a?x=1&y=2');
    expect(result).not.toContain('click_id');
  });

  it('drops a pair whose KEY carries the placeholder', () => {
    expect(stripPlaceholderParams('https://b.example.com/a?{click_id}=1&y=2')).toBe(
      'https://b.example.com/a?y=2'
    );
  });

  it('removes the query string entirely when every pair is a placeholder', () => {
    expect(stripPlaceholderParams('https://b.example.com/a?c={click_id}&u={user_id}')).toBe(
      'https://b.example.com/a'
    );
  });

  it('preserves the fragment', () => {
    expect(stripPlaceholderParams('https://b.example.com/a?c={click_id}&y=2#frag')).toBe(
      'https://b.example.com/a?y=2#frag'
    );
  });

  it('leaves a URL with no query untouched', () => {
    expect(stripPlaceholderParams('https://b.example.com/a')).toBe('https://b.example.com/a');
  });
});

describe('appendAttribution de-duplication', () => {
  /**
   * The catalogue URLs carry a {user_id} macro that expands to p2 during
   * substitution. Appending p2 unconditionally then emitted it twice —
   * "...&p2=banxx&p2=banxx" — leaving the tracking network to pick one.
   */
  it('does not append p2 when the URL already carries it', () => {
    const substituted = substitutePlaceholders(
      'https://track.techtrack.in/click?campaign_id=79&p1={click_id}&p2={user_id}'
    );
    const final = appendAttribution(substituted, { p2: PARTNER_ID, p3: 'DSA-7' });
    expect((final.match(/[?&]p2=/g) || []).length).toBe(1);
    expect(final).toBe('https://track.techtrack.in/click?campaign_id=79&p2=banxx&p3=DSA-7');
  });

  it('does not append p3 when the URL already carries it', () => {
    const final = appendAttribution('https://b.example.com/a?p3=existing', { p3: 'DSA-7' });
    expect(final).toBe('https://b.example.com/a?p3=existing');
  });

  it('still appends a key the URL does not have', () => {
    const final = appendAttribution('https://b.example.com/a?p2=banxx', { p2: PARTNER_ID, p3: 'D1' });
    expect(final).toBe('https://b.example.com/a?p2=banxx&p3=D1');
  });

  it('does not treat a key that merely appears inside a value as present', () => {
    const final = appendAttribution('https://b.example.com/a?ref=xp2=y', { p2: PARTNER_ID });
    expect(final).toBe('https://b.example.com/a?ref=xp2=y&p2=banxx');
  });
});

describe('substitutePlaceholders', () => {
  it('substitutes EVERY {user_id} occurrence with the partner id, not just the first', () => {
    expect(substitutePlaceholders('https://b.example.com/a?u={user_id}&v={user_id}')).toBe(
      'https://b.example.com/a?u=banxx&v=banxx'
    );
  });

  /**
   * p2 is the partner slot on the outbound side. It must not vary per visitor,
   * so the inbound Credit Links user id is deliberately not threaded in here.
   */
  it('always substitutes the partner id, never a per-visitor value', () => {
    expect(substitutePlaceholders('https://b.example.com/a?p2={user_id}')).toBe(
      'https://b.example.com/a?p2=banxx'
    );
    expect(PARTNER_ID).toBe('banxx');
  });

  it('substitutes what it can and strips the rest, leaving nothing unfilled', () => {
    const result = substitutePlaceholders(
      'https://track.techtrack.in/click?campaign_id=99&u={user_id}&c={click_id}'
    );
    expect(result).toBe('https://track.techtrack.in/click?campaign_id=99&u=banxx');
    expect(findPlaceholder(result)).toBeNull();
  });

  /**
   * The legacy implementation returned the raw URL with placeholders intact
   * whenever `new URL()` threw, which an unsubstituted `{...}` can cause. This
   * is string-level, so there is no parse to fail.
   */
  it('still strips placeholders from input that is not a parseable URL', () => {
    expect(findPlaceholder(substitutePlaceholders('not a url?c={click_id}'))).toBeNull();
  });
});

