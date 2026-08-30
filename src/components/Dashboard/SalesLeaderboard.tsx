import React from 'react';
import {
  Trophy,
  PoundSterling,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { Deal, MonthlyQuotas, TeamMember } from '../../types';
import { formatGbp } from '../../lib/currency';

interface SalesLeaderboardProps {
  deals: Deal[];
  quotas: MonthlyQuotas;
  salesReps: TeamMember[];
  onSelectRep?: (repName: string) => void;
}

export const SalesLeaderboard: React.FC<SalesLeaderboardProps> = ({
  deals,
  quotas,
  salesReps,
  onSelectRep,
}) => {
  const isRepMatching = (recordRep?: string, teamRepName?: string, teamRepEmail?: string) => {
    if (!recordRep || !teamRepName) return false;
    const cleanRec = recordRep.trim().toLowerCase();
    const cleanRep = teamRepName.trim().toLowerCase();
    const cleanEmail = teamRepEmail?.trim().toLowerCase() || '';
    return (
      cleanRec === cleanRep ||
      cleanRec === cleanEmail ||
      cleanRec.startsWith(cleanRep) ||
      cleanRep.startsWith(cleanRec)
    );
  };

  const repStats = salesReps.map((rep) => {
    const repDeals = deals.filter((d) => isRepMatching(d.salesRep, rep.name, rep.email));
    const wonDeals = repDeals.filter((d) => d.stage === 'closed_won');
    const closedRevenueGbp = wonDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

    const pipelineDeals = repDeals.filter((d) => d.stage !== 'closed_lost');
    const totalPipelineGbp = pipelineDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

    const pendingInvoices = repDeals.filter(
      (d) => d.stage === 'invoice_sent' || d.stage === 'payment_pending'
    );
    const pendingInvoicedGbp = pendingInvoices.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

    const targetObj = quotas.salesTargets.find(
      (t) => isRepMatching(t.memberName, rep.name, rep.email)
    );
    const targetGbp = targetObj && targetObj.targetGbp !== undefined ? targetObj.targetGbp : 5000;
    const achievementPct =
      targetGbp > 0 ? Math.round((closedRevenueGbp / targetGbp) * 100) : 0;

    return {
      rep,
      closedRevenueGbp,
      totalPipelineGbp,
      pendingInvoicedGbp,
      wonCount: wonDeals.length,
      pipelineCount: pipelineDeals.length,
      targetGbp,
      achievementPct,
    };
  });

  const sortedStats = [...repStats].sort((a, b) => {
    if (b.closedRevenueGbp !== a.closedRevenueGbp) {
      return b.closedRevenueGbp - a.closedRevenueGbp;
    }
    if (b.totalPipelineGbp !== a.totalPipelineGbp) {
      return b.totalPipelineGbp - a.totalPipelineGbp;
    }
    if (b.wonCount !== a.wonCount) {
      return b.wonCount - a.wonCount;
    }
    return a.rep.name.localeCompare(b.rep.name);
  });

  return (
    <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-midnight">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/30 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-white">Sales Team Leaderboard</h3>
            <p className="text-xs text-brand-gray">
              Ranked from <strong className="text-brand-green">Highest to Lowest</strong> by Opportunity Value & Revenue in £ GBP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-gray font-mono whitespace-nowrap shrink-0">
          <span>5 Sales Closers</span>
          <span>·</span>
          <span className="text-brand-green font-semibold">Monthly £ Quotas</span>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-brand-midnight text-brand-gray font-mono uppercase tracking-wider">
              <th className="py-3 px-3 w-20 whitespace-nowrap">Rank</th>
              <th className="py-3 px-3 min-w-[180px] whitespace-nowrap">Sales Representative</th>
              <th className="py-3 px-3 w-28 text-center whitespace-nowrap">Target (£)</th>
              <th className="py-3 px-3 w-36 text-center whitespace-nowrap">Closed Won (£)</th>
              <th className="py-3 px-3 w-32 text-center whitespace-nowrap">Active Pipeline</th>
              <th className="py-3 px-3 w-32 text-center whitespace-nowrap">Invoiced Pending</th>
              <th className="py-3 px-3 w-40 whitespace-nowrap">Quota Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-midnight/60">
            {sortedStats.map((stat, idx) => {
              const isTop = idx === 0;
              const rankBadge =
                idx === 0
                  ? '🥇 #1'
                  : idx === 1
                  ? '🥈 #2'
                  : idx === 2
                  ? '🥉 #3'
                  : `#${idx + 1}`;

              return (
                <tr
                  key={stat.rep.id}
                  onClick={() => onSelectRep && onSelectRep(stat.rep.name)}
                  className={`hover:bg-brand-black/50 transition-colors cursor-pointer group ${
                    isTop ? 'bg-brand-green/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs whitespace-nowrap shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-orange-glow'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-500 border border-amber-600/30'
                          : 'text-brand-gray font-normal'
                      }`}
                    >
                      {rankBadge}
                    </span>
                  </td>

                  {/* Rep Profile */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm shrink-0"
                        style={{ backgroundColor: stat.rep.avatarColor || '#00C2FF' }}
                      >
                        {stat.rep.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-brand-white group-hover:text-brand-cyan transition-colors flex items-center gap-1.5 whitespace-nowrap">
                          <span>{stat.rep.name}</span>
                          {isTop && <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse shrink-0" />}
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono whitespace-nowrap">
                          {stat.wonCount} Deals Won · {stat.pipelineCount} in Pipeline
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Target in GBP */}
                  <td className="py-3 px-3 text-center font-mono text-brand-gray whitespace-nowrap">
                    {formatGbp(stat.targetGbp)}
                  </td>

                  {/* Closed Won Revenue in GBP */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center font-bold text-brand-green text-sm font-mono px-3 py-1 rounded-lg bg-brand-green/15 border border-brand-green/30 shadow-green-glow whitespace-nowrap shrink-0">
                      {formatGbp(stat.closedRevenueGbp)}
                    </span>
                  </td>

                  {/* Active Pipeline */}
                  <td className="py-3 px-3 text-center font-mono text-brand-cyan font-semibold whitespace-nowrap">
                    {formatGbp(stat.totalPipelineGbp)}
                  </td>

                  {/* Pending Invoiced */}
                  <td className="py-3 px-3 text-center font-mono text-brand-orange whitespace-nowrap">
                    {stat.pendingInvoicedGbp > 0 ? formatGbp(stat.pendingInvoicedGbp) : '—'}
                  </td>

                  {/* Target Progress Bar */}
                  <td className="py-3 px-3">
                    <div className="space-y-1 w-36">
                      <div className="flex items-center justify-between text-[10px] font-mono whitespace-nowrap">
                        <span className="text-brand-gray">{stat.achievementPct}%</span>
                        <span className="text-brand-gray">
                          {formatGbp(stat.closedRevenueGbp)} / {formatGbp(stat.targetGbp)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-brand-black rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stat.achievementPct >= 100
                              ? 'bg-brand-green shadow-green-glow'
                              : 'bg-brand-cyan'
                          }`}
                          style={{ width: `${Math.min(100, stat.achievementPct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
