import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Save, RefreshCw, Database, Edit3, User, MapPin, DollarSign, Percent, FileText } from 'lucide-react';
import { GeneratorConfig } from '../types';
import { DEFAULT_CONFIG } from '../lib/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GeneratorConfig;
  onSaveConfig: (newConfig: GeneratorConfig) => void;
}

export function SettingsModal({ isOpen, onClose, config: initialConfig, onSaveConfig }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  
  // Local state for editing fields
  const [sellerName, setSellerName] = useState(initialConfig.seller.name);
  const [sellerBrand, setSellerBrand] = useState(initialConfig.seller.brand);
  const [sellerAddress, setSellerAddress] = useState(initialConfig.seller.address);
  const [sellerGstin, setSellerGstin] = useState(initialConfig.seller.gstin);
  const [sellerPhone, setSellerPhone] = useState(initialConfig.seller.phone || '');
  const [sellerSignature, setSellerSignature] = useState(initialConfig.seller.signature || 'Sourav');
  
  const [prodDesc, setProdDesc] = useState(initialConfig.product.description);
  const [prodHsn, setProdHsn] = useState(initialConfig.product.hsn);
  const [prodRate, setProdRate] = useState<number | string>(initialConfig.product.rate);
  
  const [cgstRate, setCgstRate] = useState<number | string>(initialConfig.tax.cgstRate);
  const [sgstRate, setSgstRate] = useState<number | string>(initialConfig.tax.sgstRate);
  
  const [customers, setCustomers] = useState<string[]>(initialConfig.customers);
  const [newCustomer, setNewCustomer] = useState('');
  
  const [localities, setLocalities] = useState<string[]>(initialConfig.localities);
  const [newLocality, setNewLocality] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state if initialConfig updates
  useEffect(() => {
    setSellerName(initialConfig.seller.name);
    setSellerBrand(initialConfig.seller.brand);
    setSellerAddress(initialConfig.seller.address);
    setSellerGstin(initialConfig.seller.gstin);
    setSellerPhone(initialConfig.seller.phone || '');
    setSellerSignature(initialConfig.seller.signature || 'Sourav');
    setProdDesc(initialConfig.product.description);
    setProdHsn(initialConfig.product.hsn);
    setProdRate(initialConfig.product.rate);
    setCgstRate(initialConfig.tax.cgstRate);
    setSgstRate(initialConfig.tax.sgstRate);
    setCustomers(initialConfig.customers);
    setLocalities(initialConfig.localities);
  }, [initialConfig, isOpen]);

  // Flash notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim()) return;
    if (customers.includes(newCustomer.trim())) {
      showNotification('error', 'Customer name already exists.');
      return;
    }
    setCustomers([...customers, newCustomer.trim()]);
    setNewCustomer('');
  };

  const handleRemoveCustomer = (indexToRemove: number) => {
    setCustomers(customers.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddLocality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocality.trim()) return;
    if (localities.includes(newLocality.trim())) {
      showNotification('error', 'Locality already exists.');
      return;
    }
    setLocalities([...localities, newLocality.trim()]);
    setNewLocality('');
  };

  const handleRemoveLocality = (indexToRemove: number) => {
    setLocalities(localities.filter((_, idx) => idx !== indexToRemove));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to restore all settings to default values?")) {
      setSellerName(DEFAULT_CONFIG.seller.name);
      setSellerBrand(DEFAULT_CONFIG.seller.brand);
      setSellerAddress(DEFAULT_CONFIG.seller.address);
      setSellerGstin(DEFAULT_CONFIG.seller.gstin);
      setSellerPhone(DEFAULT_CONFIG.seller.phone || '');
      setSellerSignature(DEFAULT_CONFIG.seller.signature || 'Sourav');
      setProdDesc(DEFAULT_CONFIG.product.description);
      setProdHsn(DEFAULT_CONFIG.product.hsn);
      setProdRate(DEFAULT_CONFIG.product.rate);
      setCgstRate(DEFAULT_CONFIG.tax.cgstRate);
      setSgstRate(DEFAULT_CONFIG.tax.sgstRate);
      setCustomers(DEFAULT_CONFIG.customers);
      setLocalities(DEFAULT_CONFIG.localities);
      showNotification('success', 'Reset to factory defaults successfully!');
    }
  };

  const handleSave = () => {
    // Basic validation
    if (!sellerName.trim() || !sellerBrand.trim() || !sellerAddress.trim() || !sellerGstin.trim()) {
      showNotification('error', 'Please fill in all required seller details.');
      return;
    }
    if (!prodDesc.trim() || !prodHsn.trim()) {
      showNotification('error', 'Product description and HSN are required.');
      return;
    }

    const parsedRate = Number(prodRate);
    const parsedCgst = Number(cgstRate);
    const parsedSgst = Number(sgstRate);

    if (isNaN(parsedRate) || parsedRate <= 0) {
      showNotification('error', 'Rate must be a positive number.');
      return;
    }
    if (isNaN(parsedCgst) || parsedCgst < 0 || parsedCgst > 100 || isNaN(parsedSgst) || parsedSgst < 0 || parsedSgst > 100) {
      showNotification('error', 'GST tax rates must be numbers between 0% and 100%.');
      return;
    }
    if (customers.length === 0) {
      showNotification('error', 'Customers list cannot be empty.');
      return;
    }
    if (localities.length === 0) {
      showNotification('error', 'Places/Localities list cannot be empty.');
      return;
    }

    const updatedConfig: GeneratorConfig = {
      seller: {
        name: sellerName.trim(),
        brand: sellerBrand.trim(),
        address: sellerAddress.trim(),
        gstin: sellerGstin.trim(),
        phone: sellerPhone.trim(),
        signature: sellerSignature.trim()
      },
      product: {
        description: prodDesc.trim(),
        hsn: prodHsn.trim(),
        rate: parsedRate
      },
      tax: {
        cgstRate: parsedCgst,
        sgstRate: parsedSgst
      },
      customers,
      localities
    };

    onSaveConfig(updatedConfig);
    showNotification('success', 'Configurations saved successfully!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-[#0e0e0e] rounded-2xl border border-slate-200 dark:border-neutral-900 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-center justify-between bg-slate-50/50 dark:bg-[#080808]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Control Center</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage seller information, rates, customers, and localities.</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification alert floating */}
            <AnimatePresence>
              {notification && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-16 left-6 right-6 z-10 p-3 rounded-lg border shadow-md text-sm font-medium text-center ${
                    notification.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400'
                      : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400'
                  }`}
                >
                  {notification.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Tabs */}
            <div className="flex px-6 border-b border-slate-100 dark:border-neutral-900 bg-white dark:bg-[#0e0e0e]">
              <button
                onClick={() => setActiveTab('view')}
                className={`py-3.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'view'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Database size={15} />
                <span>Active Database Info</span>
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`py-3.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'edit'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 size={15} />
                <span>Modify & Control</span>
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-[#0a0a0a]/30">
              
              {/* TAB 1: VIEW DETAILS PAGE */}
              {activeTab === 'view' && (
                <div className="space-y-6">
                  {/* Grid for credentials and specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business/Seller Details */}
                    <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-neutral-900 pb-2">
                        <FileText size={14} />
                        <span>Business Profile</span>
                      </h3>
                      
                      <div className="space-y-2.5 text-sm">
                        <div>
                          <span className="block text-xs text-slate-400 dark:text-slate-500">Official Company Name</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{sellerName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-xs text-slate-400 dark:text-slate-500">Brand Name</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{sellerBrand}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 dark:text-slate-500">GSTIN</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sellerGstin}</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-400 dark:text-slate-500">Address</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{sellerAddress}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-50 dark:border-neutral-900/50">
                          <div>
                            <span className="block text-xs text-slate-400 dark:text-slate-500">Phone Number</span>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{sellerPhone || '(not specified)'}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-400 dark:text-slate-500">Signature Title</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-serif italic text-base">{sellerSignature}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing, Tax and Product Settings */}
                    <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-neutral-900 pb-2">
                          <DollarSign size={14} />
                          <span>Product & Pricing Specs</span>
                        </h3>
                        
                        <div className="space-y-2.5 text-sm">
                          <div>
                            <span className="block text-xs text-slate-400 dark:text-slate-500">Item Description</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{prodDesc}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="block text-xs text-slate-400 dark:text-slate-500">HSN Code</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{prodHsn}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-slate-400 dark:text-slate-500">Base Unit Rate</span>
                              <span className="font-extrabold text-green-600 dark:text-green-400">₹ {Number(prodRate).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-neutral-900 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tax Rates (GST)</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 dark:bg-[#161616] p-2.5 rounded-lg text-center border border-slate-100 dark:border-neutral-900/60">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">CGST</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cgstRate}%</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-[#161616] p-2.5 rounded-lg text-center border border-slate-100 dark:border-neutral-900/60">
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">SGST</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{sgstRate}%</span>
                          </div>
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg text-center border border-blue-100/50 dark:border-blue-900/20">
                            <span className="block text-[10px] text-blue-600 dark:text-blue-400">Total GST</span>
                            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{(Number(cgstRate) + Number(sgstRate))}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customers List Database */}
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-900 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <User size={14} />
                        <span>Active Customer Roster ({customers.length})</span>
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                      {customers.map((c, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200/50 dark:border-neutral-800/80 shadow-xs"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Localities List Database */}
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-900 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <MapPin size={14} />
                        <span>Places & Localities Database ({localities.length})</span>
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                      {localities.map((loc, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200/50 dark:border-neutral-800/80 shadow-xs"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT / CONTROL PAGE */}
              {activeTab === 'edit' && (
                <div className="space-y-6">
                  
                  {/* Seller details inputs */}
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-neutral-900 pb-2">
                      <FileText size={16} className="text-blue-500" />
                      <span>Edit Business Profile Details</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Seller Name *</label>
                        <input
                          type="text"
                          required
                          value={sellerName}
                          onChange={e => setSellerName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Brand Name *</label>
                        <input
                          type="text"
                          required
                          value={sellerBrand}
                          onChange={e => setSellerBrand(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Address *</label>
                        <input
                          type="text"
                          required
                          value={sellerAddress}
                          onChange={e => setSellerAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">GSTIN *</label>
                        <input
                          type="text"
                          required
                          value={sellerGstin}
                          onChange={e => setSellerGstin(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Phone Number</label>
                        <input
                          type="text"
                          value={sellerPhone}
                          onChange={e => setSellerPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Signature Author Name *</label>
                        <input
                          type="text"
                          required
                          value={sellerSignature}
                          onChange={e => setSellerSignature(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product & Taxes edit */}
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-neutral-900 pb-2">
                      <DollarSign size={16} className="text-blue-500" />
                      <span>Edit Product & Tax Specifications</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 md:col-span-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Product Particular Description *</label>
                        <input
                          type="text"
                          required
                          value={prodDesc}
                          onChange={e => setProdDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">HSN Code *</label>
                        <input
                          type="text"
                          required
                          value={prodHsn}
                          onChange={e => setProdHsn(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Base Rate per Jar (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={prodRate}
                          onChange={e => setProdRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:col-span-1">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">CGST % *</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            required
                            value={cgstRate}
                            onChange={e => setCgstRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">SGST % *</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            required
                            value={sgstRate}
                            onChange={e => setSgstRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customers roster modifier */}
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-neutral-900 pb-2">
                      <User size={16} className="text-blue-500" />
                      <span>Edit Customer Database ({customers.length})</span>
                    </h3>
                    
                    {/* Add form */}
                    <form onSubmit={handleAddCustomer} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type new customer name..."
                        value={newCustomer}
                        onChange={e => setNewCustomer(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-xs"
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                    </form>

                    {/* Chips list with deletes */}
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar border border-slate-100 dark:border-neutral-900 rounded-lg bg-slate-50/50 dark:bg-black/30">
                      {customers.map((c, i) => (
                        <div 
                          key={i} 
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200/50 dark:border-neutral-800/80 shadow-xs"
                        >
                          <span>{c}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomer(i)}
                            className="p-0.5 rounded-md hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-slate-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Places roster modifier */}
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-slate-200 dark:border-neutral-900 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-neutral-900 pb-2">
                      <MapPin size={16} className="text-blue-500" />
                      <span>Edit Places & Localities Database ({localities.length})</span>
                    </h3>
                    
                    {/* Add form */}
                    <form onSubmit={handleAddLocality} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type new locality name..."
                        value={newLocality}
                        onChange={e => setNewLocality(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-xs"
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                    </form>

                    {/* Chips list with deletes */}
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar border border-slate-100 dark:border-neutral-900 rounded-lg bg-slate-50/50 dark:bg-black/30">
                      {localities.map((loc, i) => (
                        <div 
                          key={i} 
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200/50 dark:border-neutral-800/80 shadow-xs"
                        >
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocality(i)}
                            className="p-0.5 rounded-md hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-slate-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-900 flex items-center justify-between bg-slate-50/50 dark:bg-[#080808]/50">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
                title="Restore settings to their original factory values"
              >
                <RefreshCw size={15} />
                <span>Reset Defaults</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                >
                  <Save size={16} />
                  <span>Save Config</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
