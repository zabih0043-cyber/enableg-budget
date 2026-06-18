const STORAGE_PREFIX = "enableg-money-planner-v4";
const LEGACY_STORAGE_KEY = "enableg-money-planner-v3";
const CURRENCY_STORAGE_KEY = `${STORAGE_PREFIX}:currency`;

const DEFAULT_CURRENCY_CODE = "ZAR";

// A handful of common currencies are pinned to the top of the list so the most
// likely choices are reachable without scrolling. Everything else follows
// alphabetically by name.
const PINNED_CURRENCY_CODES = [
  "ZAR", "USD", "EUR", "GBP", "INR", "NGN", "KES", "GHS",
  "AUD", "CAD", "AED", "BRL", "JPY", "CNY"
];

// Minimal fallback used if the runtime can't enumerate ISO 4217 currencies
// (very old browsers). The generated list below normally supersedes this.
const FALLBACK_CURRENCY_CODES = [
  "ZAR", "USD", "EUR", "GBP", "INR", "NGN", "KES", "AUD", "CAD", "JPY"
];

function currencySymbolFor(code) {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol"
    }).formatToParts(0);

    const symbolPart = parts.find((part) => part.type === "currency");

    if (symbolPart && symbolPart.value) {
      return symbolPart.value;
    }
  } catch {
    // Unsupported currency code; fall back to the code itself below.
  }

  return code;
}

function buildCurrencyList() {
  let codes;

  try {
    codes = Intl.supportedValuesOf("currency");
  } catch {
    codes = FALLBACK_CURRENCY_CODES;
  }

  let displayNames = null;

  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
  } catch {
    displayNames = null;
  }

  const currencies = codes.map((code) => ({
    code,
    symbol: currencySymbolFor(code),
    label: (displayNames && displayNames.of(code)) || code
  }));

  const pinned = PINNED_CURRENCY_CODES
    .map((code) => currencies.find((currency) => currency.code === code))
    .filter(Boolean)
    .map((currency) => ({ ...currency, pinned: true }));

  const pinnedCodes = new Set(pinned.map((currency) => currency.code));

  const rest = currencies
    .filter((currency) => !pinnedCodes.has(currency.code))
    .map((currency) => ({ ...currency, pinned: false }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return [...pinned, ...rest];
}

export const CURRENCIES = buildCurrencyList();

let activeCurrencyCode = DEFAULT_CURRENCY_CODE;

export function getCurrencyByCode(code) {
  return CURRENCIES.find((currency) => currency.code === code) || CURRENCIES[0];
}

export function getActiveCurrency() {
  return getCurrencyByCode(activeCurrencyCode);
}

export function loadCurrency() {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);

    if (stored && CURRENCIES.some((currency) => currency.code === stored)) {
      activeCurrencyCode = stored;
    }
  } catch {
    // Ignore unavailable storage and fall back to the default currency.
  }

  return activeCurrencyCode;
}

export function setActiveCurrency(code) {
  if (CURRENCIES.some((currency) => currency.code === code)) {
    activeCurrencyCode = code;

    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // Ignore unavailable storage; the in-memory choice still applies.
    }
  }

  return getActiveCurrency();
}

export function createIncomeRow() {
  return { date: "", source: "", amount: "", notes: "" };
}

export function createNeedRow() {
  return { item: "", cost: "", priority: "High", due: "" };
}

export function createWantRow() {
  return { item: "", cost: "", notes: "" };
}

export function createGoalRow() {
  return {
    goal: "",
    targetAmount: "",
    currentSavings: "",
    deadline: "",
    notes: ""
  };
}

export function createDefaultState() {
  return {
    income: [createIncomeRow()],
    needs: [createNeedRow()],
    wants: [createWantRow()],
    savings: {
      emergencyBalance: "",
      monthlySalary: ""
    },
    goals: [createGoalRow()]
  };
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric"
});

function buildStorageKey(monthKey) {
  return `${STORAGE_PREFIX}:${monthKey}`;
}

