import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EligibilityChips } from './EligibilityChips';

const basis = {
  pincode: '560001',
  inhandIncome: 50000,
  empStatus: 'salaried' as const,
};

describe('EligibilityChips', () => {
  it('shows the eligibility basis the results are built on', () => {
    render(<EligibilityChips basis={basis} onChange={vi.fn()} />);

    expect(screen.getByText('₹50,000/mo')).toBeInTheDocument();
    expect(screen.getByText('560001')).toBeInTheDocument();
    expect(screen.getByText('Salaried')).toBeInTheDocument();
  });

  it('labels an unresolved value rather than inventing one', () => {
    render(<EligibilityChips basis={{}} onChange={vi.fn()} />);

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Pincode')).toBeInTheDocument();
    expect(screen.getByText('Employment')).toBeInTheDocument();
  });

  // Spec test case 8: an edit re-runs eligibility with the edited basis.
  it('emits the full basis with the edited salary', () => {
    const onChange = vi.fn();
    render(<EligibilityChips basis={basis} onChange={onChange} />);

    fireEvent.click(screen.getByText('₹50,000/mo'));
    const input = screen.getByLabelText(/monthly in-hand income/i);
    fireEvent.change(input, { target: { value: '75,000' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(onChange).toHaveBeenCalledWith({
      pincode: '560001',
      inhandIncome: 75000,
      empStatus: 'salaried',
    });
  });

  it('emits the full basis with the edited pincode', () => {
    const onChange = vi.fn();
    render(<EligibilityChips basis={basis} onChange={onChange} />);

    fireEvent.click(screen.getByText('560001'));
    fireEvent.change(screen.getByLabelText(/^pincode$/i), { target: { value: '110001' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(onChange).toHaveBeenCalledWith({
      pincode: '110001',
      inhandIncome: 50000,
      empStatus: 'salaried',
    });
  });

  it('applies the shared validators, so a chip cannot accept what the adapter rejects', () => {
    const onChange = vi.fn();
    render(<EligibilityChips basis={basis} onChange={onChange} />);

    fireEvent.click(screen.getByText('560001'));
    // Leading zero: rejected by the adapter, so it must be rejected here too.
    fireEvent.change(screen.getByLabelText(/^pincode$/i), { target: { value: '012345' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/valid 6-digit pincode/i)).toBeInTheDocument();
  });

  it('rejects a non-numeric salary', () => {
    const onChange = vi.fn();
    render(<EligibilityChips basis={basis} onChange={onChange} />);

    fireEvent.click(screen.getByText('₹50,000/mo'));
    fireEvent.change(screen.getByLabelText(/monthly in-hand income/i), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/valid monthly income/i)).toBeInTheDocument();
  });

  it('emits the underscore wire value when employment type is changed', () => {
    const onChange = vi.fn();
    render(<EligibilityChips basis={basis} onChange={onChange} />);

    fireEvent.click(screen.getByText('Salaried'));
    fireEvent.click(screen.getByLabelText(/self-employed/i));

    expect(onChange).toHaveBeenCalledWith({
      pincode: '560001',
      inhandIncome: 50000,
      empStatus: 'self_employed',
    });
  });
});
