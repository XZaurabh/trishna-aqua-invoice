export interface InvoiceItem {
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceTax {
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGstAmount: number;
}

export interface Invoice {
  id: string;
  date: Date;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  baseAmount: number;
  tax: InvoiceTax;
  grandTotal: number;
  amountInWords: string;
}

export interface SellerDetails {
  name: string;
  brand: string;
  address: string;
  gstin: string;
  phone: string;
  signature?: string;
}

export interface GeneratorConfig {
  seller: SellerDetails;
  product: {
    description: string;
    hsn: string;
    rate: number;
  };
  tax: {
    cgstRate: number;
    sgstRate: number;
  };
  customers: string[];
  localities: string[];
}


export interface GenerationParams {
  startDate: Date;
  endDate: Date;
  targetJars: number;
  startInvoiceNo: number;
}

export interface GenerationSummary {
  totalInvoices: number;
  totalJars: number;
  totalRevenue: number;
  totalCgst: number;
  totalSgst: number;
}
