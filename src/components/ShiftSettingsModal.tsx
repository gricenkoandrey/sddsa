import React, { useState } from 'react';
import { X, Clock, Check, RotateCcw, SlidersHorizontal, Utensils, Sun, Moon } from 'lucide-react';
import { ShiftConfig } from '../types';
import { DEFAULT_SHIFT_CONFIG, minsToTimeStr } from '../server/excelProcessor';

interface ShiftSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShiftConfig;
  onSaveConfig: (newConfig: ShiftConfig) => void;
}

export const ShiftSettingsModal: React.FC<ShiftSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [dayStart, setDayStart] = useState(minsToTimeStr(config.dayStartMins));
  const [dayEnd, setDayEnd] = useState(minsToTimeStr(config.dayEndMins));

  const [eveningStart, setEveningStart] = useState(minsToTimeStr(config.eveningStartMins));
  const [eveningEnd, setEveningEnd] = useState(minsToTimeStr(config.eveningEndMins));

  const [nightStart, setNightStart] = useState(minsToTimeStr(config.nightStartMins));

  const [lunchStart, setLunchStart] = useState(minsToTimeStr(config.lunchWindowStartMins));
  const [lunchEnd, setLunchEnd] = useState(minsToTimeStr(config.lunchWindowEndMins));
  const [lunchFixedEnd, setLunchFixedEnd] = useState(minsToTimeStr(config.lunchFixedEndMins));

  if (!isOpen) return null;

  const timeStrToMins = (timeStr: string, fallback: number): number => {
    if (!timeStr) return fallback;
    const parts = timeStr.split(':');
    if (parts.length < 2) return fallback;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return fallback;
    return h * 60 + m;
  };

  const handleResetDefaults = () => {
    setDayStart(minsToTimeStr(DEFAULT_SHIFT_CONFIG.dayStartMins));
    setDayEnd(minsToTimeStr(DEFAULT_SHIFT_CONFIG.dayEndMins));
    setEveningStart(minsToTimeStr(DEFAULT_SHIFT_CONFIG.eveningStartMins));
    setEveningEnd(minsToTimeStr(DEFAULT_SHIFT_CONFIG.eveningEndMins));
    setNightStart(minsToTimeStr(DEFAULT_SHIFT_CONFIG.nightStartMins));
    setLunchStart(minsToTimeStr(DEFAULT_SHIFT_CONFIG.lunchWindowStartMins));
    setLunchEnd(minsToTimeStr(DEFAULT_SHIFT_CONFIG.lunchWindowEndMins));
    setLunchFixedEnd(minsToTimeStr(DEFAULT_SHIFT_CONFIG.lunchFixedEndMins));
  };

  const handleSave = () => {
    const updated: ShiftConfig = {
      ...config,
      dayStartMins: timeStrToMins(dayStart, DEFAULT_SHIFT_CONFIG.dayStartMins),
      dayEndMins: timeStrToMins(dayEnd, DEFAULT_SHIFT_CONFIG.dayEndMins),
      eveningStartMins: timeStrToMins(eveningStart, DEFAULT_SHIFT_CONFIG.eveningStartMins),
      eveningEndMins: timeStrToMins(eveningEnd, DEFAULT_SHIFT_CONFIG.eveningEndMins),
      nightStartMins: timeStrToMins(nightStart, DEFAULT_SHIFT_CONFIG.nightStartMins),
      lunchWindowStartMins: timeStrToMins(lunchStart, DEFAULT_SHIFT_CONFIG.lunchWindowStartMins),
      lunchWindowEndMins: timeStrToMins(lunchEnd, DEFAULT_SHIFT_CONFIG.lunchWindowEndMins),
      lunchFixedEndMins: timeStrToMins(lunchFixedEnd, DEFAULT_SHIFT_CONFIG.lunchFixedEndMins),
    };
    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Параметры графиков и смен</h3>
              <p className="text-[11px] text-slate-400">Правила определения нормативов работы</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Day Shift */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Дневная смена (По умолчанию)</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">Вход до 14:00</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Начало дня (План)</label>
                <input
                  type="time"
                  value={dayStart}
                  onChange={(e) => setDayStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Конец дня (План)</label>
                <input
                  type="time"
                  value={dayEnd}
                  onChange={(e) => setDayEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Evening Shift */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Вечерняя смена</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">Вход 14:00 – 21:00</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Начало смены</label>
                <input
                  type="time"
                  value={eveningStart}
                  onChange={(e) => setEveningStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Конец смены</label>
                <input
                  type="time"
                  value={eveningEnd}
                  onChange={(e) => setEveningEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Lunch Settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span>Обеденный перерыв ("Асхана")</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Окно с</label>
                <input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Окно по</label>
                <input
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Фикс. Конец</label>
                <input
                  type="time"
                  value={lunchFixedEnd}
                  onChange={(e) => setLunchFixedEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              * Если зафиксирован проход 'вход' в столовую в указанный диапазон, время начала обеда берется по фактическому первому входу, а конец устанавливается автоматически.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100/90 px-6 py-4 flex items-center justify-between border-t border-slate-200">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить настройки</span>
          </button>

          <div className="flex space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

