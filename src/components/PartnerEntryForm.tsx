"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { isValidPincode, normalizeMonthlySalary } from "@/lib/eligibilityParams";
import {
    trackEligibilityWidgetViewed,
    trackEligibilityFieldEntered,
} from "@/services/journeyTrack";

/**
 * Partner entry form (test harness).
 *
 * Simulates the Credit Links entry link: it collects the eligibility basis and
 * the attribution ids, builds the exact partner URL shape
 *   /?utm_source=..&utm_medium=affiliate&utm_campaign=..&p1=&p2=..&p3=..
 *    &sal=<monthly>&pin=<6-digit>&st=<s|se>
 * and navigates to it. The root route hydrates from those params and lands the
 * user on the eligibility-filtered listing — the same production code path a
 * real partner link exercises, so filling this form tests the whole flow.
 *
 * st is emitted in the partner's documented short form (s / se).
 */

type SalaryType = "s" | "se";

export default function PartnerEntryForm() {
    const router = useRouter();
    const [salary, setSalary] = useState("");
    const [pincode, setPincode] = useState("");
    const [salaryType, setSalaryType] = useState<SalaryType>("s");
    const [submitting, setSubmitting] = useState(false);

    /**
     * EVT-005 eligibility_widget_viewed — the form entering the viewport is
     * what separates a hero bounce from real intent, so it is observed rather
     * than fired on mount.
     */
    const formRef = useRef<HTMLFormElement>(null);
    const widgetSeen = useRef(false);
    useEffect(() => {
        const el = formRef.current;
        if (!el || typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && !widgetSeen.current) {
                    widgetSeen.current = true;
                    trackEligibilityWidgetViewed();
                    observer.disconnect();
                }
            },
            { threshold: 0.4 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    /** EVT-006 eligibility_field_entered — first VALID entry per field, once each. */
    const fieldsSeen = useRef<Set<string>>(new Set());
    const noteField = (field: "monthly_salary" | "pincode" | "salary_type", valid: boolean) => {
        if (!valid || fieldsSeen.current.has(field)) return;
        fieldsSeen.current.add(field);
        trackEligibilityFieldEntered(field);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const monthly = normalizeMonthlySalary(salary);
        if (!monthly.ok) {
            toast.error("Enter a valid monthly salary (numeric, e.g. 50000)");
            return;
        }
        if (!isValidPincode(pincode)) {
            toast.error("Enter a valid 6-digit pincode (e.g. 110001)");
            return;
        }

        setSubmitting(true);

        // Build the partner URL in the documented order. utm_* default to test
        // values; p1-p3 are reserved and always empty.
        const params = new URLSearchParams();
        params.set("utm_source", "test-form");
        params.set("utm_medium", "affiliate");
        params.set("utm_campaign", "test");
        params.set("p1", "");
        params.set("sal", String(monthly.value));
        params.set("pin", pincode.trim());
        params.set("st", salaryType);

        router.push(`/?${params.toString()}`);
    };

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-left shadow-lg md:p-8"
        >
            <div className="mb-5 space-y-1">
                <h2 className="text-lg font-semibold text-card-foreground">
                    Check your eligibility
                </h2>
                <p className="text-sm text-muted-foreground">
                    Enter three details to see the cards you qualify for.
                </p>
            </div>

            <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="entry-salary">Monthly salary (₹)</Label>
                        <Input
                            id="entry-salary"
                            inputMode="numeric"
                            placeholder="e.g. 50000"
                            value={salary}
                            onChange={(e) => {
                                setSalary(e.target.value);
                                noteField("monthly_salary", normalizeMonthlySalary(e.target.value).ok);
                            }}
                            className="figure"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="entry-pincode">Pincode</Label>
                        <Input
                            id="entry-pincode"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="e.g. 110001"
                            value={pincode}
                            onChange={(e) => {
                                const next = e.target.value.replace(/[^0-9]/g, "");
                                setPincode(next);
                                noteField("pincode", isValidPincode(next));
                            }}
                            className="figure"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="entry-salary-type">Salary type</Label>
                    <Select value={salaryType} onValueChange={(v) => {
                        setSalaryType(v as SalaryType);
                        noteField("salary_type", true);
                    }}>
                        <SelectTrigger id="entry-salary-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card z-50">
                            <SelectItem value="s">Salaried</SelectItem>
                            <SelectItem value="se">Self-employed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button type="submit" disabled={submitting} className="mt-6 h-12 w-full text-sm font-semibold">
                {submitting ? "Loading eligible cards…" : "Show my eligible cards"}
            </Button>
        </form>
    );
}
