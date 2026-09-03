"use client";

import { useEffect, useState } from "react";
import { MapPin, Wallet, Briefcase, Pencil, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    EMP_STATUS_OPTIONS,
    isValidPincode,
    normalizeMonthlySalary,
    type EmpStatus,
} from "@/lib/eligibilityParams";

export interface EligibilityBasis {
    pincode?: string;
    /** Monthly rupees. */
    inhandIncome?: number;
    empStatus?: EmpStatus;
}

const formatInr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const EMP_LABEL: Record<EmpStatus, string> = {
    salaried: "Salaried",
    self_employed: "Self-employed",
};

/**
 * The eligibility basis currently filtering the results, as editable chips.
 *
 * This is a trust requirement, not decoration. A hydrated user never saw a
 * form, so without this row they cannot tell why a card was excluded, and
 * neither can Credit Links support when the user calls them.
 *
 * Editing a chip re-runs the eligibility call and re-filters. It only ever
 * touches the eligibility basis, never attribution, so p2/p3 and the utm values
 * cannot be dropped by an edit.
 */
export function EligibilityChips({
    basis,
    onChange,
    isUpdating = false,
}: {
    basis: EligibilityBasis;
    onChange: (next: EligibilityBasis) => void;
    isUpdating?: boolean;
}) {
    return (
        <div
            className="mb-4 flex flex-wrap items-center gap-2"
            aria-busy={isUpdating}
            data-testid="eligibility-chips"
        >
            <span className="text-xs font-medium text-muted-foreground">
                Showing cards for
            </span>

            <SalaryChip basis={basis} onChange={onChange} />
            <PincodeChip basis={basis} onChange={onChange} />
            <EmpStatusChip basis={basis} onChange={onChange} />

            {isUpdating && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating
                </span>
            )}
        </div>
    );
}

function Chip({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-surface-elevated-foreground transition-colors hover:border-primary"
                >
                    {icon}
                    <span className="figure">{label}</span>
                    <Pencil className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <span className="sr-only">Edit</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-popover" align="start">
                {children}
            </PopoverContent>
        </Popover>
    );
}

function SalaryChip({
    basis,
    onChange,
}: {
    basis: EligibilityBasis;
    onChange: (next: EligibilityBasis) => void;
}) {
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setDraft(basis.inhandIncome ? String(basis.inhandIncome) : "");
    }, [basis.inhandIncome]);

    const apply = () => {
        const parsed = normalizeMonthlySalary(draft);
        if (!parsed.ok) {
            setError("Enter a valid monthly income");
            return;
        }
        setError(null);
        onChange({ ...basis, inhandIncome: parsed.value });
    };

    return (
        <Chip
            icon={<Wallet className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />}
            label={basis.inhandIncome ? `${formatInr(basis.inhandIncome)}/mo` : "Income"}
        >
            <div className="space-y-2">
                <Label htmlFor="chip-income">Monthly in-hand income (₹)</Label>
                <Input
                    id="chip-income"
                    inputMode="numeric"
                    className="figure"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button size="sm" className="w-full" onClick={apply}>
                    Update
                </Button>
            </div>
        </Chip>
    );
}

function PincodeChip({
    basis,
    onChange,
}: {
    basis: EligibilityBasis;
    onChange: (next: EligibilityBasis) => void;
}) {
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setDraft(basis.pincode ?? "");
    }, [basis.pincode]);

    const apply = () => {
        if (!isValidPincode(draft)) {
            setError("Enter a valid 6-digit pincode");
            return;
        }
        setError(null);
        onChange({ ...basis, pincode: draft.trim() });
    };

    return (
        <Chip
            icon={<MapPin className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />}
            label={basis.pincode ?? "Pincode"}
        >
            <div className="space-y-2">
                <Label htmlFor="chip-pincode">Pincode</Label>
                <Input
                    id="chip-pincode"
                    inputMode="numeric"
                    maxLength={6}
                    className="figure"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button size="sm" className="w-full" onClick={apply}>
                    Update
                </Button>
            </div>
        </Chip>
    );
}

function EmpStatusChip({
    basis,
    onChange,
}: {
    basis: EligibilityBasis;
    onChange: (next: EligibilityBasis) => void;
}) {
    return (
        <Chip
            icon={<Briefcase className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />}
            label={basis.empStatus ? EMP_LABEL[basis.empStatus] : "Employment"}
        >
            <div className="space-y-3">
                <Label>Employment status</Label>
                <RadioGroup
                    value={basis.empStatus ?? ""}
                    onValueChange={(value) =>
                        onChange({ ...basis, empStatus: value as EmpStatus })
                    }
                >
                    {EMP_STATUS_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`chip-${option.value}`} />
                            <Label
                                htmlFor={`chip-${option.value}`}
                                className="cursor-pointer font-normal"
                            >
                                {option.label}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </Chip>
    );
}
