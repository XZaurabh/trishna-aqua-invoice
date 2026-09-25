import { addDays, differenceInDays, format, getDaysInMonth } from 'date-fns';
import { MonthlyRow, MonthlyGenerationParams, GeneratorConfig } from '../types';

const BUSINESS_CUSTOMERS = [
  'Nightingale Medicine',
  "Naru's Restaurant",
  'Munni Restaurant',
  'Mayan Restaurant',
  'Gandhi Mistanna Bhandar',
  'Cake & Buns',
  'Bento Cakery',
  'Shanti Restaurant'
];

const INDIVIDUAL_CUSTOMERS = [
  'Prabash Saha',
  'Manindra Das',
  'Sudham Banik',
  'Dulal Banik',
  'Ujjal Malakar',
  'Siddhartha Chaudhury',
  'Ranjit S.Kar',
  'Chanchal Banik',
  'Binay Dhar',
  'Ranjit Shabdakar'
];

const BUSINESS_QUANTITIES = [30, 40, 50, 60];
const INDIVIDUAL_QUANTITIES = [10, 15, 20, 30];
const ALL_ALLOWED_QUANTITIES = [10, 15, 20, 30, 40, 50, 60];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isBusinessCustomer(name: string): boolean {
  if (BUSINESS_CUSTOMERS.includes(name)) return true;
  const lower = name.toLowerCase();
  return lower.includes('restaurant') || lower.includes('medicine') || lower.includes('bhandar') || lower.includes('cakery') || lower.includes('cake');
}

function generateCustomerAddress(customerName: string, localitiesList: string[]): string {
  const localities = localitiesList.length > 0 ? localitiesList : ['Kumarghat', 'Kailashahar', 'Fatikroy'];
  let locality = getRandomItem(localities);

  if (customerName === 'Manindra Das') {
    locality = 'Asrampalli';
  } else if (customerName === 'Ranjit S.Kar' || customerName === 'Chanchal Banik' || customerName === 'Ranjit Shabdakar') {
    locality = 'Kanchanbari';
  } else if (customerName === 'Binay Dhar') {
    locality = 'Kanchanpur';
  } else {
    if (localities.includes('Kumarghat') && Math.random() < 0.8) {
      locality = 'Kumarghat';
    }
  }

  const prefix = Math.random() > 0.5 ? 'Vill.' : 'Locality';
  const district = locality === 'Kanchanpur' ? 'North Tripura' : 'Unakoti';
  return `${prefix} ${locality}, ${district}, Tripura`;
}

export function generateMonthlySales(params: MonthlyGenerationParams, config: GeneratorConfig): MonthlyRow[] {
  const { startDate, endDate, startMemoNo, tier, customJars } = params;

  // 1. Calculate Target Jars
  let targetJars = 500;
  if (tier === 'low') {
    targetJars = Math.floor(Math.random() * 101) + 300; // 300-400
  } else if (tier === 'mid') {
    targetJars = Math.floor(Math.random() * 201) + 400; // 400-600
  } else if (tier === 'high') {
    targetJars = Math.floor(Math.random() * 101) + 600; // 600-700
  } else if (tier === 'custom' && customJars && customJars > 0) {
    targetJars = customJars;
  }

  // 2. Determine Date Range & Days
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const allDates: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    allDates.push(addDays(startDate, i));
  }

  // 3. Drop 7 to 10 dates realistically per full month (~30 days)
  let dropCount = Math.floor(Math.random() * 4) + 7; // 7, 8, 9, 10
  if (totalDays < 20) {
    dropCount = Math.floor(totalDays * 0.25);
  }
  dropCount = Math.min(dropCount, Math.floor(totalDays / 2));

  // Pick indices to drop without having 3 consecutive drops
  const indicesToDrop = new Set<number>();
  let attempts = 0;
  while (indicesToDrop.size < dropCount && attempts < 500) {
    attempts++;
    const idx = Math.floor(Math.random() * totalDays);
    // Don't drop 3 consecutive days
    if (!indicesToDrop.has(idx)) {
      if (indicesToDrop.has(idx - 1) && indicesToDrop.has(idx - 2)) continue;
      if (indicesToDrop.has(idx + 1) && indicesToDrop.has(idx + 2)) continue;
      if (indicesToDrop.has(idx - 1) && indicesToDrop.has(idx + 1)) continue;
      indicesToDrop.add(idx);
    }
  }

  const activeDates = allDates.filter((_, idx) => !indicesToDrop.has(idx));
  const activeCount = activeDates.length;

  if (activeCount === 0) return [];

  // 4. Customer Pool preparation
  const customersPool = config.customers.length > 0 
    ? [...config.customers, 'Manindra Das'] // double probability for Manindra Das
    : [...BUSINESS_CUSTOMERS, ...INDIVIDUAL_CUSTOMERS, 'Manindra Das'];

  // 5. Assign Customers & Base Quantities (Round Figures)
  const rowData: { date: Date; customer: string; address: string; quantity: number }[] = [];

  for (let i = 0; i < activeCount; i++) {
    const customer = getRandomItem(customersPool);
    const address = generateCustomerAddress(customer, config.localities);
    const isBiz = isBusinessCustomer(customer);
    const baseQty = isBiz ? getRandomItem(BUSINESS_QUANTITIES) : getRandomItem(INDIVIDUAL_QUANTITIES);
    rowData.push({ date: activeDates[i], customer, address, quantity: baseQty });
  }

  // 6. Adjust total quantities to closely match targetJars while keeping round figures (10, 15, 20, 30, 40, 50, 60)
  let currentTotal = rowData.reduce((sum, r) => sum + r.quantity, 0);
  let iterations = 0;

  while (Math.abs(currentTotal - targetJars) > 10 && iterations < 300) {
    iterations++;
    const diff = targetJars - currentTotal;
    const randomIndex = Math.floor(Math.random() * activeCount);
    const row = rowData[randomIndex];
    const isBiz = isBusinessCustomer(row.customer);
    const allowed = isBiz ? BUSINESS_QUANTITIES : INDIVIDUAL_QUANTITIES;

    const currentQtyIndex = allowed.indexOf(row.quantity);
    if (diff > 0) {
      // Need more jars
      if (currentQtyIndex >= 0 && currentQtyIndex < allowed.length - 1) {
        const nextQty = allowed[currentQtyIndex + 1];
        currentTotal += (nextQty - row.quantity);
        row.quantity = nextQty;
      }
    } else {
      // Need fewer jars
      if (currentQtyIndex > 0) {
        const prevQty = allowed[currentQtyIndex - 1];
        currentTotal -= (row.quantity - prevQty);
        row.quantity = prevQty;
      }
    }
  }

  // 7. Map to MonthlyRow format
  const rate = config.product.rate || 16.95;
  const cgstRate = config.tax.cgstRate || 9;
  const sgstRate = config.tax.sgstRate || 9;
  const desc = config.product.description === "20 Litre Packaged Drinking Water Jar" ? "Water 20 ltr" : config.product.description;

  return rowData.map((item, index) => {
    const amount = Number((item.quantity * rate).toFixed(2));
    const cgstAmount = Number((amount * (cgstRate / 100)).toFixed(2));
    const sgstAmount = Number((amount * (sgstRate / 100)).toFixed(2));
    const memoNo = (startMemoNo + index).toString().padStart(3, '0');

    return {
      id: `m-row-${index}-${Date.now()}`,
      date: item.date,
      customerName: item.customer,
      customerAddress: item.address,
      memoNo,
      quantity: item.quantity,
      amount,
      cgstAmount,
      sgstAmount,
      description: desc
    };
  });
}
