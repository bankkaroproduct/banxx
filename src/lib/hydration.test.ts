import { describe, expect, it } from 'vitest';
import { hasPartnerParams, hydrateFromParams } from './hydration';

const params = (query: string) => new URLSearchParams(query);

describe('hydrateFromParams', () => {
  // Spec test case 1.
  it('resolves a complete partner link', () => {
    const result = hydrateFromParams(
      params(
        'utm_source=creditlinks&utm_medium=affiliate&utm_campaign=jan&p1=&p2=user-42&p3=DSA-7&sal=50000&pin=560001&st=salaried'
      )
    );

    expect(result.resolved).toBe(true);
    expect(result.attempted).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.firstUnresolvedField).toBeNull();
    expect(result.eligibility).toEqual({
      inhandIncome: 50000,
      pincode: '560001',
      empStatus: 'salaried',
    });
  });

  it('captures attribution and drops the empty reserved p1', () => {
    const result = hydrateFromParams(
      params('p1=&p2=user-42&p3=DSA-7&utm_source=creditlinks&utm_medium=affiliate&utm_campaign=jan')
    );

    expect(result.attribution).toEqual({
      p2: 'user-42',
      p3: 'DSA-7',
      utm_source: 'creditlinks',
      utm_medium: 'affiliate',
      utm_campaign: 'jan',
    });
    expect(result.attribution).not.toHaveProperty('p1');
  });

  it('passes p1 through untouched when it has a value', () => {
    const result = hydrateFromParams(params('p1=anything{raw}'));
    expect(result.attribution.p1).toBe('anything{raw}');
  });

  // Spec test case 2.
  it('parses a comma-separated salary as monthly', () => {
    const result = hydrateFromParams(params('sal=50,000&pin=560001&st=salaried'));
    expect(result.eligibility.inhandIncome).toBe(50000);
    expect(result.resolved).toBe(true);
  });

  // Spec test case 3.
  it('keeps pin and st on a bad salary and focuses salary', () => {
    const result = hydrateFromParams(params('sal=abc&pin=560001&st=salaried'));

    expect(result.resolved).toBe(false);
    expect(result.eligibility.pincode).toBe('560001');
    expect(result.eligibility.empStatus).toBe('salaried');
    expect(result.firstUnresolvedField).toBe('inhandIncome');
    expect(result.failures).toEqual([
      { field: 'inhandIncome', param: 'sal', present: true, reason: 'not_numeric' },
    ]);
  });

  // Spec test case 4.
  it('leaves a zero-leading pincode unresolved', () => {
    const result = hydrateFromParams(params('sal=50000&pin=012345&st=salaried'));

    expect(result.resolved).toBe(false);
    expect(result.eligibility).not.toHaveProperty('pincode');
    expect(result.firstUnresolvedField).toBe('pincode');
    expect(result.failures[0].reason).toBe('bad_format');
  });

  // Spec test case 5.
  it('normalises a spaced, upper-case employment type to the wire value', () => {
    const result = hydrateFromParams(params('sal=50000&pin=560001&st=SELF%20EMPLOYED'));
    expect(result.eligibility.empStatus).toBe('self_employed');
    expect(result.resolved).toBe(true);
  });

  // Spec test case 6.
  it('leaves an unknown employment type unresolved', () => {
    const result = hydrateFromParams(params('sal=50000&pin=560001&st=student'));

    expect(result.resolved).toBe(false);
    expect(result.eligibility).not.toHaveProperty('empStatus');
    expect(result.firstUnresolvedField).toBe('empStatus');
    expect(result.failures[0]).toEqual({
      field: 'empStatus',
      param: 'st',
      present: true,
      reason: 'unknown_enum',
    });
  });

  // Spec test case 7.
  it('reports nothing attempted when there are no params', () => {
    const result = hydrateFromParams(params(''));

    expect(result.resolved).toBe(false);
    expect(result.attempted).toBe(false);
    expect(result.eligibility).toEqual({});
    expect(result.attribution).toEqual({});
    expect(result.failures.map((f) => f.reason)).toEqual(['missing', 'missing', 'missing']);
    expect(result.failures.every((f) => f.present === false)).toBe(true);
  });

  /**
   * The core contract: a param that fails to resolve is absent, never
   * defaulted. A defaulted salary or employment type produces a wrong card set
   * that looks plausible and survives UAT.
   */
  it('never substitutes a default for a failed param', () => {
    for (const query of [
      'sal=abc&pin=012345&st=student',
      'sal=0&pin=&st=',
      'sal=99999999999&pin=560001&st=salaried',
      'st=self-employed',
    ]) {
      const { eligibility, failures } = hydrateFromParams(params(query));
      for (const failure of failures) {
        expect(eligibility[failure.field], `${query} / ${failure.field}`).toBeUndefined();
      }
    }
  });

  it('distinguishes a missing param from a present-but-invalid one', () => {
    const missing = hydrateFromParams(params('pin=560001&st=salaried'));
    expect(missing.failures[0]).toEqual({
      field: 'inhandIncome',
      param: 'sal',
      present: false,
      reason: 'missing',
    });

    const invalid = hydrateFromParams(params('sal=abc&pin=560001&st=salaried'));
    expect(invalid.failures[0].present).toBe(true);
  });

  it('orders focus by salary, then pincode, then employment type', () => {
    expect(hydrateFromParams(params('')).firstUnresolvedField).toBe('inhandIncome');
    expect(hydrateFromParams(params('sal=50000')).firstUnresolvedField).toBe('pincode');
    expect(hydrateFromParams(params('sal=50000&pin=560001')).firstUnresolvedField).toBe('empStatus');
  });
});

describe('hasPartnerParams', () => {
  it('detects a partner arrival', () => {
    expect(hasPartnerParams(params('sal=50000'))).toBe(true);
    expect(hasPartnerParams(params('p2=user-42'))).toBe(true);
    expect(hasPartnerParams(params('utm_source=creditlinks'))).toBe(true);
  });

  it('does not fire on organic traffic or unrelated params', () => {
    expect(hasPartnerParams(params(''))).toBe(false);
    expect(hasPartnerParams(params('category=fuel&q=hdfc'))).toBe(false);
  });
});
