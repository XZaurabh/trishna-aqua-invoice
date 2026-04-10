import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { GenerationParams } from '../types';

interface InvoiceFormProps {
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
}

export function InvoiceForm({ onGenerate, isGenerating }: InvoiceFormProps) {
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(
    format(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [targetJars, setTargetJars] = useState<number | string>(0);
  const [startInvoiceNo, setStartInvoiceNo] = useState<number | string>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Randomly choose a number between 90 and 100 on mount
    setTargetJars(Math.floor(Math.random() * 11) + 90);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("Start date cannot be after end date.");
      return;
    }

    onGenerate({
      startDate: start,
      endDate: end,
      targetJars: Number(targetJars) || 0,
      startInvoiceNo: Number(startInvoiceNo) || 1
    });

    // Automatically change target total jars for the next generation
    setTargetJars(Math.floor(Math.random() * 11) + 90);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Generation Parameters</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800/50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Start Date</label>
          <input 
            type="date" 
            required
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 dark:focus:ring-slate-100 dark:focus:border-slate-100 outline-none transition-all font-mono text-sm dark:text-slate-200"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">End Date</label>
          <input 
            type="date" 
            required
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 dark:focus:ring-slate-100 dark:focus:border-slate-100 outline-none transition-all font-mono text-sm dark:text-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Target Total Jars</label>
          <input 
            type="number" 
            required
            min="5"
            value={targetJars}
            onChange={e => setTargetJars(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 dark:focus:ring-slate-100 dark:focus:border-slate-100 outline-none transition-all dark:text-slate-200"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Invoice count is auto-calculated.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Starting Sl No</label>
          <input 
            type="number" 
            required
            min="1"
            value={startInvoiceNo}
            onChange={e => setStartInvoiceNo(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 dark:focus:ring-slate-100 dark:focus:border-slate-100 outline-none transition-all dark:text-slate-200"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">First invoice number.</p>
        </div>
      </div>

      <div className="mt-6">
        <button 
          type="submit" 
          disabled={isGenerating}
          className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isGenerating ? 'Generating...' : 'Generate Invoices'}
        </button>
      </div>
    </form>
  );
}
