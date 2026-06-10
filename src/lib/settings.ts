import { GeneratorConfig } from '../types';

export const DEFAULT_CONFIG: GeneratorConfig = {
  seller: {
    name: "SREE KRISHNA FOOD AND BEVERAGES",
    brand: "TRISHNA AQUA",
    address: "Saidabari, Kumarghat, Unakoti Tripura",
    gstin: "16EFMPS6521H1Z2",
    phone: "",
    signature: "Sourav"
  },
  product: {
    description: "20 Litre Packaged Drinking Water Jar",
    hsn: "2201",
    rate: 16.95
  },
  tax: {
    cgstRate: 9,
    sgstRate: 9
  },
  customers: [
    'Prabash Saha',
    'Nightingale Medicine',
    'Manindra Das',
    "Naru's Restaurant",
    'Munni Restaurant',
    'Mayan Restaurant',
    'Gandhi Mistanna Bhandar',
    'Sudharm Banik',
    'Dulal Sarkar',
    'Ujjal Malakar',
    'Siddhartha Chaudhury',
    'Cake & Buns',
    'Bento Cakery',
    'Ranjit S.Kar',
    'Chanchal Banik',
    'Binay Dhar',
    'Ranjit Shabdakar'
  ],
  localities: [
    'Kailashahar', 'Kumarghat', 'Fatikroy', 'Pecharthal', 'Gournagar',
    'Srirampur', 'Durgapur', 'Bhagabanagar', 'Kanchanpur Road', 'Bhatiabari',
    'Samrupar', 'Dhanbilash', 'Gokulnagar', 'Rajkandi', 'Sonaimuri',
    'Saidabari', 'Asrampalli', 'Nidevi'
  ]
};

export function getStoredConfig(): GeneratorConfig {
  try {
    const data = localStorage.getItem('trishna_invoice_config');
    if (!data) return DEFAULT_CONFIG;
    
    const parsed = JSON.parse(data);
    return {
      seller: {
        name: parsed.seller?.name ?? DEFAULT_CONFIG.seller.name,
        brand: parsed.seller?.brand ?? DEFAULT_CONFIG.seller.brand,
        address: parsed.seller?.address ?? DEFAULT_CONFIG.seller.address,
        gstin: parsed.seller?.gstin ?? DEFAULT_CONFIG.seller.gstin,
        phone: parsed.seller?.phone ?? DEFAULT_CONFIG.seller.phone,
        signature: parsed.seller?.signature ?? DEFAULT_CONFIG.seller.signature
      },
      product: {
        description: parsed.product?.description ?? DEFAULT_CONFIG.product.description,
        hsn: parsed.product?.hsn ?? DEFAULT_CONFIG.product.hsn,
        rate: typeof parsed.product?.rate === 'number' ? parsed.product.rate : DEFAULT_CONFIG.product.rate
      },
      tax: {
        cgstRate: typeof parsed.tax?.cgstRate === 'number' ? parsed.tax.cgstRate : DEFAULT_CONFIG.tax.cgstRate,
        sgstRate: typeof parsed.tax?.sgstRate === 'number' ? parsed.tax.sgstRate : DEFAULT_CONFIG.tax.sgstRate
      },
      customers: Array.isArray(parsed.customers) ? parsed.customers : DEFAULT_CONFIG.customers,
      localities: Array.isArray(parsed.localities) ? parsed.localities : DEFAULT_CONFIG.localities
    };
  } catch (e) {
    console.error('Error reading config from localStorage', e);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: GeneratorConfig): void {
  try {
    localStorage.setItem('trishna_invoice_config', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving config to localStorage', e);
  }
}
