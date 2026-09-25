import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyRow, MonthlyJarTier, GeneratorConfig } from '../types';
import { generateMonthlySales } from '../lib/monthly-generator';
import { 
  Download, 
  Printer, 
  Copy, 
  RefreshCw, 
  Search, 
  Edit2, 
  Check, 
  X, 
  Plus, 
  ChevronDown, 
  Calendar, 
  Hash, 
  Package, 
  DollarSign, 
  FileText 
} from 'lucide-react';

interface ShortcutPageProps {
  config: GeneratorConfig;
}

export function ShortcutPage({ config }: ShortcutPageProps) {
  // State for parameters
  const [startDateStr, setStartDateStr] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [endDateStr, setEndDateStr] = useState<string>(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [startMemoNo, setStartMemoNo] = useState<number>(1);
  const [tier, setTier] = useState<MonthlyJarTier>('mid');
  const [customJars, setCustomJars] = useState<number>(500);

  // State for rows
  const [rows, setRows] = useState<MonthlyRow[]>(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return generateMonthlySales(
      { startDate: start, endDate: end, startMemoNo: 1, tier: 'mid' },
      config
    );
  });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MonthlyRow>>({});
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Calculate quick summary metrics
  const totals = useMemo(() => {
    const jars = rows.reduce((sum, r) => sum + r.quantity, 0);
    const amount = rows.reduce((sum, r) => sum + r.amount, 0);
    const cgst = rows.reduce((sum, r) => sum + r.cgstAmount, 0);
    const sgst = rows.reduce((sum, r) => sum + r.sgstAmount, 0);
    return {
      days: rows.length,
      jars,
      amount: Number(amount.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2))
    };
  }, [rows]);

  // Handler to generate
  const handleGenerate = (selectedTier: MonthlyJarTier = tier, customVal: number = customJars) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      alert('Invalid date range specified');
      return;
    }
    const newRows = generateMonthlySales(
      {
        startDate: start,
        endDate: end,
        startMemoNo: startMemoNo || 1,
        tier: selectedTier,
        customJars: customVal
      },
      config
    );
    setRows(newRows);
  };

  const handleSetThisMonth = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    setStartDateStr(format(start, 'yyyy-MM-dd'));
    setEndDateStr(format(end, 'yyyy-MM-dd'));
    const newRows = generateMonthlySales(
      { startDate: start, endDate: end, startMemoNo: startMemoNo || 1, tier, customJars },
      config
    );
    setRows(newRows);
  };

  const handleSetLastMonth = () => {
    const prev = subMonths(new Date(), 1);
    const start = startOfMonth(prev);
    const end = endOfMonth(prev);
    setStartDateStr(format(start, 'yyyy-MM-dd'));
    setEndDateStr(format(end, 'yyyy-MM-dd'));
    const newRows = generateMonthlySales(
      { startDate: start, endDate: end, startMemoNo: startMemoNo || 1, tier, customJars },
      config
    );
    setRows(newRows);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(r => 
      r.customerName.toLowerCase().includes(term) ||
      r.memoNo.toLowerCase().includes(term) ||
      format(r.date, 'dd/MM/yyyy').includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  // Inline Row Edit handlers
  const handleStartEdit = (row: MonthlyRow) => {
    setEditingId(row.id);
    setEditFormData({ ...row });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setRows(prev => prev.map(r => {
      if (r.id === editingId) {
        const qty = editFormData.quantity || r.quantity;
        const rate = config.product.rate || 16.95;
        const amt = Number((qty * rate).toFixed(2));
        const cgst = Number((amt * ((config.tax.cgstRate || 9) / 100)).toFixed(2));
        const sgst = Number((amt * ((config.tax.sgstRate || 9) / 100)).toFixed(2));
        return {
          ...r,
          customerName: editFormData.customerName || r.customerName,
          memoNo: editFormData.memoNo || r.memoNo,
          quantity: qty,
          amount: amt,
          cgstAmount: cgst,
          sgstAmount: sgst,
          description: editFormData.description || r.description
        };
      }
      return r;
    }));
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleDeleteRow = (id: string) => {
    if (window.confirm("Are you sure you want to remove this row?")) {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  // PDF Export logic using jsPDF & autoTable
  const generatePDF = (mode: 'both' | 'page1' | 'page2') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const seller = config.seller;
    const marginX = 10;
    const pageWidth = 210;
    const printableWidth = pageWidth - (marginX * 2); // 190mm
    const rightX = pageWidth - marginX; // 200mm
    const centerX = pageWidth / 2; // 105mm

    // Helper to draw Clean Corporate Letterhead Header
    const drawHeader = (title: string) => {
      // Company Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(seller.name, centerX, 11, { align: 'center' });

      // Brand Name
      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(seller.brand.toUpperCase(), centerX, 16, { align: 'center' });

      // Address
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(seller.address, centerX, 20.5, { align: 'center' });

      // GSTIN & HSN Line
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`GSTIN: ${seller.gstin}   |   HSN: ${config.product.hsn || '2201'}`, centerX, 24.5, { align: 'center' });

      // Crisp Horizontal Divider Line
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.4);
      doc.line(marginX, 27.5, rightX, 27.5);

      // Document Title (Left) & Date Period (Right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(title, marginX, 33);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Period: ${format(new Date(startDateStr), 'dd/MM/yyyy')} to ${format(new Date(endDateStr), 'dd/MM/yyyy')}`, rightX, 33, { align: 'right' });
    };

    // PAGE 1: Detailed Table (Customer Name, Address, Date, Memo, Qnty, Amount, CGST, SGST, Description)
    if (mode === 'both' || mode === 'page1') {
      drawHeader('MONTHLY SALES REGISTER (DETAILED LEDGER)');

      const headersPage1 = [
        ['Sl', 'Customer Name', 'Address', 'Date', 'Memo', 'Qnty', 'Amount (Rs)', 'CGST 9%', 'SGST 9%', 'Description']
      ];

      const bodyPage1 = rows.map((r, idx) => [
        (idx + 1).toString(),
        r.customerName,
        r.customerAddress,
        format(r.date, 'dd/MM/yyyy'),
        r.memoNo,
        `${r.quantity} J`,
        r.amount.toFixed(2),
        r.cgstAmount.toFixed(2),
        r.sgstAmount.toFixed(2),
        r.description
      ]);

      // Add totals row
      bodyPage1.push([
        '',
        'TOTAL',
        '',
        '',
        '',
        `${totals.jars} J`,
        totals.amount.toFixed(2),
        totals.cgst.toFixed(2),
        totals.sgst.toFixed(2),
        ''
      ]);

      autoTable(doc, {
        startY: 36.5,
        margin: { left: marginX, right: marginX, top: 36.5, bottom: 15 },
        tableWidth: printableWidth,
        head: headersPage1,
        body: bodyPage1,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
          valign: 'middle',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
          cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
          valign: 'middle',
          halign: 'center',
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 12, halign: 'center' },
          5: { cellWidth: 12, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 16, halign: 'center' },
          8: { cellWidth: 16, halign: 'center' },
          9: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.row.index === bodyPage1.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = [15, 23, 42];
            data.cell.styles.halign = 'center';
          }
        }
      });

      // Signature block
      let finalY = (doc as any).lastAutoTable?.finalY || 200;
      if (finalY + 25 > 280) {
        doc.addPage();
        finalY = 20;
      }
      const sigY = finalY + 12;
      doc.setFont('cursive', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text(seller.signature || 'Sourav', 172.5, sigY - 2, { align: 'center' });
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.line(150, sigY + 1, 195, sigY + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Signature', 172.5, sigY + 5.5, { align: 'center' });
    }

    // Add page 2 if combined
    if (mode === 'both') {
      doc.addPage();
    }

    // PAGE 2: Summary Register (Date, Sl No, Qnty, Amount, CGST, SGST, Description) - NO Customer Name, NO Address
    if (mode === 'both' || mode === 'page2') {
      drawHeader('MONTHLY SALES REGISTER (CONCISE REGISTER)');

      const headersPage2 = [
        ['Sl', 'Date', 'Memo / Sl No', 'Quantity', 'Amount (Rs)', 'CGST (9%)', 'SGST (9%)', 'Description']
      ];

      const bodyPage2 = rows.map((r, idx) => [
        (idx + 1).toString(),
        format(r.date, 'dd/MM/yyyy'),
        r.memoNo,
        `${r.quantity} Jars`,
        r.amount.toFixed(2),
        r.cgstAmount.toFixed(2),
        r.sgstAmount.toFixed(2),
        r.description
      ]);

      // Add totals row
      bodyPage2.push([
        '',
        'TOTAL',
        '',
        `${totals.jars} Jars`,
        totals.amount.toFixed(2),
        totals.cgst.toFixed(2),
        totals.sgst.toFixed(2),
        ''
      ]);

      autoTable(doc, {
        startY: 36.5,
        margin: { left: marginX, right: marginX, top: 36.5, bottom: 15 },
        tableWidth: printableWidth,
        head: headersPage2,
        body: bodyPage2,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
          valign: 'middle',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
          valign: 'middle',
          halign: 'center',
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 24, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 26, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 44, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.row.index === bodyPage2.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = [15, 23, 42];
            data.cell.styles.halign = 'center';
          }
        }
      });

      // Signature block for Page 2
      let finalY2 = (doc as any).lastAutoTable?.finalY || 200;
      if (finalY2 + 25 > 280) {
        doc.addPage();
        finalY2 = 20;
      }
      const sigY2 = finalY2 + 12;
      doc.setFont('cursive', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text(seller.signature || 'Sourav', 172.5, sigY2 - 2, { align: 'center' });
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.line(150, sigY2 + 1, 195, sigY2 + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Signature', 172.5, sigY2 + 5.5, { align: 'center' });
    }

    // Add page numbers footer to each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, centerX, 290, { align: 'center' });
    }

    const filename = mode === 'page1' 
      ? `monthly-sales-detailed-${startDateStr}.pdf` 
      : mode === 'page2'
      ? `monthly-sales-summary-${startDateStr}.pdf`
      : `monthly-sales-ledger-${startDateStr}.pdf`;

    doc.save(filename);
    setShowPdfMenu(false);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const headers = ['Customer Name', 'Date', 'Memo / Sl No', 'Quantity', 'Amount (Rs)', 'CGST 9%', 'SGST 9%', 'Description'];
    const csvRows = rows.map(r => [
      `"${r.customerName}"`,
      format(r.date, 'dd/MM/yyyy'),
      r.memoNo,
      r.quantity,
      r.amount.toFixed(2),
      r.cgstAmount.toFixed(2),
      r.sgstAmount.toFixed(2),
      `"${r.description}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `monthly-sales-${startDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy TSV to Clipboard
  const handleCopyTSV = () => {
    if (rows.length === 0) return;
    const headers = ['Customer Name', 'Date', 'Sl No', 'Qnty', 'Amount', 'CGST', 'SGST', 'Description'];
    const tsvRows = rows.map(r => [
      r.customerName,
      format(r.date, 'dd/MM/yyyy'),
      r.memoNo,
      r.quantity,
      r.amount.toFixed(2),
      r.cgstAmount.toFixed(2),
      r.sgstAmount.toFixed(2),
      r.description
    ].join('\t'));

    const content = [headers.join('\t'), ...tsvRows].join('\n');
    navigator.clipboard.writeText(content).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    });
  };

  // Printable Worksheet window
  const handlePrintWorksheet = () => {
    if (rows.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const seller = config.seller;
    const html = `
      <html>
        <head>
          <title>Monthly Sales Printable Worksheet</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #000; margin: 20px; background: #fff; }
            h2 { text-align: center; margin: 0 0 4px 0; font-size: 20px; }
            h3 { text-align: center; margin: 0 0 4px 0; font-size: 16px; }
            p.sub { text-align: center; margin: 0 0 16px 0; font-size: 13px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 6px 8px; }
            th { background-color: #f1f5f9; font-weight: bold; text-align: left; }
            .num { text-align: right; }
            .center { text-align: center; }
            .totals { font-weight: bold; background-color: #f8fafc; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h2>${seller.name}</h2>
          <h3>${seller.brand}</h3>
          <p class="sub">MONTHLY SALES WORKSHEET (${format(new Date(startDateStr), 'dd/MM/yyyy')} – ${format(new Date(endDateStr), 'dd/MM/yyyy')})</p>

          <table>
            <thead>
              <tr>
                <th class="center">Sl</th>
                <th>Customer Name</th>
                <th class="center">Date</th>
                <th class="center">Memo</th>
                <th class="center">Qnty</th>
                <th class="num">Amount (₹)</th>
                <th class="num">CGST 9%</th>
                <th class="num">SGST 9%</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td class="center">${i + 1}</td>
                  <td>${r.customerName}</td>
                  <td class="center">${format(r.date, 'dd/MM/yyyy')}</td>
                  <td class="center">${r.memoNo}</td>
                  <td class="center">${r.quantity} J</td>
                  <td class="num">${r.amount.toFixed(2)}</td>
                  <td class="num">${r.cgstAmount.toFixed(2)}</td>
                  <td class="num">${r.sgstAmount.toFixed(2)}</td>
                  <td>${r.description}</td>
                </tr>
              `).join('')}
              <tr class="totals">
                <td colspan="4" class="center">TOTAL (${totals.days} Days)</td>
                <td class="center">${totals.jars} J</td>
                <td class="num">₹${totals.amount.toFixed(2)}</td>
                <td class="num">₹${totals.cgst.toFixed(2)}</td>
                <td class="num">₹${totals.sgst.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 40px; text-align: right; padding-right: 30px;">
            <p style="margin: 0 0 30px 0; font-size: 20px; font-family: cursive; color: #2563eb;">${seller.signature || 'Sourav'}</p>
            <p style="margin: 0; border-top: 1px solid #000; display: inline-block; padding-top: 4px; font-weight: bold; width: 160px; text-align: center;">Signature</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Upper Control Bar (Sleek, Very Concise & Low Height) */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-900 p-3.5 shadow-sm space-y-3">
        
        {/* Row 1: Inputs, Quick Date Buttons & Tier Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Date Pickers & Quick buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5">
              <Calendar size={14} className="text-blue-500" />
              <span className="font-bold text-slate-500 dark:text-slate-400">Start:</span>
              <input
                type="date"
                value={startDateStr}
                onChange={e => setStartDateStr(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5">
              <Calendar size={14} className="text-blue-500" />
              <span className="font-bold text-slate-500 dark:text-slate-400">End:</span>
              <input
                type="date"
                value={endDateStr}
                onChange={e => setEndDateStr(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleSetThisMonth}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
            >
              This Month
            </button>
            <button
              onClick={handleSetLastMonth}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
            >
              Last Month
            </button>
          </div>

          {/* Sl No Input */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5">
            <Hash size={14} className="text-blue-500" />
            <span className="font-bold text-slate-500 dark:text-slate-400">Memo No:</span>
            <input
              type="number"
              min="1"
              value={startMemoNo}
              onChange={e => setStartMemoNo(parseInt(e.target.value) || 1)}
              className="w-14 bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none text-center"
            />
          </div>

        </div>

        {/* Row 2: Monthly Volume Tiers & Generate Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-neutral-900">
          
          {/* Jar Volume Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] mr-1">
              Monthly Jar Volume:
            </span>
            
            <button
              onClick={() => { setTier('low'); handleGenerate('low'); }}
              className={`px-3 py-1 rounded-full font-bold transition-all border ${
                tier === 'low'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
              }`}
            >
              Low (300–400)
            </button>

            <button
              onClick={() => { setTier('mid'); handleGenerate('mid'); }}
              className={`px-3 py-1 rounded-full font-bold transition-all border ${
                tier === 'mid'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
              }`}
            >
              Mid (400–600)
            </button>

            <button
              onClick={() => { setTier('high'); handleGenerate('high'); }}
              className={`px-3 py-1 rounded-full font-bold transition-all border ${
                tier === 'high'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
              }`}
            >
              High (600–700)
            </button>

            {/* Custom Jar Input Option */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full px-3 py-0.5">
              <span className="font-bold text-slate-500 dark:text-slate-400">Custom:</span>
              <input
                type="number"
                min="10"
                step="10"
                value={customJars}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  setCustomJars(val);
                  setTier('custom');
                }}
                className="w-14 bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none text-center"
              />
              <button
                onClick={() => { setTier('custom'); handleGenerate('custom', customJars); }}
                className="ml-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-[10px]"
              >
                Set
              </button>
            </div>
          </div>

          {/* Generate / Re-roll Button */}
          <button
            onClick={() => handleGenerate(tier, customJars)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw size={13} />
            <span>Re-roll Sales</span>
          </button>
        </div>

      </div>

      {/* KPI Metric Summary Badges (Concise, single line) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="bg-white dark:bg-[#0a0a0a] p-2.5 rounded-xl border border-slate-200 dark:border-neutral-900 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Active Sales</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{totals.days} Days</span>
          </div>
          <Calendar size={18} className="text-blue-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] p-2.5 rounded-xl border border-slate-200 dark:border-neutral-900 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Jars</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{totals.jars} Jars</span>
          </div>
          <Package size={18} className="text-blue-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] p-2.5 rounded-xl border border-slate-200 dark:border-neutral-900 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Base Total (No GST)</span>
            <span className="text-sm font-black text-green-600 dark:text-green-400">₹{totals.amount.toFixed(2)}</span>
          </div>
          <DollarSign size={18} className="text-green-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] p-2.5 rounded-xl border border-slate-200 dark:border-neutral-900 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">CGST (9%)</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₹{totals.cgst.toFixed(2)}</span>
          </div>
          <FileText size={18} className="text-slate-400 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] p-2.5 rounded-xl border border-slate-200 dark:border-neutral-900 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">SGST (9%)</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₹{totals.sgst.toFixed(2)}</span>
          </div>
          <FileText size={18} className="text-slate-400 opacity-80" />
        </div>
      </div>

      {/* Toolbar: Search & Downloads */}
      <div className="bg-white dark:bg-[#0a0a0a] p-3 rounded-xl border border-slate-200 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, memo, date..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Action Exports */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* PDF Dropdown Button */}
          <div className="relative">
            <div className="inline-flex rounded-lg shadow-xs">
              <button
                onClick={() => generatePDF('both')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-l-lg transition-colors"
                title="Download 2-Page PDF (Page 1 Detailed + Page 2 Summary)"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setShowPdfMenu(!showPdfMenu)}
                className="bg-blue-700 hover:bg-blue-800 text-white border-l border-blue-500 px-2 py-1.5 rounded-r-lg transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* PDF Menu */}
            {showPdfMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#121212] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl z-30 py-1 text-xs">
                <button
                  onClick={() => generatePDF('both')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>📄 Combined 2-Page PDF</span>
                  <span className="text-[10px] text-slate-400">All Details</span>
                </button>
                <button
                  onClick={() => generatePDF('page1')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between border-t border-slate-100 dark:border-neutral-900"
                >
                  <span>📋 Page 1 PDF Only</span>
                  <span className="text-[10px] text-slate-400">Name + Address</span>
                </button>
                <button
                  onClick={() => generatePDF('page2')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between border-t border-slate-100 dark:border-neutral-900"
                >
                  <span>📋 Page 2 PDF Only</span>
                  <span className="text-[10px] text-slate-400">Concise Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-neutral-800 transition-colors"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          {/* Copy TSV */}
          <button
            onClick={handleCopyTSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-neutral-800 transition-colors"
          >
            {copiedNotification ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            <span>{copiedNotification ? 'Copied!' : 'Copy Excel'}</span>
          </button>

          {/* Print Worksheet */}
          <button
            onClick={handlePrintWorksheet}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-neutral-800 transition-colors"
          >
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>

        </div>
      </div>

      {/* Main Table Container (Concise, Address Removed for Clean Mobile/Desktop View) */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3 text-center">Date</th>
                <th className="py-2.5 px-3 text-center">Sl No</th>
                <th className="py-2.5 px-3 text-center">Qnty</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 w-14 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isEditing = editingId === row.id;

                  if (isEditing) {
                    return (
                      <tr key={row.id} className="bg-blue-50/50 dark:bg-blue-950/20">
                        <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={editFormData.customerName || ''}
                            onChange={e => setEditFormData({ ...editFormData, customerName: e.target.value })}
                            className="w-full px-2 py-1 bg-white dark:bg-black border border-blue-400 rounded outline-none text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {format(row.date, 'dd/MM/yyyy')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="text"
                            value={editFormData.memoNo || ''}
                            onChange={e => setEditFormData({ ...editFormData, memoNo: e.target.value })}
                            className="w-16 px-1 py-1 bg-white dark:bg-black border border-blue-400 rounded text-center outline-none text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            step="5"
                            value={editFormData.quantity || 10}
                            onChange={e => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 10 })}
                            className="w-14 px-1 py-1 bg-white dark:bg-black border border-blue-400 rounded text-center outline-none text-xs font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          ₹{((editFormData.quantity || 10) * (config.product.rate || 16.95)).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          auto
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          auto
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={editFormData.description || ''}
                            onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full px-2 py-1 bg-white dark:bg-black border border-blue-400 rounded outline-none text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 bg-green-600 hover:bg-green-700 text-white rounded"
                              title="Save"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 bg-slate-400 hover:bg-slate-500 text-white rounded"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {row.customerName}
                      </td>
                      <td className="py-2 px-3 text-center font-medium text-slate-600 dark:text-slate-400">
                        {format(row.date, 'dd/MM/yyyy')}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        #{row.memoNo}
                      </td>
                      <td className="py-2 px-3 text-center font-extrabold text-slate-900 dark:text-slate-100">
                        {row.quantity} J
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{row.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        ₹{row.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        ₹{row.sgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                        {row.description}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(row)}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit Row"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Row"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Summary */}
            <tfoot className="bg-slate-100 dark:bg-neutral-900 border-t-2 border-slate-200 dark:border-neutral-800 font-extrabold text-slate-900 dark:text-slate-100">
              <tr>
                <td colSpan={4} className="py-3 px-3 text-center">
                  TOTAL ({totals.days} Active Sales Days)
                </td>
                <td className="py-3 px-3 text-center text-blue-600 dark:text-blue-400">
                  {totals.jars} Jars
                </td>
                <td className="py-3 px-3 text-right text-green-600 dark:text-green-400">
                  ₹{totals.amount.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right">
                  ₹{totals.cgst.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right">
                  ₹{totals.sgst.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
