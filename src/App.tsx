import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceSummary } from './components/InvoiceSummary';
import { InvoiceList } from './components/InvoiceList';
import { generateInvoices } from './lib/invoice-generator';
import { GenerationParams, Invoice, SellerDetails } from './types';
import { Download, Printer } from 'lucide-react';

const DEFAULT_SELLER: SellerDetails = {
  name: "SREE KRISHNA FOOD AND BEVERAGES",
  brand: "TRISHNA AQUA",
  address: "Saidabari, Kumarghat, Unakoti Tripura",
  gstin: "16EFMPS6521H1Z2",
  phone: ""
};

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [seller] = useState<SellerDetails>(DEFAULT_SELLER);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleGenerate = (params: GenerationParams) => {
    setIsGenerating(true);
    // Small timeout to allow UI to update to "Generating..." state
    setTimeout(() => {
      try {
        const newInvoices = generateInvoices(params);
        setInvoices(newInvoices);
      } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Failed to generate invoices");
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) return;

    const headers = ['Date', 'Customer', 'Address', 'Quantity', 'Base Amount', 'CGST', 'SGST', 'Total GST', 'Grand Total'];
    const rows = invoices.map(inv => [
      format(inv.date, 'yyyy-MM-dd'),
      `"${inv.customerName}"`,
      `"${inv.customerAddress}"`,
      inv.items[0].quantity,
      inv.baseAmount.toFixed(2),
      inv.tax.cgstAmount.toFixed(2),
      inv.tax.sgstAmount.toFixed(2),
      inv.tax.totalGstAmount.toFixed(2),
      inv.grandTotal.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clear-ledger-export-${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAll = () => {
    if (invoices.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Print All Invoices</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 0; background: #fff; }
            .invoice-page { padding: 20px; width: 100%; max-width: 100%; page-break-after: always; box-sizing: border-box; min-height: 100vh; background-color: #fff; }
            .invoice-page:last-child { page-break-after: auto; }
            .handwritten { color: #2563eb; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .invoice-page { padding: 15px; background-color: #fff !important; }
            }
          </style>
        </head>
        <body>
          ${invoices.map(invoice => `
            <div class="invoice-page">
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
                <span>RETAIL INVOICE</span>
                <span>GSTIN: ${seller.gstin}</span>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">${seller.name}</h2>
                <h1 style="margin: 8px 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">${seller.brand}</h1>
                <p style="margin: 0; font-size: 15px; font-weight: 600;">${seller.address}</p>
                <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600;">[ Package Drinking Water ]</p>
              </div>

              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px; font-weight: 700;">
                <div>Sl No: <span class="handwritten" style="margin-left: 10px;">${invoice.id}</span></div>
                <div>Date: <span class="handwritten" style="margin-left: 10px;">${format(invoice.date, 'dd/MM/yyyy')}</span></div>
              </div>

              <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-weight: 700; font-size: 18px; width: 100px;">Name:</span>
                  <div style="flex-grow: 1;">
                    <span class="handwritten">${invoice.customerName}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-weight: 700; font-size: 18px; width: 100px;">Address:</span>
                  <div style="flex-grow: 1;">
                    <span class="handwritten">${invoice.customerAddress}</span>
                  </div>
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th style="border: 1px solid black; padding: 10px; width: 50px;">Sl</th>
                    <th style="border: 1px solid black; padding: 10px;">Particulars</th>
                    <th style="border: 1px solid black; padding: 10px; width: 80px;">HSN</th>
                    <th style="border: 1px solid black; padding: 10px; width: 80px;">Qnty</th>
                    <th style="border: 1px solid black; padding: 10px; width: 80px;">Rate</th>
                    <th style="border: 1px solid black; padding: 10px; width: 100px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="height: 120px; vertical-align: top;">
                    <td style="border: 1px solid black; border-bottom: none; padding: 10px; text-align: center; font-weight: bold;">1</td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 10px;" class="handwritten">${invoice.items[0].description === "20 Litre Packaged Drinking Water Jar" ? "Water 20 ltr" : invoice.items[0].description}</td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 10px; text-align: center;" class="handwritten">${invoice.items[0].hsn}</td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 10px; text-align: center;" class="handwritten">${invoice.items[0].quantity} J</td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 10px; text-align: center;" class="handwritten">${invoice.items[0].rate.toFixed(2)}</td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 10px; text-align: right;" class="handwritten">${invoice.items[0].amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
                    <td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
                    <td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
                    <td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 5px 10px; text-align: right; white-space: nowrap;" class="handwritten">CGST 9%</td>
                    <td style="border: 1px solid black; border-bottom: none; padding: 5px 10px; text-align: right;" class="handwritten">${invoice.tax.cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black;"></td>
                    <td style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black;"></td>
                    <td style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black;"></td>
                    <td style="border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black;"></td>
                    <td style="border: 1px solid black; padding: 5px 10px; text-align: right; white-space: nowrap;" class="handwritten">SGST 9%</td>
                    <td style="border: 1px solid black; padding: 5px 10px; text-align: right;" class="handwritten">${invoice.tax.sgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="4" style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; font-weight: 800; font-size: 18px;">TOTAL</td>
                    <td style="border: 1px solid black; padding: 10px; text-align: right; font-weight: 700;" class="handwritten">${invoice.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style="display: flex; align-items: center; margin-bottom: 40px;">
                <span style="font-weight: 800; font-size: 16px; width: 100px;">RUPEES:</span>
                <div style="flex-grow: 1;">
                  <span class="handwritten">${invoice.amountInWords}</span>
                </div>
              </div>

              <div style="text-align: right; margin-top: 60px; padding-right: 20px;">
                <div style="display: inline-block; text-align: center; width: 200px;">
                  <div class="handwritten" style="font-size: 32px; margin-bottom: 5px;">Sourav</div>
                  <div style="border-top: 1px solid black; padding-top: 8px; font-weight: 800; font-size: 16px;">Signature</div>
                </div>
              </div>
            </div>
          `).join('')}
          <script>
            // Wait for fonts to load before printing
            document.fonts.ready.then(() => {
              window.print();
              window.close();
            });
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-50 font-sans selection:bg-slate-200 dark:selection:bg-neutral-800">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-slate-200 dark:border-neutral-900 sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight uppercase leading-none mt-1">
              <span className="text-slate-900 dark:text-white">TRISHNA</span>
              <span className="text-blue-500 ml-1.5">INVOICE</span>
            </h1>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
              SREE KRISHNA FOOD AND BEVERAGES
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {invoices.length > 0 && (
              <>
                <button 
                  onClick={handlePrintAll}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">Print All (PDF)</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          {/* Top: Controls */}
          <div className="w-full">
            <InvoiceForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>

          {/* Bottom: Results */}
          <div className="w-full">
            <InvoiceSummary invoices={invoices} />
            <InvoiceList invoices={invoices} seller={seller} />
          </div>
        </div>
      </main>
    </div>
  );
}