export function getCurrentMonthKey(baseDate = new Date()) {
  const date = new Date(baseDate);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function formatMonthLabel(monthKey) {
  if (typeof monthKey !== "string") {
    return monthFormatter.format(new Date());
  }

  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month) {
    return monthKey;
  }

  return monthFormatter.format(new Date(year, month - 1, 1));
}

export function createMonthOptions(monthsBack = 12, monthsForward = 11) {
  const base = new Date();
  base.setDate(1);

  return Array.from({ length: monthsBack + monthsForward + 1 }, (_, index) => {
    const offset = index - monthsBack;
    const date = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const key = getCurrentMonthKey(date);

    return {
      key,
      label: formatMonthLabel(key)
    };
  });
}

function normalizeRows(rows, factory) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [factory()];
  }

  return rows.map((row) => ({
    ...factory(),
    ...(row && typeof row === "object" && !Array.isArray(row) ? row : {})
  }));
}

function normalizeState(parsed) {
  const fallback = createDefaultState();

  return {
    income: normalizeRows(parsed?.income, createIncomeRow),
    needs: normalizeRows(parsed?.needs, createNeedRow),
    wants: normalizeRows(parsed?.wants, createWantRow),
    savings: {
      ...fallback.savings,
      ...(parsed?.savings && typeof parsed.savings === "object" && !Array.isArray(parsed.savings)
        ? parsed.savings
        : {})
    },
    goals: normalizeRows(parsed?.goals, createGoalRow)
  };
}

function readParsedState(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadState(monthKey = getCurrentMonthKey()) {
  const stored = readParsedState(localStorage.getItem(buildStorageKey(monthKey)));

  if (stored) {
    return normalizeState(stored);
  }

  if (monthKey === getCurrentMonthKey()) {
    const legacy = readParsedState(localStorage.getItem(LEGACY_STORAGE_KEY));

    if (legacy) {
      return normalizeState(legacy);
    }
  }

  return createDefaultState();
}

export function saveState(monthKey, state) {
  localStorage.setItem(buildStorageKey(monthKey), JSON.stringify(state));
}

export function clearState(monthKey) {
  if (monthKey) {
    localStorage.removeItem(buildStorageKey(monthKey));
    return;
  }

  const keysToRemove = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith(`${STORAGE_PREFIX}:`) || key === LEGACY_STORAGE_KEY) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function listStoredMonthKeys() {
  const monthKeys = new Set();

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith(`${STORAGE_PREFIX}:`)) {
      monthKeys.add(key.replace(`${STORAGE_PREFIX}:`, ""));
    }
  }

  if (
    localStorage.getItem(LEGACY_STORAGE_KEY) &&
    !localStorage.getItem(buildStorageKey(getCurrentMonthKey()))
  ) {
    monthKeys.add(getCurrentMonthKey());
  }

  return Array.from(monthKeys).sort((left, right) => left.localeCompare(right));
}

export function formatMoney(value) {
  const amount = Number(value) || 0;
  return `${getActiveCurrency().symbol}${currencyFormatter.format(amount)}`;
}

export function toAmount(value) {
  return Number(value) || 0;
}

function sumBy(rows, key) {
  return rows.reduce((total, row) => total + toAmount(row[key]), 0);
}

function countFilled(rows, fields) {
  return rows.filter((row) =>
    fields.some((field) => {
      const value = row[field];
      return typeof value === "number"
        ? value !== 0
        : String(value ?? "").trim() !== "";
    })
  ).length;
}

function getLargest(rows, key) {
  return rows.reduce((largest, row) => {
    const amount = toAmount(row[key]);
    return amount > largest ? amount : largest;
  }, 0);
}

function calculateMonthsUntil(deadline) {
  if (!deadline) {
    return 0;
  }

  const now = new Date();
  const end = new Date(deadline);

  if (Number.isNaN(end.getTime())) {
    return 0;
  }

  let months =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth());

  if (end.getDate() >= now.getDate()) {
    months += 1;
  }

  return Math.max(months, 1);
}

