import { describe, expect, it } from 'vitest';
import {
  MONTHLY_INCOME_MAX,
  MONTHLY_INCOME_MIN,
  isValidPincode,
  normalizeEmpStatus,
  normalizeMonthlySalary,
  normalizePincode,
  toBreIncome,
} from './eligibilityParams';

describe('normalizeMonthlySalary', () => {
  // Spec test case 2.
  it('parses a comma-separated salary', () => {
    expect(normalizeMonthlySalary('50,000')).toEqual({ ok: true, value: 50000 });
  });

  it('strips currency symbols, spaces and separators', () => {
    for (const input of ['₹50000', '₹ 50,000', 'Rs. 50,000', 'Rs 50000', 'INR 50,000', ' 50 000 ']) {
      expect(normalizeMonthlySalary(input), input).toEqual({ ok: true, value: 50000 });
    }
  });

  // Spec test case 3.
  it('rejects a non-numeric salary as not_numeric, never as a default', () => {
    expect(normalizeMonthlySalary('abc')).toEqual({ ok: false, reason: 'not_numeric' });
  });

  it('rejects signed, exponent and partial-numeric input', () => {
    for (const input of ['-5000', '+5000', '5e4', '50000abc', '5,00,0x0']) {
      expect(normalizeMonthlySalary(input).ok, input).toBe(false);
    }
  });

  it('treats an absent or blank value as missing, not invalid', () => {
    expect(normalizeMonthlySalary(null)).toEqual({ ok: false, reason: 'missing' });
    expect(normalizeMonthlySalary('')).toEqual({ ok: false, reason: 'missing' });
    expect(normalizeMonthlySalary('   ')).toEqual({ ok: false, reason: 'missing' });
  });

  it('applies the sanity band', () => {
    expect(normalizeMonthlySalary(String(MONTHLY_INCOME_MIN - 1))).toEqual({
      ok: false,
      reason: 'out_of_range',
    });
    expect(normalizeMonthlySalary(String(MONTHLY_INCOME_MAX + 1))).toEqual({
      ok: false,
      reason: 'out_of_range',
    });
    expect(normalizeMonthlySalary(String(MONTHLY_INCOME_MIN)).ok).toBe(true);
    expect(normalizeMonthlySalary(String(MONTHLY_INCOME_MAX)).ok).toBe(true);
  });

  it('rounds a fractional amount rather than rejecting it', () => {
    expect(normalizeMonthlySalary('50000.60')).toEqual({ ok: true, value: 50001 });
  });
});

describe('toBreIncome', () => {
  /**
   * The eligibility API takes MONTHLY rupees, so this is identity. The test
   * exists to fail loudly if anyone introduces a 12x here, which would shift
   * every user into the wrong eligibility band while still returning a
   * plausible-looking card set.
   */
  it('passes monthly rupees through unchanged', () => {
    expect(toBreIncome(50000)).toBe(50000);
    expect(toBreIncome(1)).toBe(1);
    expect(toBreIncome(1234567)).toBe(1234567);
  });
});

describe('normalizePincode', () => {
  it('accepts a valid Indian pincode', () => {
    expect(normalizePincode('560001')).toEqual({ ok: true, value: '560001' });
    expect(normalizePincode(' 110001 ')).toEqual({ ok: true, value: '110001' });
  });

  // Spec test case 4: the legacy /^\d{6}$/ rule wrongly accepted this.
  it('rejects a pincode starting with zero', () => {
    expect(normalizePincode('012345')).toEqual({ ok: false, reason: 'bad_format' });
    expect(isValidPincode('012345')).toBe(false);
  });

  it('rejects wrong lengths and non-digits', () => {
    for (const input of ['12345', '1234567', '56000a', '5600 01']) {
      expect(normalizePincode(input).ok, input).toBe(false);
    }
  });

  it('reports an absent pincode as missing', () => {
    expect(normalizePincode(null)).toEqual({ ok: false, reason: 'missing' });
  });

  it('agrees with the boolean form validator, so the adapter and forms cannot diverge', () => {
    for (const input of ['560001', '012345', '12345', 'abcdef', '999999']) {
      expect(isValidPincode(input), input).toBe(normalizePincode(input).ok);
    }
  });
});

describe('normalizeEmpStatus', () => {
  it('normalises salaried in any case', () => {
    for (const input of ['salaried', 'Salaried', 'SALARIED', ' salaried ']) {
      expect(normalizeEmpStatus(input), input).toEqual({ ok: true, value: 'salaried' });
    }
  });

  // Spec test case 5, plus every alias in the param contract.
  it('normalises every self-employed alias to the underscore wire value', () => {
    for (const input of [
      'self-employed',
      'self employed',
      'SELF EMPLOYED',
      'self_employed',
      'SELF_EMPLOYED',
      'selfemployed',
      'Self-Employed',
    ]) {
      expect(normalizeEmpStatus(input), input).toEqual({ ok: true, value: 'self_employed' });
    }
  });

  it('never emits the hyphenated form', () => {
    const result = normalizeEmpStatus('self-employed');
    expect(result.value).toBe('self_employed');
    expect(result.value).not.toBe('self-employed');
  });

  // Spec test case 6.
  it('leaves an unknown value unresolved rather than guessing', () => {
    for (const input of ['student', 'retired', 'freelance', 'business']) {
      expect(normalizeEmpStatus(input), input).toEqual({ ok: false, reason: 'unknown_enum' });
    }
  });

  it('reports an absent value as missing', () => {
    expect(normalizeEmpStatus(null)).toEqual({ ok: false, reason: 'missing' });
    expect(normalizeEmpStatus('')).toEqual({ ok: false, reason: 'missing' });
  });
});
