import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Calendar, Package, Check } from 'lucide-react';
import { Invoice, SellerDetails } from '../types';

interface InvoiceCardProps {
  invoice: Invoice;
  seller: SellerDetails;
  isExpanded?: boolean;
  onToggle?: () => void;
  isDone?: boolean;
  onMarkAsDone?: (e: React.MouseEvent) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, seller, isExpanded: controlledIsExpanded, onToggle, isDone, onMarkAsDone }) => {
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : localIsExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalIsExpanded(!localIsExpanded);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden transition-all hover:shadow-md">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer select-none relative group"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 sm:gap-4 w-full">
          {/* Action button */}
          <button 
            type="button"
            onClick={onMarkAsDone}
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm border transition-colors ${
              isDone 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 border-green-200 dark:border-green-800/50' 
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Mark as done and go to next"
          >
            <Check size={18} />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                {invoice.customerName}
              </h3>
              {isDone && (
                <span className="inline-flex items-center px-1.5 rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 border border-green-200 dark:border-green-800/50">
                  Done
                </span>
              )}
              <span className="inline-flex shrink-0 items-center px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs rounded-full font-medium border border-slate-200 dark:border-slate-700">
                #{invoice.id}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
                {format(invoice.date, 'dd/MM/yy')}
              </span>
              <span className="hidden xs:flex sm:flex items-center gap-1">
                <Package size={13} className="text-slate-400 dark:text-slate-500" />
                {invoice.items[0].quantity} {invoice.items[0].quantity > 1 ? 'Jars' : 'Jar'}
              </span>
            </div>
          </div>

          <div className="text-right pr-2 sm:pr-4 flex flex-col justify-center">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              ₹{invoice.grandTotal.toFixed(2)}
            </div>
            <div className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              inc. GST ₹{invoice.tax.totalGstAmount.toFixed(2)}
            </div>
            {/* Show info on mobile */}
            <div className="sm:hidden text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {invoice.items[0].quantity}x Jars
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2 text-slate-400 shrink-0">
          <div className="p-1 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-[#0a0a0a]/50 overflow-hidden"
          >
            <div className="w-full custom-scrollbar">
              <div className="w-full bg-white p-3 sm:p-8 text-black border-b border-slate-200 dark:border-slate-800">
                
                <div className="flex justify-between text-[8px] sm:text-xs font-bold mb-4">
                  <span>RETAIL INVOICE</span>
                  <span>GSTIN: {seller.gstin}</span>
                </div>
                
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="m-0 text-base sm:text-2xl font-extrabold tracking-wider">{seller.name}</h2>
                  <h1 className="my-1 sm:my-1.5 text-base sm:text-2xl font-extrabold tracking-wider">{seller.brand}</h1>
                  <p className="m-0 text-[10px] sm:text-sm font-semibold">{seller.address}</p>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-semibold">[ Package Drinking Water ]</p>
                </div>

                <div className="flex justify-between mb-3 sm:mb-4 text-[10px] sm:text-sm font-bold">
                  <div>Sl No: <span className="text-blue-600 text-[10px] sm:text-sm ml-1 sm:ml-2 font-semibold tracking-wide">{invoice.id}</span></div>
                  <div>Date: <span className="text-blue-600 text-[10px] sm:text-sm ml-1 sm:ml-2 font-semibold tracking-wide">{format(invoice.date, 'dd/MM/yyyy')}</span></div>
                </div>

                <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                  <div className="flex items-baseline">
                    <span className="font-bold text-[10px] sm:text-base w-14 sm:w-24 shrink-0">Name:</span>
                    <span className="text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.customerName}</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="font-bold text-[10px] sm:text-base w-14 sm:w-24 shrink-0">Address:</span>
                    <span className="text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.customerAddress}</span>
                  </div>
                </div>

                <table className="w-full border-collapse border border-black mb-4 sm:mb-6 text-[8px] sm:text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 sm:p-2 w-5 sm:w-12">Sl</th>
                      <th className="border border-black p-1 sm:p-2">Particulars</th>
                      <th className="border border-black p-1 sm:p-2 w-8 sm:w-20">HSN</th>
                      <th className="border border-black p-1 sm:p-2 w-8 sm:w-20">Qnty</th>
                      <th className="border border-black p-1 sm:p-2 w-10 sm:w-20">Rate</th>
                      <th className="border border-black p-1 sm:p-2 w-12 sm:w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-10 sm:h-24 align-top">
                      <td className="border border-black border-b-0 p-1 sm:p-2 text-center font-bold">1</td>
                      <td className="border border-black border-b-0 p-1 sm:p-2 text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide leading-tight">
                        {invoice.items[0].description === "20 Litre Packaged Drinking Water Jar" ? "Water 20 ltr" : invoice.items[0].description}
                      </td>
                      <td className="border border-black border-b-0 p-1 sm:p-2 text-center text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.items[0].hsn}</td>
                      <td className="border border-black border-b-0 p-1 sm:p-2 text-center text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.items[0].quantity} J</td>
                      <td className="border border-black border-b-0 p-1 sm:p-2 text-center text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.items[0].rate.toFixed(2)}</td>
                      <td className="border border-black border-b-0 p-1 sm:p-2 text-right text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.items[0].amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border border-black border-b-0 p-0.5 sm:p-1.5 px-1 sm:px-2 text-right text-blue-600 text-[8px] sm:text-sm font-semibold tracking-wide whitespace-nowrap">CGST 9%</td>
                      <td className="border border-black border-b-0 p-0.5 sm:p-1.5 px-1 sm:px-2 text-right text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.tax.cgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="border-l border-r border-b border-black"></td>
                      <td className="border-l border-r border-b border-black"></td>
                      <td className="border-l border-r border-b border-black"></td>
                      <td className="border-l border-r border-b border-black"></td>
                      <td className="border border-black p-0.5 sm:p-1.5 px-1 sm:px-2 text-right text-blue-600 text-[8px] sm:text-sm font-semibold tracking-wide whitespace-nowrap">SGST 9%</td>
                      <td className="border border-black p-0.5 sm:p-1.5 px-1 sm:px-2 text-right text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide">{invoice.tax.sgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="border border-black p-1 sm:p-2"></td>
                      <td className="border border-black p-1 sm:p-2 text-center font-extrabold text-[10px] sm:text-base">TOTAL</td>
                      <td className="border border-black p-1 sm:p-2 text-right text-blue-600 text-[10px] sm:text-sm font-bold tracking-wide">{invoice.grandTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex items-baseline mb-6 sm:mb-10">
                  <span className="font-extrabold text-[8px] sm:text-sm w-14 sm:w-20 shrink-0">RUPEES:</span>
                  <span className="text-blue-600 text-[10px] sm:text-sm font-semibold tracking-wide leading-tight">{invoice.amountInWords}</span>
                </div>

                <div className="text-right mt-8 sm:mt-12 pr-2 sm:pr-4">
                  <div className="inline-block text-center w-20 sm:w-40">
                    <div className="text-blue-600 text-xs sm:text-lg mb-0.5 sm:mb-1 font-semibold tracking-wide">Sourav</div>
                    <div className="border-t border-black pt-1 sm:pt-1.5 font-bold text-[8px] sm:text-sm">Signature</div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
