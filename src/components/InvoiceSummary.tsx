import React from 'react';
import { format, min, max } from 'date-fns';
import { Invoice } from '../types';

interface InvoiceSummaryProps {
  invoices: Invoice[];
}

export function InvoiceSummary({ invoices }: InvoiceSummaryProps) {
  if (invoices.length === 0) return null;

  const totalInvoices = invoices.length;
  const totalJars = invoices.reduce((sum, inv) => sum + inv.items[0].quantity, 0);
  
  const dates = invoices.map(inv => inv.date);
  const startDate = min(dates);
  const endDate = max(dates);

  return (
    <div className="bg-white dark:bg-[#0a0a0a] py-2.5 px-4 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 mb-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm gap-2 sm:gap-0">
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Total Invoices:</span>
        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{totalInvoices}</span>
      </div>
      <div className="w-full sm:w-px h-px sm:h-6 bg-slate-200 dark:bg-neutral-800"></div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Total Jars Sold:</span>
        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{totalJars}</span>
      </div>
      <div className="w-full sm:w-px h-px sm:h-6 bg-slate-200 dark:bg-neutral-800"></div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Period:</span>
        <span className="font-medium text-slate-800 dark:text-slate-100">
          {format(startDate, 'dd/MM/yy')} - {format(endDate, 'dd/MM/yy')}
        </span>
      </div>
    </div>
  );
}
