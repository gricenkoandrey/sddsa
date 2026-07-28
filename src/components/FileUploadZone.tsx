import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Sparkles, AlertCircle, Loader2, Clock, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  onRunSample: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
  onRunSample,
  isLoading,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls')
      ) {
        onFileUpload(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      {/* Title Banner */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/80 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>СКУД Система Учета Рабочего Времени</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Автоматическая обработка отчетов турникетов
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Загрузите первичный файл Excel из системы СКУД для расчета смен, опозданий, обедов в столовой и генерации итоговой таблицы.
        </p>
      </div>

      {/* Main Upload Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 shadow-sm ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/70 shadow-xl ring-4 ring-emerald-500/10 scale-[1.01]'
            : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50/70 shadow-slate-200/50 hover:shadow-md'
        } ${isLoading ? 'pointer-events-none opacity-85' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-5">
          {/* Icon Badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
              {isLoading ? (
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              ) : (
                <FileSpreadsheet className="w-10 h-10 text-white" />
              )}
            </div>
            {!isLoading && (
              <div className="absolute -bottom-1 -right-1 bg-slate-900 text-emerald-400 p-1.5 rounded-lg shadow border border-slate-800">
                <Upload className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">
              {isLoading ? 'Идет обработка отчета СКУД...' : 'Перетащите Excel файл или нажмите для выбора'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Поддерживаются исходные файлы выгрузки СКУД (например{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-medium border border-slate-200">
                asdasda_2_2.xlsx
              </code>
              )
            </p>
          </div>

          {!isLoading && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Загрузить .xlsx файл</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSample();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 group"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
                <span>Запустить на демо-данных</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2 text-left max-w-lg shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Value Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-3 hover:border-slate-300 transition-colors">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Умная идентификация смен</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Распределение на дневные, вечерние и ночные смены по первому входу на турникете.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-3 hover:border-slate-300 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">100% точность формата Excel</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Генерация итогового файла с формулами `=SUM()`, зебра-стилями и шапкой 1-в-1.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-3 hover:border-slate-300 transition-colors">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Авто-подсветка нарушений</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Красная подсветка опозданий, ранних уходов и детальная сводная аналитика.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

