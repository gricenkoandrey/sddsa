import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { FileUploadZone } from './components/FileUploadZone';
import { SummaryMetricsCards } from './components/SummaryMetricsCards';
import { AttendanceTableView } from './components/AttendanceTableView';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ShiftSettingsModal } from './components/ShiftSettingsModal';
import { ShiftConfig, ProcessedReportResult } from './types';
import { DEFAULT_SHIFT_CONFIG } from './server/excelProcessor';
import { BarChart3, Table as TableIcon, Download, Sparkles, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(DEFAULT_SHIFT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [report, setReport] = useState<ProcessedReportResult | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');

  // Handle file upload to Express backend
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shiftConfig', JSON.stringify(shiftConfig));

      const res = await fetch('/api/process-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при обработке файла');
      }

      setReport(data.report);
      setReportId(data.reportId);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Произошла ошибка при загрузке и обработке файла.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run sample demo file
  const handleRunSample = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/process-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftConfig }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при обработке тестового файла');
      }

      setReport(data.report);
      setReportId(data.reportId);
    } catch (err: any) {
      console.error('Error processing sample:', err);
      setError(err.message || 'Ошибка обработки образца.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download raw sample input file
  const handleDownloadSample = () => {
    window.open('/api/sample-excel', '_blank');
  };

  // Download processed formatted Excel file
  const handleDownloadExcel = () => {
    if (reportId) {
      window.open(`/api/download-excel/${reportId}`, '_blank');
    } else if (report) {
      // Direct post generation if report exists locally
      fetch('/api/generate-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      })
        .then((res) => res.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = report.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        })
        .catch((e) => console.error('Error downloading excel:', e));
    }
  };

  const handleReset = () => {
    setReport(null);
    setReportId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 font-sans text-slate-900 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownloadSample={handleDownloadSample}
        onReset={handleReset}
        hasReport={!!report}
        formattedPeriod={report?.formattedPeriod}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!report ? (
          /* File Upload State */
          <div className="space-y-6">
            <FileUploadZone
              onFileUpload={handleFileUpload}
              onRunSample={handleRunSample}
              isLoading={isLoading}
              error={error}
            />
          </div>
        ) : (
          /* Processed Report Display */
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <SummaryMetricsCards
              report={report}
              onDownloadExcel={handleDownloadExcel}
              reportId={reportId}
            />

            {/* View Tabs Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/90 pb-3 gap-3">
              <div className="inline-flex bg-slate-200/80 p-1.5 rounded-2xl space-x-1.5 border border-slate-300/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'table'
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-950/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  <span>Таблица Учета (СКУД)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-950/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span>Аналитика Нарушений</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="hidden sm:inline-flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-4 py-2 rounded-xl border border-emerald-200/80 shadow-xs transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Загрузить итоговый .xlsx</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'table' ? (
              <AttendanceTableView
                employeeGroups={report.employeeGroups}
                notesText={report.notesText}
              />
            ) : (
              <AnalyticsPanel report={report} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-600">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>© {new Date().getFullYear()} СКУД Аналитик Pro • Автоматизированный учет рабочего времени</span>
          </div>
          <span className="text-slate-400 font-mono">
            OpenPyXL Engine v2.2 • Форматирование 1-в-1 • Столовая "Асхана"
          </span>
        </div>
      </footer>

      {/* Settings Modal */}
      <ShiftSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={shiftConfig}
        onSaveConfig={(newConfig) => {
          setShiftConfig(newConfig);
          if (report) {
            handleRunSample();
          }
        }}
      />
    </div>
  );
}

