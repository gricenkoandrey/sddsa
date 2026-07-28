import React from 'react';
import { FileSpreadsheet, Settings, Download, RefreshCw, Calendar, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onDownloadSample: () => void;
  onReset: () => void;
  hasReport: boolean;
  formattedPeriod?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onDownloadSample,
  onReset,
  hasReport,
  formattedPeriod,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-lg shadow-slate-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={onReset}
          title="На главную / Загрузить другой файл"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5 text-emerald-50" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                СКУД Аналитик
              </h1>
              <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-emerald-500/20 tracking-wide uppercase">
                Pro v2.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Автоматизированный учет рабочего времени и нарушений
            </p>
          </div>
        </div>

        {/* Status & Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {formattedPeriod && (
            <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Период:</span>
              <span className="text-white font-semibold font-mono">{formattedPeriod}</span>
            </div>
          )}

          <button
            onClick={onDownloadSample}
            type="button"
            className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-lg transition-all border border-slate-700/80 hover:border-slate-600 shadow-sm"
            title="Скачать исходный шаблон отчета СКУД (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Образец Excel</span>
          </button>

          <button
            onClick={onOpenSettings}
            type="button"
            className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-lg transition-all border border-slate-700/80 hover:border-slate-600 shadow-sm"
            title="Настройки рабочих смен, графиков и окон обеда"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">График смен</span>
          </button>

          {hasReport && (
            <button
              onClick={onReset}
              type="button"
              className="flex items-center space-x-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-all shadow-sm shadow-emerald-950/40"
              title="Загрузить другой отчет"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Новый файл</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

