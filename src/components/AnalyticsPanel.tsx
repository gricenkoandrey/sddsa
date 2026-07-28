import React from 'react';
import { AlertCircle, TrendingDown, Calendar, Clock, Award, ShieldAlert, CheckCircle, BarChart3 } from 'lucide-react';
import { ProcessedReportResult } from '../types';

interface AnalyticsPanelProps {
  report: ProcessedReportResult;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ report }) => {
  const { employeeGroups, summaryMetrics } = report;

  // Top employees by total violation minutes
  const topViolators = [...employeeGroups]
    .filter((g) => g.totalViolationMinutes > 0)
    .sort((a, b) => b.totalViolationMinutes - a.totalViolationMinutes)
    .slice(0, 6);

  // Group violations by day of week
  const dayOfWeekViolations: Record<string, number> = {
    'Понедельник': 0,
    'Вторник': 0,
    'Среда': 0,
    'Четверг': 0,
    'Пятница': 0,
    'Суббота': 0,
    'Воскресенье': 0,
  };

  const dayMap: Record<string, string> = {
    'понедельник': 'Понедельник',
    'вторник': 'Вторник',
    'среда': 'Среда',
    'четверг': 'Четверг',
    'пятница': 'Пятница',
    'суббота': 'Суббота',
    'воскресенье': 'Воскресенье',
  };

  employeeGroups.forEach((g) => {
    g.dailyRecords.forEach((r) => {
      if (r.hasViolation) {
        const fullDay = dayMap[r.dayOfWeekStr] || 'Понедельник';
        dayOfWeekViolations[fullDay] = (dayOfWeekViolations[fullDay] || 0) + 1;
      }
    });
  });

  const maxDayCount = Math.max(...Object.values(dayOfWeekViolations), 1);

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Violators List Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Рейтинг по потерянному рабочему времени
                </h3>
                <p className="text-xs text-slate-500">Сотрудники с максимальной суммой минут опозданий и уходов</p>
              </div>
            </div>

            {topViolators.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700">Нарушений графиков не зафиксировано!</p>
                <p className="text-slate-400">Все сотрудники отработали смены без опозданий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topViolators.map((group, idx) => (
                  <div
                    key={group.employee.fio}
                    className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-rose-600 text-white shadow-xs'
                          : idx === 1
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {group.employee.fio}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {group.employee.position}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="text-xs font-black text-rose-700 bg-rose-100/90 px-2.5 py-1 rounded-lg border border-rose-200/60 font-mono">
                        {group.totalViolationMinutes} мин
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {group.totalViolationsCount} дн. с наруш.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Violations Distribution by Day of Week Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Распределение нарушений по дням недели
                </h3>
                <p className="text-xs text-slate-500">Пиковые дни опозданий и невыходов на смену</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {Object.entries(dayOfWeekViolations).map(([day, count]) => {
                const pct = Math.round((count / maxDayCount) * 100);
                const isPeak = count === maxDayCount && count > 0;
                return (
                  <div key={day} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className={isPeak ? 'font-bold text-rose-700' : ''}>{day}</span>
                      <span className="text-slate-500 font-mono">{count} случаев</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPeak ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Insight Highlights */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-2.5 mb-3">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold tracking-tight">
            Сводное резюме дисциплины за период
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-2">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 block mb-1">Соотношение опозданий / уходов</span>
            <p className="text-white font-semibold">
              {summaryMetrics.totalLateEvents} опозданий к началу смены vs {summaryMetrics.totalEarlyEvents} ранних уходов.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 block mb-1">Потеря рабочего времени</span>
            <p className="text-rose-400 font-bold font-mono">
              Суммарно потеряно {Math.floor(summaryMetrics.totalViolationMinutes / 60)} ч {summaryMetrics.totalViolationMinutes % 60} мин.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 block mb-1">Контроль обедов (Асхана)</span>
            <p className="text-emerald-400 font-semibold">
              Зафиксировано {summaryMetrics.totalLunchBreaksLogged} проходов через столовую.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

