export function calculateBorrowerProfile(input) {
  const {
    income = 0,
    incomeType = 'salaried',
    existingEMIs = 0,
    requestedAmount = 0,
    creditScore = null,
    bouncesLast12M = 0,
    collateralValue = 0
  } = input;

  let foirCap = incomeType === 'self_employed' ? 0.40 : (incomeType === 'informal' ? 0.30 : 0.50);
  const totalAllowedEMI = income * foirCap;
  const safeAvailableEMI = Math.max(0, totalAllowedEMI - existingEMIs);

  if (bouncesLast12M > 0 || (income > 0 && (existingEMIs / income) > 0.55)) {
    return {
      verdict: "Don't Borrow",
      reason: "High debt obligations or recent bounces detected.",
      maxLenderSanction: 0,
      maxBorrowerSafe: 0,
      fairRateBand: "N/A",
      maxSafeEMI: 0
    };
  }

  if (incomeType === 'self_employed' && collateralValue > 0 && requestedAmount > (income * 12)) {
    return {
      verdict: "Borrow Less / Pivot to LAP",
      reason: "Unsecured limit too low based on ITR. Pledging property offers better rates.",
      maxLenderSanction: Math.min(income * 10, 350000),
      maxBorrowerSafe: Math.min(collateralValue * 0.50, requestedAmount),
      fairRateBand: "11.5% - 13.5%",
      maxSafeEMI: safeAvailableEMI
    };
  }

  const monthlyRate = 0.11 / 12;
  const maxSafeLoan = Math.round((safeAvailableEMI * (1 - Math.pow(1 + monthlyRate, -60))) / monthlyRate);

  return {
    verdict: "Borrow",
    reason: "Low FOIR and steady income profile.",
    maxLenderSanction: Math.round(maxSafeLoan * 1.5),
    maxBorrowerSafe: Math.min(maxSafeLoan, requestedAmount),
    fairRateBand: creditScore >= 750 ? "10.5% - 12.0%" : "13.0% - 16.0%",
    maxSafeEMI: Math.round(safeAvailableEMI)
  };
}
