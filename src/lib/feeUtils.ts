export const formatFee = (val: any): string => {
  const base = Math.round(Number(val) || 0);
  if (base === 0) return 'Free';
  const withGST = Math.round(base * 1.18);
  return `₹${withGST.toLocaleString('en-IN')} (₹${base.toLocaleString('en-IN')} + GST)`;
};

export const feeCalc = (baseText: any) => {
  const base = Math.round(Number(baseText) || 0);
  if (base === 0) return {
    base: 0,
    withGST: 0,
    display: 'Free',
    inline: 'Free',
    tooltip: null,
  };
  const withGST = Math.round(base * 1.18);
  return {
    base,
    withGST,
    display: `₹${withGST.toLocaleString('en-IN')}`,
    inline: `₹${withGST.toLocaleString('en-IN')} (₹${base.toLocaleString('en-IN')} + GST)`,
    tooltip: `₹${base.toLocaleString('en-IN')} + GST`,
  };
};
