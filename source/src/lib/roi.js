const PERCENT_DECIMALS = 2;

function toPercent(value) {
  return Number(value.toFixed(PERCENT_DECIMALS));
}

function validateInput(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('calculatePropertyRoi expects an input object');
  }

  const fields = {
    annualRent: input.annualRent,
    annualExpenses: input.annualExpenses,
    purchasePrice: input.purchasePrice,
    cashInvested: input.cashInvested
  };

  const labels = {
    annualRent: 'annual rent',
    annualExpenses: 'annual expenses',
    purchasePrice: 'purchase price',
    cashInvested: 'cash invested'
  };

  for (const [name, value] of Object.entries(fields)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`calculatePropertyRoi requires a finite number for ${labels[name]}`);
    }
    if (value < 0) {
      throw new RangeError(`calculatePropertyRoi requires non-negative ${labels[name]}`);
    }
  }

  if (fields.purchasePrice === 0) {
    throw new RangeError('calculatePropertyRoi requires a purchase price greater than zero');
  }
  if (fields.cashInvested === 0) {
    throw new RangeError('calculatePropertyRoi requires cash invested greater than zero');
  }

  return fields;
}

/**
 * Estimates rental property ROI from the numbers the user enters.
 *
 * Only operating expenses entered by the user reduce income: financing,
 * taxes, appreciation, vacancy, and jurisdiction-specific assumptions are
 * excluded unless the user records them as operating expenses. Percentages
 * are rounded to two decimals and are estimates, not guarantees.
 */
export function calculatePropertyRoi(input) {
  const { annualRent, annualExpenses, purchasePrice, cashInvested } = validateInput(input);
  const netIncome = annualRent - annualExpenses;

  return {
    netIncome,
    grossYieldPct: toPercent((annualRent / purchasePrice) * 100),
    netYieldPct: toPercent((netIncome / purchasePrice) * 100),
    cashOnCashPct: toPercent((netIncome / cashInvested) * 100)
  };
}
