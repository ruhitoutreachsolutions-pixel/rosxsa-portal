import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { StorageService } from '../../lib/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataResetOrImported: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataResetOrImported,
}) => {
  if (!isOpen) return null;

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Export JSON Backup
  const handleExportJson = () => {
    const json = StorageService.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ROSxSA_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage('Backup JSON downloaded successfully!');
  };

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = StorageService.importFullBackup(text);
        if (success) {
          setStatusMessage('Backup imported and synced successfully!');
          onDataResetOrImported();
        } else {
          setStatusMessage('Failed to parse backup JSON. Please check the file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Reset to Default Seed Data
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all portal data to initial default data?')) {
      StorageService.resetToDefaultData();
      setStatusMessage('Data reset to defaults successfully.');
      onDataResetOrImported();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">Backup & Data Management</h3>
              <p className="text-xs text-brand-gray">Export, restore, or reset portal records</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Export Card */}
          <div className="p-4 rounded-xl bg-brand-black border border-brand-midnight flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-brand-white flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-brand-cyan" />
                Export Full Backup (JSON)
              </h4>
              <p className="text-[11px] text-brand-gray mt-0.5">
                Includes all 12 reps, deals, invoices, master DNC records, and targets.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="p-4 rounded-xl bg-brand-black border border-brand-midnight flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-brand-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-brand-green" />
                Restore / Import Backup
              </h4>
              <p className="text-[11px] text-brand-gray mt-0.5">
                Upload a previously exported JSON backup file.
              </p>
            </div>
            <label className="px-3.5 py-2 rounded-xl bg-brand-midnight text-brand-white hover:bg-brand-midnight/80 border border-white/10 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Select File</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          {/* Reset Card */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-red-400" />
                Reset to Default Data
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Restores standard sample data for all 5 sales reps and 7 lead gen reps.
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 text-xs font-semibold transition-colors shrink-0"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-brand-black border-t border-brand-midnight flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