export function calculateGoalMonthly(goal) {
  const target = toAmount(goal.targetAmount);
  const current = toAmount(goal.currentSavings);
  const remaining = Math.max(target - current, 0);
  const months = calculateMonthsUntil(goal.deadline);

  if (!months) {
    return 0;
  }

  return remaining / months;
}

export function getSummary(state, monthKey = getCurrentMonthKey()) {
  const income = sumBy(state.income, "amount");
  const needs = sumBy(state.needs, "cost");
  const wants = sumBy(state.wants, "cost");
  const monthlySavings = state.goals.reduce(
    (total, goal) => total + calculateGoalMonthly(goal),
    0
  );
  const plannedOut = needs + wants + monthlySavings;
  const cashflow = income - plannedOut;
  const emergencyBalance = toAmount(state.savings.emergencyBalance);
  const monthlySalary = toAmount(state.savings.monthlySalary);
  const emergencyTarget = monthlySalary * 3;
  const emergencyGap = Math.max(emergencyTarget - emergencyBalance, 0);
  const emergencyProgress =
    emergencyTarget > 0
      ? Math.min((emergencyBalance / emergencyTarget) * 100, 100)
      : 0;
  const needsRatio = income > 0 ? (needs / income) * 100 : 0;
  const wantsRatio = income > 0 ? (wants / income) * 100 : 0;
  const savingsRatio = income > 0 ? (monthlySavings / income) * 100 : 0;

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    income,
    needs,
    wants,
    monthlySavings,
    plannedOut,
    cashflow,
    emergencyBalance,
    monthlySalary,
    emergencyTarget,
    emergencyGap,
    emergencyProgress,
    needsRatio,
    wantsRatio,
    savingsRatio,
    incomeCount: countFilled(state.income, ["source", "amount"]),
    needsCount: countFilled(state.needs, ["item", "cost"]),
    wantsCount: countFilled(state.wants, ["item", "cost"]),
    goalsCount: countFilled(state.goals, ["goal", "targetAmount"]),
    highPriorityCount: state.needs.filter(
      (row) => row.priority === "High" && (row.item || toAmount(row.cost) > 0)
    ).length,
    largestIncome: getLargest(state.income, "amount"),
    largestNeed: getLargest(state.needs, "cost"),
    largestWant: getLargest(state.wants, "cost")
  };
}

export function getMonthlyHistory(limit = 8, activeMonthKey, activeState) {
  const monthKeys = new Set(listStoredMonthKeys());

  if (activeMonthKey) {
    monthKeys.add(activeMonthKey);
  }

  return Array.from(monthKeys)
    .sort((left, right) => left.localeCompare(right))
    .slice(-limit)
    .map((monthKey) => {
      const monthState =
        monthKey === activeMonthKey && activeState ? activeState : loadState(monthKey);
      const summary = getSummary(monthState, monthKey);

      return {
        monthKey,
        monthLabel: summary.monthLabel,
        income: summary.income,
        needs: summary.needs,
        wants: summary.wants,
        monthlySavings: summary.monthlySavings,
        plannedOut: summary.plannedOut,
        cashflow: summary.cashflow
      };
    });
}

export function deriveHealth(summary) {
  if (summary.income === 0 && summary.plannedOut === 0) {
    return {
      tone: "neutral",
      label: "Planning",
      title: "Start by mapping your month",
      message:
        "Once income and outgoings are entered, the app can show where your plan feels steady and where it needs attention."
    };
  }

  if (summary.cashflow < 0) {
    return {
      tone: "danger",
      label: "Overloaded",
      title: "Your plan is spending more than it brings in",
      message:
        "Trim lifestyle spending, slow goal timelines, or add more income so the month is not starting in deficit."
    };
  }

  if (summary.cashflow <= Math.max(summary.income * 0.08, 1)) {
    return {
      tone: "caution",
      label: "Tight",
      title: "The month is workable but carrying very little breathing room",
      message:
        "A small unexpected cost could put pressure on the plan, so review non-essential spending and deadlines carefully."
    };
  }

  if (summary.needsRatio >= 70) {
    return {
      tone: "caution",
      label: "Heavy essentials",
      title: "Most of your income is going to essentials",
      message:
        "The plan is positive, but essentials are doing the heavy lifting. Keep lifestyle costs intentional and build savings gradually."
    };
  }

  return {
    tone: "calm",
    label: "Balanced",
    title: "Your month has usable breathing room",
    message:
      "Income is covering the plan with some space left over, which gives you room to save, adjust, or absorb surprises."
  };
}

