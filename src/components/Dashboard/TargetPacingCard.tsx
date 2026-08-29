import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { MonthlyQuotas } from '../../types';
import { formatGbp, calculateMonthlyPacing } from '../../lib/currency';

interface TargetPacingCardProps {
  closedRevenueGbp: number;
  quotas: MonthlyQuotas;
  onOpenTargetManager: () => void;
}

export const TargetPacingCard: React.FC<TargetPacingCardProps> = ({
  closedRevenueGbp,
  quotas,
  onOpenTargetManager,
}) => {
  const pacing = calculateMonthlyPacing(
    closedRevenueGbp,
    quotas.companyTargetGbp,
    quotas.holidays || []
  );

  return (
    <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark relative overflow-hidden space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-black border border-brand-cyan/30 text-brand-cyan shadow-cyan-glow">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-brand-white">
                Monthly Revenue Run-Rate & Working-Day Pacing
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Mon-Fri Work Days
              </span>
            </div>
            <p className="text-xs text-brand-gray">
              Target vs actual day-by-day linear velocity (Excludes weekends & company holidays)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenTargetManager}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-brand-black border border-white/10 hover:border-brand-green/40 text-brand-white text-xs font-semibold transition-all flex items-center gap-1.5"
        >
          <CalendarDays className="w-3.5 h-3.5 text-brand-green" />
          <span>Edit Quotas & Holidays</span>
        </button>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Target vs Actual */}
        <div className="p-4 rounded-xl bg-brand-black border border-white/5 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-brand-gray">Company Target</span>
          <div className="text-2xl font-bold font-mono text-brand-white">
            {formatGbp(quotas.companyTargetGbp)}
          </div>
          <div className="text-[11px] text-brand-gray">
            Closed: <strong className="text-brand-green font-mono">{formatGbp(closedRevenueGbp)}</strong> ({pacing.achievementPct}%)
          </div>
        </div>

        {/* Metric 2: Working Days Elapsed */}
        <div className="p-4 rounded-xl bg-brand-black border border-white/5 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-brand-gray">Working Days Track</span>
          <div className="text-2xl font-bold font-mono text-brand-cyan">
            Day {pacing.workingDaysElapsed} <span className="text-sm font-normal text-brand-gray">/ {pacing.totalWorkingDays}</span>
          </div>
          <div className="text-[11px] text-brand-gray">
            <span className="text-brand-cyan font-semibold">{pacing.workingDaysRemaining} Working Days left</span>
            {pacing.holidayCount > 0 && <span className="text-brand-orange"> · {pacing.holidayCount} Holiday</span>}
          </div>
        </div>

        {/* Metric 3: Pacing Variance (Ahead / Behind) */}
        <div
          className={`p-4 rounded-xl bg-brand-black border space-y-1.5 ${
            pacing.isAhead ? 'border-brand-green/30' : 'border-brand-orange/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-brand-gray">Pacing Status</span>
            {pacing.isAhead ? (
              <span className="flex items-center text-xs text-brand-green font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" /> Ahead
              </span>
            ) : (
              <span className="flex items-center text-xs text-brand-orange font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5" /> Behind
              </span>
            )}
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              pacing.isAhead ? 'text-brand-green' : 'text-brand-orange'
            }`}
          >
            {pacing.varianceGbp >= 0 ? `+${formatGbp(pacing.varianceGbp)}` : formatGbp(pacing.varianceGbp)}
          </div>
          <div className="text-[11px] text-brand-gray">
            Expected by Day {pacing.workingDaysElapsed}: <strong className="font-mono text-brand-white">{formatGbp(pacing.targetToDateGbp)}</strong>
          </div>
        </div>

        {/* Metric 4: Required Daily Run-Rate */}
        <div className="p-4 rounded-xl bg-brand-black border border-white/5 space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-brand-gray">Req. Daily Run Rate</span>
          <div className="text-2xl font-bold font-mono text-brand-white">
            {formatGbp(pacing.requiredDailyRunRateGbp)}
            <span className="text-xs font-normal text-brand-gray"> / day</span>
          </div>
          <div className="text-[11px] text-brand-gray">
            Projected Month-End: <strong className="font-mono text-brand-cyan">{formatGbp(pacing.projectedMonthEndGbp)}</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar with Today's Benchmark Marker */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-brand-gray">
            Working Days Progress: <strong className="text-brand-white">{pacing.monthProgressPct}%</strong> ({pacing.workingDaysElapsed} / {pacing.totalWorkingDays} days)
          </span>
          <span className="text-brand-gray">
            Quota Achieved: <strong className="text-brand-green">{pacing.achievementPct}%</strong> ({formatGbp(closedRevenueGbp)} / {formatGbp(quotas.companyTargetGbp)})
          </span>
        </div>

        <div className="w-full h-3 bg-brand-black rounded-full overflow-hidden border border-white/10 relative">
          {/* Working Days Elapsed Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
            style={{ left: `${Math.min(100, pacing.monthProgressPct)}%` }}
            title={`Working-day target mark (${pacing.monthProgressPct}%)`}
          />

          {/* Revenue Achieved Progress */}
          <div
            className={`h-full rounded-full transition-all ${
              pacing.achievementPct >= pacing.monthProgressPct
                ? 'bg-brand-green shadow-green-glow'
                : 'bg-brand-orange shadow-orange-glow'
            }`}
            style={{ width: `${Math.min(100, pacing.achievementPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
