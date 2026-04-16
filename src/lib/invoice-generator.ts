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
  'Chanchal Banik'
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
  } else if (customerName === 'Ranjit S.Kar' || customerName === 'Chanchal Banik') {
    locality = 'Kanchanbari';
  } else if (REGULAR_CUSTOMERS.includes(customerName)) {
    // Make sure regular customers are mostly from Kumarghat
    if (Math.random() < 0.8) {
      locality = 'Kumarghat';
    }
  }

  const isVillage = Math.random() > 0.5;
  const prefix = isVillage ? 'Vill.' : 'Locality';
  return `${prefix} ${locality}, Unakoti, Tripura`;
}

export function generateInvoices(params: GenerationParams): Invoice[] {
  const { startDate, endDate, targetJars, startInvoiceNo } = params;

  const daysDiff = differenceInDays(endDate, startDate) + 1;

  // Number of invoices depends on total days. If 9 days, 9 or 8 or 7 invoices.
  const dropCount = Math.floor(Math.random() * 3); // 0, 1, or 2
  let invoiceCount = daysDiff - dropCount;

  // Enforce mathematically required minimum invoices if we cap at 20 max jars per invoice
  const minRequiredInvoices = Math.ceil(targetJars / 20);
  if (invoiceCount < minRequiredInvoices) {
    invoiceCount = minRequiredInvoices;
  }

  if (invoiceCount < 1) invoiceCount = 1;
  if (invoiceCount > targetJars) invoiceCount = Math.max(1, targetJars);

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

  // Phase 1: Guarantee every invoice has at least 1 jar to be valid.
  const quantities = Array(invoiceCount).fill(0);
  let remaining = targetJars;

  for (let i = 0; i < invoiceCount; i++) {
    quantities[i] += 1;
    remaining -= 1;
  }

  // Phase 2: Boost quantities towards multiples of 5 (5, 10, 15, 20).
  while (remaining >= 4) {
    const eligibleIndices = [];
    for (let i = 0; i < invoiceCount; i++) {
      if (quantities[i] === 1 && remaining >= 4) eligibleIndices.push({ idx: i, add: 4 });
      else if (quantities[i] > 1 && quantities[i] <= 15 && quantities[i] % 5 === 0 && remaining >= 5) {
        eligibleIndices.push({ idx: i, add: 5 });
      } else if (quantities[i] > 1 && quantities[i] < 20 && remaining >= (5 - (quantities[i] % 5))) {
        // Just in case it's not a multiple of 5, push it towards one
        const needed = 5 - (quantities[i] % 5);
        if (needed < 5) eligibleIndices.push({ idx: i, add: needed });
      }
    }

    if (eligibleIndices.length === 0) break;

    const choice = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
    quantities[choice.idx] += choice.add;
    remaining -= choice.add;
  }

  // Phase 3: Catch any leftover remainders randomly
  while (remaining > 0) {
    const availableIndices = [];
    for (let i = 0; i < quantities.length; i++) {
      if (quantities[i] < 20) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length === 0) break;

    const idx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    quantities[idx] += 1;
    remaining -= 1;
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