export function buildInsights(summary, health) {
  const items = [];

  if (summary.income === 0) {
    items.push(
      "Add at least one income source first. That gives every other section a real context."
    );
  } else if (summary.needsRatio > 65) {
    items.push(
      `Essentials are using ${summary.needsRatio.toFixed(0)}% of income, so keep lifestyle costs especially deliberate this month.`
    );
  } else {
    items.push(
      `Essentials are using ${summary.needsRatio.toFixed(0)}% of income, which gives you a clearer base for the rest of the month.`
    );
  }

  if (summary.wants > 0) {
    items.push(
      `Lifestyle spending is currently ${summary.wantsRatio.toFixed(0)}% of income. Keep checking that it still fits the bigger plan.`
    );
  } else {
    items.push(
      "No lifestyle spending has been added yet, which can be a useful way to see the bare minimum shape of the month first."
    );
  }

  if (summary.emergencyTarget > 0 && summary.emergencyGap > 0) {
    items.push(
      `Your emergency reserve is ${summary.emergencyProgress.toFixed(0)}% funded. Closing the gap matters even if it happens slowly.`
    );
  } else if (summary.emergencyTarget > 0) {
    items.push(
      "Your emergency reserve has reached its current target, which adds a strong layer of stability."
    );
  } else {
    items.push(
      "Add your monthly salary in the savings section to calculate an emergency target that fits your current month."
    );
  }

  if (summary.monthlySavings > 0) {
    items.push(
      `Your goals require ${formatMoney(summary.monthlySavings)} each month. Make sure that pace still feels realistic.`
    );
  } else {
    items.push(
      "No monthly savings target has been created yet. Even one visible goal can sharpen the rest of the plan."
    );
  }

  items.push(health.message);

  return items.slice(0, 4);
}

function csvCell(value) {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells) {
  return cells.map(csvCell).join(",");
}

export function exportCSV(state, monthKey = getCurrentMonthKey()) {
  const lines = [];
  const monthLabel = formatMonthLabel(monthKey);

  lines.push(csvRow(["Budget App Export", monthLabel]));
  lines.push("");

  lines.push("INCOME");
  lines.push(csvRow(["Date", "Source", "Amount", "Notes"]));
  for (const row of state.income) {
    lines.push(csvRow([row.date, row.source, row.amount, row.notes]));
  }
  lines.push("");

  lines.push("NEEDS");
  lines.push(csvRow(["Item", "Cost", "Priority", "Due"]));
  for (const row of state.needs) {
    lines.push(csvRow([row.item, row.cost, row.priority, row.due]));
  }
  lines.push("");

  lines.push("WANTS");
  lines.push(csvRow(["Item", "Cost", "Notes"]));
  for (const row of state.wants) {
    lines.push(csvRow([row.item, row.cost, row.notes]));
  }
  lines.push("");

  lines.push("SAVINGS GOALS");
  lines.push(csvRow(["Goal", "Target", "Saved", "Deadline", "Notes"]));
  for (const row of state.goals) {
    lines.push(csvRow([row.goal, row.targetAmount, row.currentSavings, row.deadline, row.notes]));
  }
  lines.push("");

  lines.push("SAVINGS SETTINGS");
  lines.push(csvRow(["Emergency Balance", "Monthly Salary"]));
  lines.push(csvRow([state.savings.emergencyBalance, state.savings.monthlySalary]));

  return lines.join("\n");
}
