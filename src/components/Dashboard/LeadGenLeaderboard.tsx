import React from 'react';
import {
  CalendarCheck,
  ThumbsUp,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Deal, MasterRecord, MonthlyQuotas, TeamMember } from '../../types';

interface LeadGenLeaderboardProps {
  deals: Deal[];
  masterRecords: MasterRecord[];
  quotas: MonthlyQuotas;
  leadGenReps: TeamMember[];
  onSelectRep?: (repName: string) => void;
}

export const LeadGenLeaderboard: React.FC<LeadGenLeaderboardProps> = ({
  deals,
  masterRecords,
  quotas,
  leadGenReps,
  onSelectRep,
}) => {
  const repStats = leadGenReps.map((rep) => {
    const repMasterRecords = masterRecords.filter((r) => r.leadGenRep === rep.name);
    const repDeals = deals.filter((d) => d.leadGenRep === rep.name);

    const totalInterested = repMasterRecords.filter((r) => r.status === 'interested').length;

    const meetingsScheduled =
      repMasterRecords.filter((r) => r.status === 'meeting_scheduled').length +
      repDeals.filter((d) => d.stage === 'discovery_pitch' && !d.meetingCompleted).length;

    const meetingsDoneRecords = repMasterRecords.filter((r) => r.status === 'meeting_done');
    const meetingsDoneDeals = repDeals.filter((d) => d.meetingCompleted);
    const totalMeetingsDone = meetingsDoneRecords.length + meetingsDoneDeals.length;

    const meetingsCountYesRecords = meetingsDoneRecords.filter(
      (r) => r.meetingCountType === 'yes'
    ).length;
    const meetingsCountYesDeals = meetingsDoneDeals.filter(
      (d) => d.meetingCountType === 'yes' || !d.meetingCountType
    ).length;

    const totalMeetingCount = meetingsCountYesRecords + meetingsCountYesDeals + meetingsScheduled;

    const wonDealsCount = repDeals.filter((d) => d.stage === 'closed_won').length;
    const wonRevenueGbp = repDeals
      .filter((d) => d.stage === 'closed_won')
      .reduce((sum, d) => sum + (d.valueGbp || 0), 0);

    const targetObj = quotas.leadGenTargets.find((t) => t.memberName === rep.name);
    const targetMeetings = targetObj ? targetObj.targetMeetings : 12;
    const progressPct =
      targetMeetings > 0 ? Math.round((totalMeetingCount / targetMeetings) * 100) : 0;

    return {
      rep,
      totalMeetingCount,
      totalMeetingsDone,
      meetingsScheduled,
      totalInterested,
      wonDealsCount,
      wonRevenueGbp,
      targetMeetings,
      progressPct,
    };
  });

  const sortedStats = [...repStats].sort((a, b) => b.totalMeetingCount - a.totalMeetingCount);

  return (
    <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-midnight">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-white">Lead Generation Team Leaderboard</h3>
            <p className="text-xs text-brand-gray">
              Ranked from <strong className="text-brand-cyan">Highest to Lowest</strong> by Total Meeting Count (Meeting Count YES)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-gray font-mono whitespace-nowrap shrink-0">
          <span>7 Lead Generators</span>
          <span>·</span>
          <span className="text-brand-cyan font-semibold">Total Meetings Target</span>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead>
            <tr className="border-b border-brand-midnight text-brand-gray font-mono uppercase tracking-wider">
              <th className="py-3 px-3 w-20 whitespace-nowrap">Rank</th>
              <th className="py-3 px-3 min-w-[180px] whitespace-nowrap">Lead Generator</th>
              <th className="py-3 px-3 w-28 text-center whitespace-nowrap">Monthly Target</th>
              <th className="py-3 px-3 w-36 text-center whitespace-nowrap">Total Meeting Count</th>
              <th className="py-3 px-3 w-28 text-center whitespace-nowrap">Total Interested</th>
              <th className="py-3 px-3 w-24 text-center whitespace-nowrap">Scheduled</th>
              <th className="py-3 px-3 w-32 text-center whitespace-nowrap">Total Meeting Done</th>
              <th className="py-3 px-3 w-40 whitespace-nowrap">Target Progress</th>
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
                    isTop ? 'bg-brand-cyan/5' : ''
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

                  {/* Lead Generator Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm shrink-0"
                        style={{ backgroundColor: stat.rep.avatarColor || '#3B82F6' }}
                      >
                        {stat.rep.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-brand-white group-hover:text-brand-cyan transition-colors flex items-center gap-1.5 whitespace-nowrap">
                          <span>{stat.rep.name}</span>
                          {isTop && <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse shrink-0" />}
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono whitespace-nowrap">
                          {stat.wonDealsCount > 0 ? `£${stat.wonRevenueGbp.toLocaleString()} won pipeline` : 'Active Outbound'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Target Meetings */}
                  <td className="py-3 px-3 text-center font-mono text-brand-gray whitespace-nowrap">
                    {stat.targetMeetings} mtgs
                  </td>

                  {/* Total Meeting Count (Official Target Quota) */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center font-bold text-brand-cyan text-sm font-mono px-3 py-1 rounded-lg bg-brand-cyan/15 border border-brand-cyan/30 shadow-cyan-glow whitespace-nowrap shrink-0">
                      {stat.totalMeetingCount}
                    </span>
                  </td>

                  {/* Total Interested */}
                  <td className="py-3 px-3 text-center font-mono text-brand-white whitespace-nowrap">
                    <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                      <ThumbsUp className="w-3 h-3 text-brand-cyan shrink-0" />
                      <span>{stat.totalInterested}</span>
                    </span>
                  </td>

                  {/* Scheduled */}
                  <td className="py-3 px-3 text-center font-mono text-yellow-400 font-medium whitespace-nowrap">
                    {stat.meetingsScheduled}
                  </td>

                  {/* Total Meeting Done */}
                  <td className="py-3 px-3 text-center font-mono text-brand-green font-semibold whitespace-nowrap">
                    {stat.totalMeetingsDone}
                  </td>

                  {/* Progress Bar */}
                  <td className="py-3 px-3">
                    <div className="space-y-1 w-36">
                      <div className="flex items-center justify-between text-[10px] font-mono whitespace-nowrap">
                        <span className="text-brand-gray">{stat.progressPct}%</span>
                        <span className="text-brand-gray">
                          {stat.totalMeetingCount} / {stat.targetMeetings}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-brand-black rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stat.progressPct >= 100
                              ? 'bg-brand-green shadow-green-glow'
                              : 'bg-brand-cyan'
                          }`}
                          style={{ width: `${Math.min(100, stat.progressPct)}%` }}
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
