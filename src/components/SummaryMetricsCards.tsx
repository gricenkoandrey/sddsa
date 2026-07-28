import React from 'react';
import { Users, AlertTriangle, Clock, Calendar, Utensils, HelpCircle, Download, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ProcessedReportResult } from '../types';

interface SummaryMetricsCardsProps {
  report: ProcessedReportResult;
  onDownloadExcel: () => void;
  reportId?: string | null;
}

export const SummaryMetricsCards: React.FC<SummaryMetricsCardsProps> = ({
  report,
  onDownloadExcel,
}) => {
  const { summaryMetrics, formattedPeriod } = report;

  const formatTotalTime = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs} ч ${mins} мин`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm mb-6 space-y-6">
      {/* Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
              Сводная Аналитика
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Период: <strong className="text-slate-800 font-mono">{formattedPeriod}</strong>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Отчет учета рабочего времени и посещаемости
          </h2>
        </div>

        <button
          onClick={onDownloadExcel}
          type="button"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/15 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Загрузить Excel (.xlsx)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Employees */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Сотрудники</span>
            <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {summaryMetrics.totalEmployees}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">В выгрузке СКУД</p>
        </div>

        {/* Card 2: Total Violations */}
        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold text-rose-800">Всего нарушений</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {summaryMetrics.totalViolations}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">
            Потеряно: {formatTotalTime(summaryMetrics.totalViolationMinutes)}
          </p>
        </div>

        {/* Card 3: Late Arrivals */}
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold text-amber-900">Опозданий</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 tracking-tight">
            {summaryMetrics.totalLateEvents}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Приходов позже нормы</p>
        </div>

        {/* Card 4: Early Departures */}
        <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-200/80 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between text-orange-800 mb-2">
            <span className="text-xs font-semibold text-orange-900">Ранних уходов</span>
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-800 tracking-tight">
            {summaryMetrics.totalEarlyEvents}
          </div>
          <p className="text-[11px] text-orange-700 mt-1">Уходов до конца смены</p>
        </div>

        {/* Card 5: Missing Punches */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700">Нет входа/выхода</span>
            <div className="p-1.5 rounded-lg bg-slate-200/70 text-slate-600">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {summaryMetrics.totalMissingPunches}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Пропущенные отметки</p>
        </div>

        {/* Card 6: Lunch Breaks */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold text-emerald-900">Обедов в "Асхана"</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Utensils className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 tracking-tight">
            {summaryMetrics.totalLunchBreaksLogged}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Зарегистрировано обедов</p>
        </div>
      </div>
    </div>
  );
};

