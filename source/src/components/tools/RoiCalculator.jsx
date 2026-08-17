import { useState } from 'react';
import { calculatePropertyRoi } from '../../lib/roi.js';

const FIELDS = [
  {
    key: 'annualRent',
    id: 'roi-annual-rent',
    label: 'Annual rent',
    hint: 'Total rent you expect to collect for one year.'
  },
  {
    key: 'annualExpenses',
    id: 'roi-annual-expenses',
    label: 'Annual operating expenses',
    hint: 'Costs you record, such as maintenance, utilities, insurance, and taxes.'
  },
  {
    key: 'purchasePrice',
    id: 'roi-purchase-price',
    label: 'Purchase price',
    hint: 'What you paid, or expect to pay, for the property.'
  },
  {
    key: 'cashInvested',
    id: 'roi-cash-invested',
    label: 'Cash invested',
    hint: 'The cash you put into the purchase.'
  }
];

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

export default function RoiCalculator() {
  const [values, setValues] = useState(
    Object.fromEntries(FIELDS.map((field) => [field.key, '']))
  );

  const outcome = (() => {
    const parsed = {};
    for (const field of FIELDS) {
      const raw = values[field.key].trim();
      if (raw === '') {
        return { state: 'incomplete' };
      }
      const number = Number(raw);
      if (!Number.isFinite(number) || number < 0) {
        return { state: 'invalid' };
      }
      parsed[field.key] = number;
    }
    try {
      return { state: 'ready', result: calculatePropertyRoi(parsed) };
    } catch {
      return { state: 'invalid' };
    }
  })();

  function update(fieldKey, value) {
    setValues((current) => ({ ...current, [fieldKey]: value }));
  }

  return (
    <section
      aria-labelledby="roi-calculator-title"
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h2
        id="roi-calculator-title"
        className="text-xl font-bold tracking-tight text-white"
      >
        Rental property ROI calculator
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Enter annual rent, operating expenses, purchase price, and cash invested.
        Amounts appear in the currency you enter.
      </p>

      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-slate-300">
              {field.label}
            </label>
            <input
              id={field.id}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={values[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0b0e14] px-3 py-2 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            />
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{field.hint}</p>
          </div>
        ))}
      </form>

      <div role="status" aria-live="polite" className="mt-6">
        {outcome.state === 'ready' ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Net income (annual)
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {numberFormatter.format(outcome.result.netIncome)}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Gross yield
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {formatPercent(outcome.result.grossYieldPct)}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Net yield
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {formatPercent(outcome.result.netYieldPct)}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Cash on cash
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {formatPercent(outcome.result.cashOnCashPct)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm leading-relaxed text-slate-400">
            {outcome.state === 'incomplete'
              ? 'Enter numbers for all four fields to see estimates.'
              : 'Enter non-negative numbers for all four fields. Purchase price and cash invested must be greater than zero.'}
          </p>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Results are estimates based on the numbers you enter. They exclude
        financing, taxes, appreciation, vacancy, and jurisdiction-specific
        rules unless you entered them as operating expenses.
      </p>
    </section>
  );
}
