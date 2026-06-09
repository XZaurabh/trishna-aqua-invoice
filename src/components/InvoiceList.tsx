import React, { useState, useEffect } from 'react';
import { Invoice, SellerDetails } from '../types';
import { InvoiceCard } from './InvoiceCard';

interface InvoiceListProps {
  invoices: Invoice[];
  seller: SellerDetails;
}

export function InvoiceList({ invoices, seller }: InvoiceListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  // Reset when new invoices are generated
  useEffect(() => {
    setExpandedId(null);
    setDoneIds(new Set());
  }, [invoices]);

  const handleMarkAsDone = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Mark as done
    setDoneIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Move to next
    const currentIndex = invoices.findIndex(inv => inv.id === id);
    if (currentIndex >= 0 && currentIndex < invoices.length - 1) {
      setExpandedId(invoices[currentIndex + 1].id);
    } else {
      setExpandedId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+X
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        if (expandedId) {
          e.preventDefault();
          handleMarkAsDone(expandedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedId, invoices]);


  return (
    <div className="space-y-2">

      
      {invoices.map((invoice) => (
        <InvoiceCard 
          key={invoice.id} 
          invoice={invoice} 
          seller={seller} 
          isExpanded={expandedId === invoice.id}
          onToggle={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
          isDone={doneIds.has(invoice.id)}
          onMarkAsDone={(e) => handleMarkAsDone(invoice.id, e)}
        />
      ))}
    </div>
  );
}
