"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { cardService, extractEligibleAliases } from '@/services/cardService';
import {
  isValidPincode,
  normalizeMonthlySalary,
  toBreIncome,
  type EmpStatus,
} from '@/lib/eligibilityParams';
import { loadEligibility, perCardKey, saveEligibility } from '@/lib/eligibilityStore';
import { toast } from 'sonner';
import EligibilityResultDialog from './EligibilityResultDialog';
import {
  trackEligibilityModalDetailsFilled,
  trackEligibilityModalCheckClicked,
  trackEligibilityModalCancelClicked,
  trackEligibilityModalClosed,
  trackEligibilityModalSubmitted,
  trackEligibilityModalPassed,
  trackEligibilityModalFailed,
} from '@/services/journeyTrack';

interface EligibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardAlias: string;
  cardName: string;
  networkUrl?: string;
  onEligibilityComplete?: () => void;
  onEligibilityReset?: () => void;
}

interface FormData {
  pincode: string;
  inhandIncome: string;
  empStatus: EmpStatus | '';
}

interface FormErrors {
  pincode?: string;
  inhandIncome?: string;
  empStatus?: string;
}

export default function EligibilityDialog({
  open,
  onOpenChange,
  cardAlias,
  cardName,
  networkUrl,
  onEligibilityComplete,
  onEligibilityReset
}: EligibilityDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    pincode: '',
    inhandIncome: '',
    empStatus: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  // Rate limiting: max 3 checks per minute
  const [checkCount, setCheckCount] = useState(0);
  const [lastResetTime, setLastResetTime] = useState(Date.now());

  useEffect(() => {
    // Prefill: this card's own last answer first, then the session-wide
    // eligibility basis (which URL hydration writes), so a user who arrived
    // from a partner link is never asked for details they already supplied.
    const savedData = sessionStorage.getItem(perCardKey(cardAlias));
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
        return;
      } catch {
        /* fall through to the global basis */
      }
    }

    const basis = loadEligibility();
    if (basis.pincode || basis.inhandIncome || basis.empStatus) {
      setFormData({
        pincode: basis.pincode ?? '',
        inhandIncome: basis.inhandIncome ? String(basis.inhandIncome) : '',
        empStatus: basis.empStatus ?? '',
      });
    }
  }, [cardAlias]);

  useEffect(() => {
    // Reset rate limit counter every minute
    const now = Date.now();
    if (now - lastResetTime > 60000) {
      setCheckCount(0);
      setLastResetTime(now);
    }
  }, [lastResetTime]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Shared validators: the adapter and every form surface must agree, or a
    // value the adapter rejected could be accepted here on retype.
    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!isValidPincode(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    if (!formData.inhandIncome) {
      newErrors.inhandIncome = 'Income is required';
    } else if (!normalizeMonthlySalary(formData.inhandIncome).ok) {
      newErrors.inhandIncome = 'Please enter a valid monthly income';
    }

    // Employment status validation
    if (!formData.empStatus) {
      newErrors.empStatus = 'Please select your employment status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    trackEligibilityModalCheckClicked(cardAlias);

    if (!validateForm()) {
      return;
    }

    trackEligibilityModalDetailsFilled(formData.pincode, formData.inhandIncome.replace(/,/g, ''), formData.empStatus, cardAlias);

    setIsSubmitting(true);

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'eligibility_form_submit', {
        card_alias: cardAlias,
        income_range: getIncomeRange(formData.inhandIncome),
        emp_status: formData.empStatus
      });
    }

    try {
      // Save to session storage for prefill, both per-card and session-wide.
      sessionStorage.setItem(perCardKey(cardAlias), JSON.stringify(formData));

      const monthly = normalizeMonthlySalary(formData.inhandIncome);
      const empStatus = formData.empStatus as EmpStatus;
      saveEligibility({
        pincode: formData.pincode,
        inhandIncome: monthly.ok ? monthly.value : undefined,
        empStatus,
      });

      const response = await cardService.checkEligibility({
        pincode: formData.pincode,
        // toBreIncome documents the unit: the API takes MONTHLY rupees.
        inhandIncome: toBreIncome(monthly.value),
        empStatus,
      });

      const isEligible = extractEligibleAliases(response).includes(cardAlias);

      // Track result analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'eligibility_result', {
          card_alias: cardAlias,
          eligible: isEligible,
        });
      }

      const incomeForEvent = formData.inhandIncome.replace(/,/g, '');
      trackEligibilityModalSubmitted(cardAlias, formData.pincode, incomeForEvent, formData.empStatus, isEligible);
      if (isEligible) {
        trackEligibilityModalPassed(cardAlias);
      } else {
        trackEligibilityModalFailed(cardAlias, 'not_eligible');
      }

      setEligibilityResult(response);
      setShowResult(true);
      onEligibilityComplete?.();
      // Don't call onOpenChange(false) — keep parent state alive so recheck can reopen form

    } catch (error: any) {
      console.error('Eligibility check error:', error);

      if (error?.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('We couldn\'t check eligibility right now. Please try again.', {
          action: {
            label: 'Retry',
            onClick: () => handleSubmit(e)
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIncomeRange = (income: string): string => {
    const num = parseInt(income.replace(/,/g, ''));
    if (num < 30000) return '<30k';
    if (num < 50000) return '30k-50k';
    if (num < 100000) return '50k-100k';
    return '100k+';
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleIncomeChange = (value: string) => {
    // Allow only numbers and format with commas
    const cleaned = value.replace(/[^\d]/g, '');
    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    handleInputChange('inhandIncome', formatted);
  };

  return (
    <>
      <Dialog open={open && !showResult} onOpenChange={(o) => { if (!o) trackEligibilityModalClosed(cardAlias); onOpenChange(o); }}>
        <DialogContent className="sm:max-w-[500px]" aria-labelledby="eligibility-dialog-title">
          <DialogHeader>
            <DialogTitle id="eligibility-dialog-title">Quick Eligibility Check - No Docs</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter your 6-digit pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, ''))}
                aria-invalid={!!errors.pincode}
                aria-describedby={errors.pincode ? 'pincode-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.pincode && (
                <p id="pincode-error" className="text-sm text-destructive">
                  {errors.pincode}
                </p>
              )}
            </div>

            {/* Income */}
            <div className="space-y-2">
              <Label htmlFor="income">In-hand Income (₹ / month)</Label>
              <Input
                id="income"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 50,000"
                value={formData.inhandIncome}
                onChange={(e) => handleIncomeChange(e.target.value)}
                aria-invalid={!!errors.inhandIncome}
                aria-describedby={errors.inhandIncome ? 'income-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.inhandIncome && (
                <p id="income-error" className="text-sm text-destructive">
                  {errors.inhandIncome}
                </p>
              )}
            </div>

            {/* Employment Status */}
            <div className="space-y-2">
              <Label htmlFor="employment">Employment Status</Label>
              <RadioGroup
                value={formData.empStatus}
                onValueChange={(value) => handleInputChange('empStatus', value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.empStatus}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="salaried" id="salaried" />
                  <Label htmlFor="salaried" className="font-normal cursor-pointer">
                    Salaried
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="self_employed" id="self-employed" />
                  <Label htmlFor="self-employed" className="font-normal cursor-pointer">
                    Self-employed
                  </Label>
                </div>
              </RadioGroup>
              {errors.empStatus && (
                <p className="text-sm text-destructive">
                  {errors.empStatus}
                </p>
              )}
            </div>

            {/* Privacy Notice */}
            <p className="text-xs text-muted-foreground">
              We only use this info to check eligibility. No documents required.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { trackEligibilityModalCancelClicked(cardAlias); onOpenChange(false); }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <EligibilityResultDialog
        open={showResult}
        onOpenChange={(resultOpen) => {
          setShowResult(resultOpen);
          if (!resultOpen) {
            // Closing result dialog → propagate to parent
            onOpenChange(false);
          }
        }}
        result={eligibilityResult}
        cardName={cardName}
        cardAlias={cardAlias}
        networkUrl={networkUrl}
        onRecheck={() => {
          // Reset result state and show form again
          setShowResult(false);
          setEligibilityResult(null);
          onEligibilityReset?.();
          // Form dialog reopens automatically (open && !showResult)
        }}
      />
    </>
  );
}
