"use client";
import { useState } from "react";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";

type ResultState = null | "eligible" | "not-eligible";

const inputCls =
  "w-full h-11 px-3 text-sm bg-white rounded-lg outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#BDE6E2]";

const InlineEligibilityChecker = () => {
  const [pincode, setPincode] = useState("");
  const [income, setIncome] = useState("");
  const [employment, setEmployment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!/^\d{6}$/.test(pincode)) newErrors.pincode = "Enter a valid 6-digit pincode";
    const incomeNum = Number(income.replace(/,/g, ""));
    if (!income || isNaN(incomeNum) || incomeNum < 1000)
      newErrors.income = "Enter a valid monthly income";
    if (!employment) newErrors.employment = "Select employment status";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const incomeNum = Number(income.replace(/,/g, ""));
      setResult(incomeNum >= 15000 ? "eligible" : "not-eligible");
      setLoading(false);
    }, 1500);
  };

  const handleReset = () => {
    setResult(null);
    setPincode("");
    setIncome("");
    setEmployment("");
    setErrors({});
  };

  return (
    <section
      className="py-8 md:py-12"
      style={{ backgroundColor: "#F7FFFE", borderTop: "3px solid #BDE6E2" }}
    >
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6 text-center">
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-1"
            style={{ color: "#2D6B63" }}
          >
            Quick Check
          </p>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#0D2B28" }}>
            Check Your Card Eligibility
          </h2>
        </div>

        <div
          className="rounded-xl p-6 md:p-8"
          style={{
            backgroundColor: "white",
            border: "0.5px solid #BDE6E2",
            boxShadow: "0 2px 12px rgba(45,107,99,0.06)",
          }}
        >
          {result === null ? (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "#0D2B28" }}>
                  Pincode
                </label>
                <input
                  placeholder="Enter 6-digit pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={inputCls}
                  style={{ border: "0.5px solid #BDE6E2" }}
                />
                {errors.pincode && (
                  <p className="text-xs text-red-500">{errors.pincode}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "#0D2B28" }}>
                  Monthly Income (₹)
                </label>
                <input
                  placeholder="e.g., 50000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^\d,]/g, ""))}
                  className={inputCls}
                  style={{ border: "0.5px solid #BDE6E2" }}
                />
                {errors.income && (
                  <p className="text-xs text-red-500">{errors.income}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "#0D2B28" }}>
                  Employment Status
                </label>
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className={inputCls}
                  style={{ border: "0.5px solid #BDE6E2" }}
                >
                  <option value="">Select status</option>
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self-Employed</option>
                </select>
                {errors.employment && (
                  <p className="text-xs text-red-500">{errors.employment}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-11 px-6 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
                style={{ backgroundColor: "#1A3B38", color: "#BDE6E2" }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#0D2B28")}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1A3B38")}
              >
                <Shield className="h-4 w-4" />
                {loading ? "Checking…" : "Check Eligibility"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              {result === "eligible" ? (
                <>
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#BDE6E2" }}
                  >
                    <CheckCircle2 className="h-8 w-8" style={{ color: "#1A3B38" }} />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: "#0D2B28" }}>
                    Great News! You're Eligible
                  </h3>
                  <p className="text-sm max-w-md" style={{ color: "#2D6B63" }}>
                    Based on your details, you qualify for multiple premium credit cards.
                    Explore our tools to find the perfect match.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: "#0D2B28" }}>
                    Limited Eligibility
                  </h3>
                  <p className="text-sm max-w-md" style={{ color: "#2D6B63" }}>
                    Based on your current income, options may be limited. Check our blog
                    for tips on improving eligibility.
                  </p>
                </>
              )}
              <button
                onClick={handleReset}
                className="mt-2 px-8 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  border: "1px solid #2D6B63",
                  color: "#2D6B63",
                  backgroundColor: "transparent",
                }}
              >
                Check Again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InlineEligibilityChecker;
