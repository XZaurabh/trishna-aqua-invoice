import { addDays, differenceInDays } from 'date-fns';
import { GenerationParams, Invoice, InvoiceItem, InvoiceTax } from '../types';
import { numberToWordsIndian } from './number-to-words';



const REGULAR_CUSTOMERS = [
  'Prabash Saha',
  'Nightingale Medicine',
  'Manindra Das',
  "Naru's Restaurant",
  'Munni Restaurant',
  'Mayan Restaurant',
  'Gandhi Mistanna Bhandar',
  'Sudharm Banik',
  'Dulal Banik',
  'Ujjal Malakar',
  'Manindra Das',
  'Siddhartha Chaudhury',
  'Cake & Buns',
  'Bento Cakery',
  'Ranjit S.Kar',
  'Chanchal Banik',
  'Binay Dhar',
  'Ranjit Shabdakar'
];

const UNAKOTI_LOCALITIES = [
  'Kailashahar', 'Kumarghat', 'Fatikroy', 'Pecharthal', 'Gournagar',
  'Srirampur', 'Durgapur', 'Bhagabanagar', 'Kanchanpur Road', 'Bhatiabari',
  'Samrupar', 'Dhanbilash', 'Gokulnagar', 'Rajkandi', 'Sonaimuri',
  'Saidabari', 'Asrampalli', 'Nidevi'
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCustomerName(): string {
  return getRandomItem(REGULAR_CUSTOMERS);
}

function generateCustomerAddress(customerName: string): string {
  let locality = getRandomItem(UNAKOTI_LOCALITIES);

  if (customerName === 'Manindra Das') {
    locality = 'Asrampalli';
  } else if (customerName === 'Ranjit S.Kar' || customerName === 'Chanchal Banik' || customerName === 'Ranjit Shabdakar') {
    locality = 'Kanchanbari';
  } else if (customerName === 'Binay Dhar') {
    locality = 'Kanchanpur';
  } else if (REGULAR_CUSTOMERS.includes(customerName)) {
    // Make sure regular customers are mostly from Kumarghat
    if (Math.random() < 0.8) {
      locality = 'Kumarghat';
    }
  }

  const isVillage = Math.random() > 0.5;
  const prefix = isVillage ? 'Vill.' : 'Locality';
  const district = locality === 'Kanchanpur' ? 'North Tripura' : 'Unakoti';
  return `${prefix} ${locality}, ${district}, Tripura`;
}

export function generateInvoices(params: GenerationParams): Invoice[] {
  const { startDate, endDate, targetJars, startInvoiceNo } = params;

  // Round targetJars to nearest multiple of 10, minimum of 10.
  let adjustedTargetJars = Math.round(targetJars / 10) * 10;
  if (adjustedTargetJars < 10) {
    adjustedTargetJars = 10;
  }

  const daysDiff = differenceInDays(endDate, startDate) + 1;

  // Number of invoices depends on total days. If 9 days, 9 or 8 or 7 invoices.
  const dropCount = Math.floor(Math.random() * 3); // 0, 1, or 2
  let invoiceCount = daysDiff - dropCount;

  // Enforce bounds based on jar distribution rules (min 10, max 50 jars per invoice)
  const minRequiredInvoices = Math.ceil(adjustedTargetJars / 50);
  const maxRequiredInvoices = Math.floor(adjustedTargetJars / 10);

  if (invoiceCount < minRequiredInvoices) {
    invoiceCount = minRequiredInvoices;
  }
  if (invoiceCount > maxRequiredInvoices) {
    invoiceCount = maxRequiredInvoices;
  }
  if (invoiceCount < 1) {
    invoiceCount = 1;
  }

  // Generate dates
  const dates = [];
  for (let i = 0; i < invoiceCount; i++) {
    const dayOffset = Math.floor(Math.random() * daysDiff);
    const d = addDays(startDate, dayOffset);
    const randomHours = 9 + Math.random() * 9;
    d.setHours(Math.floor(randomHours), Math.floor(Math.random() * 60), 0, 0);
    dates.push(d);
  }
  dates.sort((a, b) => a.getTime() - b.getTime());

  // Distribute adjustedTargetJars into invoiceCount invoices
  // Start each with 10 jars
  const quantities = Array(invoiceCount).fill(10);
  let remaining = adjustedTargetJars - (invoiceCount * 10);

  // Boost in increments of 10 up to 50 jars per invoice
  while (remaining > 0) {
    const eligibleIndices = [];
    for (let i = 0; i < quantities.length; i++) {
      if (quantities[i] < 50) {
        eligibleIndices.push(i);
      }
    }

    if (eligibleIndices.length === 0) {
      break;
    }

    const idx = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
    quantities[idx] += 10;
    remaining -= 10;
  }

  const invoices: Invoice[] = [];

  for (let i = 0; i < invoiceCount; i++) {
    const qty = quantities[i];
    const rate = 16.95;
    const baseAmount = Number((qty * rate).toFixed(2));

    const cgstAmount = Number((baseAmount * 0.09).toFixed(2));
    const sgstAmount = Number((baseAmount * 0.09).toFixed(2));
    const totalGstAmount = Number((cgstAmount + sgstAmount).toFixed(2));

    const grandTotal = Number((baseAmount + totalGstAmount).toFixed(2));

    const item: InvoiceItem = {
      description: "20 Litre Packaged Drinking Water Jar",
      hsn: "2201",
      quantity: qty,
      rate: rate,
      amount: baseAmount
    };

    const tax: InvoiceTax = {
      cgstRate: 9,
      sgstRate: 9,
      cgstAmount,
      sgstAmount,
      totalGstAmount
    };

    const customerName = generateCustomerName();

    invoices.push({
      id: (startInvoiceNo + i).toString().padStart(3, '0'),
      date: dates[i],
      customerName: customerName,
      customerAddress: generateCustomerAddress(customerName),
      items: [item],
      baseAmount,
      tax,
      grandTotal,
      amountInWords: numberToWordsIndian(grandTotal)
    });
  }

  return invoices;
}
