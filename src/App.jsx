import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleArrowDown,
  ClipboardCheck,
  Coins,
  CupSoda,
  LayoutGrid,
  Plus,
  RefreshCcw,
  Shield
} from "lucide-react";
import {
  createMonthOptions,
  buildInsights,
  calculateGoalMonthly,
  clearState,
  createDefaultState,
  createGoalRow,
  createIncomeRow,
  createNeedRow,
  createWantRow,
  CURRENCIES,
  deriveHealth,
  exportCSV,
  formatMoney,
  getCurrentMonthKey,
  getMonthlyHistory,
  getSummary,
  loadCurrency,
  loadState,
  saveState,
  setActiveCurrency
} from "./lib/money";
import {
  BarRow,
  Field,
  InsightList,
  MetricCard,
  PanelHeader,
  RowCard,
  SurfaceCard
} from "./components/ui";

const PANELS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "income", label: "Income", icon: CircleArrowDown },
  { id: "needs", label: "Essentials", icon: Shield },
  { id: "wants", label: "Lifestyle", icon: CupSoda },
  { id: "savings", label: "Savings", icon: Coins },
  { id: "review", label: "Review", icon: ClipboardCheck }
];

const MONTH_OPTIONS = createMonthOptions();

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-[#e2e8f0] bg-white px-4 text-[0.96rem] text-[#0f172a] shadow-[0_2px_8px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#68be45] focus:ring-4 focus:ring-[#68be45]/15";

const factories = {
  income: createIncomeRow,
  needs: createNeedRow,
  wants: createWantRow,
  goals: createGoalRow
};

function Input(props) {
  return <input className={INPUT_CLASS} {...props} />;
}

function Textarea(props) {
  return <textarea className={`${INPUT_CLASS} min-h-[120px] resize-y py-3`} {...props} />;
}

function Select(props) {
  return <select className={INPUT_CLASS} {...props} />;
}

function App() {
  const [activePanel, setActivePanel] = useState("overview");
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey());
  const [currency, setCurrency] = useState(() => loadCurrency());
  const [state, setState] = useState(() => loadState(getCurrentMonthKey()));
  const mainRef = useRef(null);

  useEffect(() => {
    saveState(selectedMonth, state);
  }, [selectedMonth, state]);

  // When switching panels, start the new page from the top rather than
  // keeping the previous scroll position (most noticeable on mobile/tablet).
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0 });
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [activePanel]);

  const summary = getSummary(state, selectedMonth);
  const health = deriveHealth(summary);
  const insights = buildInsights(summary, health);
  const monthlyHistory = getMonthlyHistory(8, selectedMonth, state);
  const availableAfterNeeds = Math.max(summary.income - summary.needs, 0);
  const maxForBars = Math.max(
    summary.income,
    summary.needs,
    summary.wants,
    summary.monthlySavings,
    1
  );

  function handleMonthChange(nextMonth) {
    if (nextMonth === selectedMonth) {
      return;
    }

    saveState(selectedMonth, state);
    setSelectedMonth(nextMonth);
    setState(loadState(nextMonth));
    setActivePanel("overview");
  }

  function handleCurrencyChange(nextCurrency) {
    if (nextCurrency === currency) {
      return;
    }

    setActiveCurrency(nextCurrency);
    setCurrency(nextCurrency);
  }

  function updateRow(group, index, field, value) {
    setState((current) => {
      const nextRows = [...current[group]];
      nextRows[index] = {
        ...nextRows[index],
        [field]: value
      };

      return {
        ...current,
        [group]: nextRows
      };
    });
  }

  function updateSavings(field, value) {
    setState((current) => ({
      ...current,
      savings: {
        ...current.savings,
        [field]: value
      }
    }));
  }

  function addRow(group) {
    setState((current) => ({
      ...current,
      [group]: [...current[group], factories[group]()]
    }));
  }

  function removeRow(group, index) {
    setState((current) => {
      if (current[group].length === 1) {
        window.alert("At least one row should remain in this section.");
        return current;
      }

      return {
        ...current,
        [group]: current[group].filter((_, rowIndex) => rowIndex !== index)
      };
    });
  }

  function exportData() {
    const payload = exportCSV(state, selectedMonth);
    const blob = new Blob([payload], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `budget-app-${selectedMonth}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function resetPlanner() {
    const confirmed = window.confirm(
      "This will clear everything saved in the planner. Do you want to continue?"
    );

    if (!confirmed) {
      return;
    }

    clearState(selectedMonth);
    setState(createDefaultState());
    setActivePanel("overview");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div
        className={`grid min-h-screen ${
          railCollapsed
            ? "lg:grid-cols-[64px_minmax(0,1fr)]"
            : "lg:grid-cols-[268px_minmax(0,1fr)]"
        }`}
      >
        <aside
          className={`hidden lg:block app-rail-shell ${
            railCollapsed ? "px-2 py-[18px]" : "p-[18px]"
          } lg:sticky lg:top-0 lg:h-screen`}
        >
          <div className="flex min-h-full flex-col">
            <div className={`flex items-center pt-1 ${railCollapsed ? "justify-center" : "justify-between gap-3"}`}>
              <h1
                className={`font-body text-[1.56rem] font-semibold tracking-[-0.04em] text-[#0f172a] ${
                  railCollapsed ? "hidden" : ""
                }`}
              >
                Budget App
              </h1>
              <button
                type="button"
                onClick={() => setRailCollapsed((current) => !current)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[rgba(104,190,69,0.12)]"
                aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {railCollapsed ? (
                  <ChevronRight className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
                ) : (
                  <ChevronLeft className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
                )}
              </button>
            </div>

            <div className={`mt-8 ${railCollapsed ? "hidden" : ""}`}>
              <label htmlFor="planner-month" className="sr-only">
                Planner month
              </label>
              <select
                id="planner-month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="rail-month-select"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <nav
              className={`mt-5 grid ${
                railCollapsed ? "justify-items-center gap-4" : "gap-[0.72rem]"
              }`}
              aria-label="Planner sections"
            >
              {PANELS.map((panel) => {
                const Icon = panel.icon;
                const active = activePanel === panel.id;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    title={railCollapsed ? panel.label : undefined}
                    aria-label={panel.label}
                    onClick={() => setActivePanel(panel.id)}
                    className={
                      railCollapsed
                        ? `nav-tab-collapsed ${active ? "nav-tab-collapsed-active" : ""}`
                        : `nav-tab ${active ? "nav-tab-active" : ""}`
                    }
                  >
                    <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={2.05} />
                    <span className={railCollapsed ? "sr-only" : ""}>{panel.label}</span>
                  </button>
                );
              })}
            </nav>

            {!railCollapsed && (
              <div className="mt-auto pb-5 pt-6">
                <img
                  src="/assets/enableg-logo.png"
                  alt="Enable G"
                  className="mx-auto w-[150px]"
                />
              </div>
            )}
          </div>
        </aside>

        <main
          ref={mainRef}
          className={activePanel === "overview" ? "workspace-shell-overview" : "workspace-shell"}
        >
          {activePanel === "overview" && (
            <div className="flex items-center justify-center border-b border-[#e2e8f0] py-4 lg:hidden">
              <img src="/assets/enableg-logo.png" alt="Enable G" className="w-[180px] h-auto" />
            </div>
          )}

          {activePanel !== "overview" ? (
            <div className="workspace-content">
              <div className="mb-4 flex flex-wrap justify-end gap-3">
                <button type="button" onClick={exportData} className="app-button app-button-ghost">
                  <ArrowDownToLine className="h-4 w-4" />
                  Export data
                </button>
                <button type="button" onClick={resetPlanner} className="app-button app-button-subtle">
                  <RefreshCcw className="h-4 w-4" />
                  Reset planner
                </button>
              </div>
 
              {activePanel === "income" ? (
                <IncomePanel
                  rows={state.income}
                  total={summary.income}
                  count={summary.incomeCount}
                  largest={summary.largestIncome}
                  onAdd={() => addRow("income")}
                  onChange={updateRow}
                  onDelete={removeRow}
                />
              ) : null}

              {activePanel === "needs" ? (
                <NeedsPanel
                  rows={state.needs}
                  total={summary.needs}
                  ratio={summary.needsRatio}
                  largest={summary.largestNeed}
                  highPriorityCount={summary.highPriorityCount}
                  onAdd={() => addRow("needs")}
                  onChange={updateRow}
                  onDelete={removeRow}
                />
              ) : null}

              {activePanel === "wants" ? (
                <WantsPanel
                  rows={state.wants}
                  total={summary.wants}
                  ratio={summary.wantsRatio}
                  largest={summary.largestWant}
                  availableAfterNeeds={availableAfterNeeds}
                  onAdd={() => addRow("wants")}
                  onChange={updateRow}
                  onDelete={removeRow}
                />
              ) : null}

              {activePanel === "savings" ? (
                <SavingsPanel
                  savings={state.savings}
                  goals={state.goals}
                  summary={summary}
                  onSavingsChange={updateSavings}
                  onGoalAdd={() => addRow("goals")}
                  onGoalChange={updateRow}
                  onGoalDelete={removeRow}
                />
              ) : null}

              {activePanel === "review" ? (
                <ReviewPanel
                  summary={summary}
                  insights={insights}
                  maxForBars={maxForBars}
                  monthlyHistory={monthlyHistory}
                />
              ) : null}
            </div>
          ) : null}

          {activePanel === "overview" ? (
            <OverviewPanel
              summary={summary}
              health={health}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
            />
          ) : null}
        </main>
      </div>

      {/* Bottom navigation — visible on mobile + tablet (below 1024px) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-[rgba(104,190,69,0.2)] bg-[#f0f7ec]"
        aria-label="Planner sections"
      >
        <div className="flex">
          {PANELS.map((panel) => {
            const Icon = panel.icon;
            const active = activePanel === panel.id;
            return (
              <button
                key={`mob-${panel.id}`}
                type="button"
                onClick={() => setActivePanel(panel.id)}
                className={`flex flex-1 flex-col items-center gap-[3px] py-2.5 px-1 transition-colors ${
                  active ? "text-[#166534]" : "text-[#64748b]"
                }`}
              >
                <Icon
                  className="h-[1.2rem] w-[1.2rem]"
                  strokeWidth={active ? 2.3 : 1.8}
                />
                <span className="text-[9.5px] font-medium">{panel.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function OverviewPanel({ summary, health, currency, onCurrencyChange }) {
  const healthLabel =
    health.tone === "calm"
      ? "On Track"
      : health.tone === "danger"
        ? "Off Track"
        : health.tone === "caution"
          ? "Needs Attention"
          : "Planning";

  return (
    <section className="overview-shell">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0">
          <h2 className="font-body text-[2.76rem] font-normal tracking-[-0.045em] text-[#0f172a]">
            Overview
          </h2>
          <p className="text-[0.96rem] font-normal text-[#64748b]">Your monthly budget at a glance.</p>
        </div>

        <div className="w-full sm:w-auto">
          <label
            htmlFor="planner-currency"
            className="mb-1.5 block text-[0.8rem] font-medium text-[#64748b]"
          >
            Currency
          </label>
          <select
            id="planner-currency"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="rail-month-select w-full sm:w-[230px]"
          >
            <optgroup label="Common">
              {CURRENCIES.filter((option) => option.pinned).map((option) => (
                <option key={option.code} value={option.code}>
                  {option.symbol} · {option.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="All currencies">
              {CURRENCIES.filter((option) => !option.pinned).map((option) => (
                <option key={option.code} value={option.code}>
                  {option.symbol} · {option.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <OverviewStatCard
          label="Free Cashflow"
          value={formatMoney(summary.cashflow)}
          valueClassName={summary.cashflow >= 0 ? "text-[#4a9630]" : "text-[#dc2626]"}
        />
        <OverviewStatCard label="Total Income" value={formatMoney(summary.income)} />
        <OverviewStatCard label="Total Planned Out" value={formatMoney(summary.plannedOut)} />
      </div>

      <div className="overview-card overview-panel-card overview-budget-card space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#c8eeaa] bg-[#f0f7ec] text-[#4a9630]">
            <CheckCircle2 className="h-[0.95rem] w-[0.95rem]" strokeWidth={2.2} />
          </span>
          <h3 className="text-[0.96rem] font-semibold text-[#0f172a]">Budget Health</h3>
          <span className="text-[0.96rem] font-medium text-[#4a9630]">{healthLabel}</span>
        </div>

        <div className="space-y-3">
          <OverviewProgressRow label="Essentials" value={summary.needsRatio} barClassName="bg-[#d97706]" />
          <OverviewProgressRow label="Lifestyle" value={summary.wantsRatio} barClassName="bg-[#6366f1]" />
          <OverviewProgressRow label="Savings" value={summary.savingsRatio} barClassName="bg-[#68be45]" />
        </div>
      </div>

      <div className="grid gap-[1.15rem] sm:grid-cols-2">
        <div className="overview-card overview-panel-card overview-snapshot-card">
          <h3 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-[#0f172a]">
            Planner Snapshot
          </h3>

          <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <SnapshotItem
              icon={CircleArrowDown}
              value={String(summary.incomeCount)}
              label="Income entries"
            />
            <SnapshotItem
              icon={Shield}
              value={String(summary.needsCount)}
              label="Essential items"
            />
            <SnapshotItem
              icon={Coins}
              value={String(summary.goalsCount)}
              label="Savings goals"
            />
            <SnapshotItem
              icon={CupSoda}
              value={formatMoney(summary.plannedOut)}
              label="Planned out"
            />
          </div>
        </div>

        <div className="overview-card overview-panel-card overview-fund-card">
          <h3 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-[#0f172a]">
            Emergency Fund
          </h3>

          <div className="mt-5 space-y-2.5 text-[0.98rem]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#64748b]">Current Balance</span>
              <strong className="font-medium text-[#0f172a]">
                {formatMoney(summary.emergencyBalance)}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#64748b]">Target (3x salary)</span>
              <strong className="font-medium text-[#0f172a]">
                {formatMoney(summary.emergencyTarget)}
              </strong>
            </div>
          </div>

          <div className="mt-3.5 space-y-1">
            <div className="overview-progress-track">
              <div
                className="overview-fund-fill"
                style={{ width: `${Math.max(0, Math.min(summary.emergencyProgress, 100))}%` }}
              />
            </div>
            <div className="flex justify-end">
              <span className="text-[0.82rem] font-medium text-[#94a3b8]">
                {`${summary.emergencyProgress.toFixed(0)}% funded`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewStatCard({ label, value, valueClassName = "text-[#0f172a]" }) {
  return (
    <div className="overview-card overview-stat-card">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
        {label}
      </p>
      <strong className={`mt-4 block text-[2.02rem] font-normal tracking-[-0.04em] ${valueClassName}`}>
        {value}
      </strong>
    </div>
  );
}

function OverviewProgressRow({ label, value, barClassName }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-4 text-[0.98rem]">
        <span className="text-[#64748b]">{label}</span>
        <span className="font-medium text-[#475569]">{`${value.toFixed(1)}%`}</span>
      </div>
      <div className="overview-progress-track">
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function SnapshotItem({ icon: Icon, value, label }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f7ec] text-[#4a9630]">
        <Icon className="h-[0.95rem] w-[0.95rem]" strokeWidth={2} />
      </span>
      <div className="space-y-0.5">
        <strong className="block text-[1.58rem] font-normal leading-none tracking-[-0.03em] text-[#0f172a]">
          {value}
        </strong>
        <span className="block text-[0.9rem] text-[#9ca3af]">{label}</span>
      </div>
    </div>
  );
}

function IncomePanel({ rows, total, count, largest, onAdd, onChange, onDelete }) {
  return (
    <SectionPanel
      eyebrow="Income"
      title="Income"
      description="Track everything coming into this month."
      actionLabel="Add income"
      onAdd={onAdd}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total income" value={formatMoney(total)} tone="success" />
          <MetricCard label="Income streams" value={String(count)} />
          <MetricCard
            label="Largest stream"
            value={largest > 0 ? formatMoney(largest) : "—"}
          />
        </div>
      }
    >
      {rows.map((row, index) => (
        <RowCard
          key={`income-${index}`}
          title={`Income source ${index + 1}`}
          onDelete={() => onDelete("income", index)}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Date">
              <Input
                type="date"
                value={row.date}
                onChange={(e) => onChange("income", index, "date", e.target.value)}
              />
            </Field>
            <Field label="Source">
              <Input
                value={row.source}
                placeholder="Salary, grant, freelance"
                onChange={(e) => onChange("income", index, "source", e.target.value)}
              />
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                min="0"
                value={row.amount}
                placeholder="0"
                onChange={(e) => onChange("income", index, "amount", e.target.value)}
              />
            </Field>
            <Field label="Note" className="md:col-span-2 xl:col-span-4">
              <Textarea
                value={row.notes}
                placeholder="Optional note"
                onChange={(e) => onChange("income", index, "notes", e.target.value)}
              />
            </Field>
          </div>
        </RowCard>
      ))}
    </SectionPanel>
  );
}

function NeedsPanel({ rows, total, ratio, largest, highPriorityCount, onAdd, onChange, onDelete }) {
  return (
    <SectionPanel
      eyebrow="Essentials"
      title="Essentials"
      description="Fixed costs and necessary spending."
      actionLabel="Add essential"
      onAdd={onAdd}
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total essentials" value={formatMoney(total)} />
          <MetricCard label="Share of income" value={`${ratio.toFixed(1)}%`} tone="warning" />
          <MetricCard
            label="Largest item"
            value={largest > 0 ? formatMoney(largest) : "—"}
          />
          <MetricCard label="High priority" value={String(highPriorityCount)} tone="danger" />
        </div>
      }
    >
      {rows.map((row, index) => (
        <RowCard
          key={`need-${index}`}
          title={`Essential item ${index + 1}`}
          onDelete={() => onDelete("needs", index)}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Essential">
              <Input
                value={row.item}
                placeholder="Rent, transport, groceries"
                onChange={(e) => onChange("needs", index, "item", e.target.value)}
              />
            </Field>
            <Field label="Monthly cost">
              <Input
                type="number"
                min="0"
                value={row.cost}
                placeholder="0"
                onChange={(e) => onChange("needs", index, "cost", e.target.value)}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={row.priority}
                onChange={(e) => onChange("needs", index, "priority", e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </Field>
            <Field label="When due">
              <Input
                value={row.due}
                placeholder="e.g. 1st of month"
                onChange={(e) => onChange("needs", index, "due", e.target.value)}
              />
            </Field>
          </div>
        </RowCard>
      ))}
    </SectionPanel>
  );
}

function WantsPanel({ rows, total, ratio, largest, availableAfterNeeds, onAdd, onChange, onDelete }) {
  return (
    <SectionPanel
      eyebrow="Lifestyle"
      title="Lifestyle"
      description="Discretionary spending and the extras you want to keep in view."
      actionLabel="Add lifestyle"
      onAdd={onAdd}
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total lifestyle" value={formatMoney(total)} />
          <MetricCard label="Share of income" value={`${ratio.toFixed(1)}%`} tone="warning" />
          <MetricCard label="After essentials" value={formatMoney(availableAfterNeeds)} />
          <MetricCard
            label="Largest item"
            value={largest > 0 ? formatMoney(largest) : "—"}
          />
        </div>
      }
    >
      {rows.map((row, index) => (
        <RowCard
          key={`want-${index}`}
          title={`Lifestyle item ${index + 1}`}
          onDelete={() => onDelete("wants", index)}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Item">
              <Input
                value={row.item}
                placeholder="Eating out, subscriptions, treats"
                onChange={(e) => onChange("wants", index, "item", e.target.value)}
              />
            </Field>
            <Field label="Monthly cost">
              <Input
                type="number"
                min="0"
                value={row.cost}
                placeholder="0"
                onChange={(e) => onChange("wants", index, "cost", e.target.value)}
              />
            </Field>
            <Field label="Note" className="md:col-span-2 xl:col-span-3">
              <Textarea
                value={row.notes}
                placeholder="Optional note"
                onChange={(e) => onChange("wants", index, "notes", e.target.value)}
              />
            </Field>
          </div>
        </RowCard>
      ))}
    </SectionPanel>
  );
}

function SavingsPanel({ savings, goals, summary, onSavingsChange, onGoalAdd, onGoalChange, onGoalDelete }) {
  return (
    <section className="space-y-6">
      <PanelHeader
        eyebrow="Savings"
        title="Savings"
        description="Keep your safety net and future goals in view."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Monthly commitment"
          value={formatMoney(summary.monthlySavings)}
          tone="warning"
        />
        <MetricCard label="Active goals" value={String(summary.goalsCount)} />
        <MetricCard
          label="Emergency progress"
          value={`${summary.emergencyProgress.toFixed(0)}%`}
          tone="success"
        />
      </div>

      <div className="space-y-4">
        {/* Emergency Fund — stacks on mobile/tablet, horizontal on xl */}
        <SurfaceCard className="p-5 md:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:gap-8">
            <div className="space-y-2 xl:w-56 xl:shrink-0">
              <p className="label-kicker">Emergency reserve</p>
              <h3 className="font-body text-[1.7rem] font-normal tracking-[-0.04em] text-[#0f172a]">
                Emergency fund
              </h3>
              <p className="text-sm leading-6 text-[#64748b]">
                Set the current balance and salary so the target updates automatically.
              </p>
            </div>

            <div className="flex-1 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Emergency fund balance">
                  <Input
                    type="number"
                    min="0"
                    value={savings.emergencyBalance}
                    placeholder="0"
                    onChange={(e) => onSavingsChange("emergencyBalance", e.target.value)}
                  />
                </Field>
                <Field label="Monthly salary">
                  <Input
                    type="number"
                    min="0"
                    value={savings.monthlySalary}
                    placeholder="0"
                    onChange={(e) => onSavingsChange("monthlySalary", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <MetricCard label="Recommended target" value={formatMoney(summary.emergencyTarget)} />
                <MetricCard label="Remaining gap" value={formatMoney(summary.emergencyGap)} tone="warning" />
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div
                  className="h-full rounded-full bg-[#68be45]"
                  style={{ width: `${summary.emergencyProgress}%` }}
                />
              </div>
              <div className="flex justify-end">
                <span className="text-sm text-[#94a3b8]">{`${summary.emergencyProgress.toFixed(0)}% funded`}</span>
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* Savings Goals — stacks on mobile/tablet, horizontal on xl */}
        <SurfaceCard className="p-5 md:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:gap-8">
            <div className="space-y-4 xl:w-56 xl:shrink-0">
              <div className="space-y-2">
                <p className="label-kicker">Goal planner</p>
                <h3 className="font-body text-[1.7rem] font-normal tracking-[-0.04em] text-[#0f172a]">
                  Savings goals
                </h3>
                <p className="text-sm leading-6 text-[#64748b]">
                  Each goal updates its monthly pace from the target, current balance, and deadline.
                </p>
              </div>
              <button type="button" onClick={onGoalAdd} className="app-button app-button-primary">
                <Plus className="h-4 w-4" />
                Add goal
              </button>
            </div>

            <div className="flex-1 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <MetricCard label="Monthly savings load" value={formatMoney(summary.monthlySavings)} />
                <MetricCard
                  label="Goals in plan"
                  value={String(summary.goalsCount)}
                  tone={summary.goalsCount > 0 ? "success" : "default"}
                />
              </div>

              {goals.map((goal, index) => (
                <RowCard
                  key={`goal-${index}`}
                  title={`Goal ${index + 1}`}
                  onDelete={() => onGoalDelete("goals", index)}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Goal">
                      <Input
                        value={goal.goal}
                        placeholder="Laptop, course, launch"
                        onChange={(e) => onGoalChange("goals", index, "goal", e.target.value)}
                      />
                    </Field>
                    <Field label="Target">
                      <Input
                        type="number"
                        min="0"
                        value={goal.targetAmount}
                        placeholder="0"
                        onChange={(e) => onGoalChange("goals", index, "targetAmount", e.target.value)}
                      />
                    </Field>
                    <Field label="Saved">
                      <Input
                        type="number"
                        min="0"
                        value={goal.currentSavings}
                        placeholder="0"
                        onChange={(e) => onGoalChange("goals", index, "currentSavings", e.target.value)}
                      />
                    </Field>
                    <Field label="Deadline">
                      <Input
                        type="date"
                        value={goal.deadline}
                        onChange={(e) => onGoalChange("goals", index, "deadline", e.target.value)}
                      />
                    </Field>
                    <Field label="Monthly needed">
                      <div className="flex h-12 items-center rounded-xl border border-[#e2e8f0] bg-[#f0f7ec] px-4 text-sm font-medium text-[#0f172a]">
                        {formatMoney(calculateGoalMonthly(goal))}
                      </div>
                    </Field>
                    <Field label="Note" className="md:col-span-2">
                      <Textarea
                        value={goal.notes}
                        placeholder="Optional note"
                        onChange={(e) => onGoalChange("goals", index, "notes", e.target.value)}
                      />
                    </Field>
                  </div>
                </RowCard>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </section>
  );
}

function ReviewPanel({ summary, insights, maxForBars, monthlyHistory }) {
  return (
    <section className="space-y-6">
      <PanelHeader
        eyebrow="Review"
        title="Review"
        description="Read the full month in one place."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard className="space-y-5 p-5 md:p-6 xl:col-span-2">
          <div className="space-y-2">
            <p className="label-kicker">Monthly snapshot</p>
            <h3 className="font-body text-[1.7rem] font-normal tracking-[-0.04em] text-[#0f172a]">
              This month at a glance
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="Money in" value={formatMoney(summary.income)} />
            <MetricCard label="Planned out" value={formatMoney(summary.plannedOut)} />
            <MetricCard label="Free cashflow" value={formatMoney(summary.cashflow)} tone={summary.cashflow >= 0 ? "success" : "danger"} />
            <MetricCard label="Emergency gap" value={formatMoney(summary.emergencyGap)} tone="warning" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Essentials" value={`${summary.needsRatio.toFixed(0)}%`} />
            <MetricCard label="Lifestyle" value={`${summary.wantsRatio.toFixed(0)}%`} />
            <MetricCard label="Savings" value={`${summary.savingsRatio.toFixed(0)}%`} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5 p-5 md:p-6">
          <div className="space-y-2">
            <p className="label-kicker">Visual comparison</p>
            <h3 className="font-body text-[1.7rem] font-normal tracking-[-0.04em] text-[#0f172a]">
              Monthly breakdown
            </h3>
          </div>

          <div className="grid gap-5">
            <BarRow label="Income" value={formatMoney(summary.income)} max={maxForBars} barClass="bg-[#68be45]" />
            <BarRow label="Essentials" value={formatMoney(summary.needs)} max={maxForBars} barClass="bg-[#d97706]" />
            <BarRow label="Lifestyle" value={formatMoney(summary.wants)} max={maxForBars} barClass="bg-[#6366f1]" />
            <BarRow label="Savings" value={formatMoney(summary.monthlySavings)} max={maxForBars} barClass="bg-[#4a9630]" />
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5 p-5 md:p-6">
          <div className="space-y-2">
            <p className="label-kicker">Recommendations</p>
            <h3 className="font-body text-[1.7rem] font-normal tracking-[-0.04em] text-[#0f172a]">
              What to focus on next
            </h3>
          </div>
          <InsightList items={insights} />
        </SurfaceCard>

        <SurfaceCard className="space-y-5 p-5 md:p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="label-kicker">Multi-month history</p>
              <h3 className="font-body text-[1.7rem] font-normal tracking-[-0.04em] text-[#0f172a]">
                How the plan has been moving
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Your planner now keeps each month separately, so the review page can show how
                income, essentials, lifestyle, and savings have changed over time.
              </p>
            </div>
            <div className="bevel-md border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-soft">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Months tracked
              </span>
              <strong className="mt-1 block font-display text-2xl font-bold tracking-tight text-slate-950">
                {monthlyHistory.length}
              </strong>
            </div>
          </div>

          <HistoryTrendChart history={monthlyHistory} />

          <div className="grid gap-3 md:grid-cols-4">
            {monthlyHistory.slice(-4).map((month) => (
              <div
                key={month.monthKey}
                className="bevel-md border border-slate-200 bg-slate-50 px-4 py-4 shadow-soft"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {month.monthLabel}
                </span>
                <strong className="mt-2 block font-display text-xl font-bold tracking-tight text-slate-950">
                  {formatMoney(month.cashflow)}
                </strong>
                <p className="mt-1 text-sm text-slate-500">
                  {month.cashflow >= 0 ? "Free cashflow" : "Deficit this month"}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </section>
  );
}

function HistoryTrendChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="bevel-md border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-500">
        Save at least two different months to unlock the trend lines here. Your current month is
        already being tracked.
      </div>
    );
  }

  const series = [
    { key: "income", label: "Income", color: "#68be45" },
    { key: "needs", label: "Essentials", color: "#d97706" },
    { key: "wants", label: "Lifestyle", color: "#6366f1" },
    { key: "monthlySavings", label: "Savings", color: "#4a9630" }
  ];
  const width = 760;
  const height = 248;
  const padding = { top: 18, right: 16, bottom: 36, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    ...history.flatMap((month) => series.map((item) => Number(month[item.key]) || 0)),
    1
  );

  function getX(index) {
    if (history.length === 1) {
      return padding.left + chartWidth / 2;
    }

    return padding.left + (index / (history.length - 1)) * chartWidth;
  }

  function getY(value) {
    return padding.top + chartHeight - (Math.max(value, 0) / maxValue) * chartHeight;
  }

  function buildPath(key) {
    return history
      .map((month, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(month[key])}`)
      .join(" ");
  }

  const gridLines = 4;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {series.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50/80 px-3 py-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[248px] w-full" role="img" aria-label="Budget history chart">
          {Array.from({ length: gridLines }, (_, index) => {
            const ratio = index / (gridLines - 1);
            const y = padding.top + ratio * chartHeight;

            return (
              <line
                key={`grid-${index}`}
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="5 7"
              />
            );
          })}

          {series.map((item) => (
            <path
              key={item.key}
              d={buildPath(item.key)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {history.map((month, index) => (
            <g key={month.monthKey}>
              {series.map((item) => (
                <circle
                  key={`${month.monthKey}-${item.key}`}
                  cx={getX(index)}
                  cy={getY(month[item.key])}
                  r="3.5"
                  fill={item.color}
                />
              ))}
              <text
                x={getX(index)}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
              >
                {month.monthLabel.slice(0, 3)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function SectionPanel({ eyebrow, title, description, actionLabel, onAdd, summary, children }) {
  return (
    <section className="space-y-6">
      <PanelHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          actionLabel ? (
            <button type="button" onClick={onAdd} className="app-button app-button-primary">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          ) : null
        }
      />

      {summary ? summary : null}

      <SurfaceCard className="space-y-4 p-4 md:p-5">
        {children}
      </SurfaceCard>
    </section>
  );
}

export default App;
