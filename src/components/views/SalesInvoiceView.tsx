import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem, PaymentMethod } from '../../types';
import { MohanLogo } from '../MohanLogo';
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  Users,
  CreditCard,
  Building2,
  DollarSign,
  AlertCircle,
  Percent,
  Sliders,
  Edit3,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Clock,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  getTodayJalali,
  generateInvoiceCode,
} from '../../utils/formatters';

export const SalesInvoiceView: React.FC = () => {
  const {
    parts,
    customers,
    invoices,
    warehouses,
    settings,
    createSalesInvoice,
    updateSettings,
    showToast,
    setCurrentView,
    draftInvoice,
    setDraftInvoice,
  } = useApp();

  const [invoiceType, setInvoiceType] = useState<'SALE' | 'PROFORMA'>('SALE');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('مشتری متفرقه');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastIssuedInvoice, setLastIssuedInvoice] = useState<any | null>(null);

  // Header customizer states
  const [isHeaderCustomizerOpen, setIsHeaderCustomizerOpen] = useState(false);
  const [headerStoreName, setHeaderStoreName] = useState(settings.storeName);
  const [headerStoreSubtitle, setHeaderStoreSubtitle] = useState(settings.storeSubtitle);
  const [headerPhone, setHeaderPhone] = useState(settings.phone);
  const [headerMobile, setHeaderMobile] = useState(settings.mobile);
  const [headerAddress, setHeaderAddress] = useState(settings.address);
  const [headerShowLogo, setHeaderShowLogo] = useState(settings.showInvoiceLogo ?? true);
  const [headerShowSubtitle, setHeaderShowSubtitle] = useState(settings.showInvoiceSubtitle ?? true);
  const [headerShowPhones, setHeaderShowPhones] = useState(settings.showInvoicePhones ?? true);
  const [headerShowAddress, setHeaderShowAddress] = useState(settings.showInvoiceAddress ?? true);

  const openHeaderCustomizer = () => {
    setHeaderStoreName(settings.storeName);
    setHeaderStoreSubtitle(settings.storeSubtitle);
    setHeaderPhone(settings.phone);
    setHeaderMobile(settings.mobile);
    setHeaderAddress(settings.address);
    setHeaderShowLogo(settings.showInvoiceLogo ?? true);
    setHeaderShowSubtitle(settings.showInvoiceSubtitle ?? true);
    setHeaderShowPhones(settings.showInvoicePhones ?? true);
    setHeaderShowAddress(settings.showInvoiceAddress ?? true);
    setIsHeaderCustomizerOpen(true);
  };

  const handleSaveHeaderCustomizer = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings({
      storeName: headerStoreName,
      storeSubtitle: headerStoreSubtitle,
      phone: headerPhone,
      mobile: headerMobile,
      address: headerAddress,
      showInvoiceLogo: headerShowLogo,
      showInvoiceSubtitle: headerShowSubtitle,
      showInvoicePhones: headerShowPhones,
      showInvoiceAddress: headerShowAddress,
    });
    if (ok) {
      setIsHeaderCustomizerOpen(false);
      showToast('تنظیمات سربرگ فاکتور با موفقیت ذخیره شد.', 'success');
    }
  };

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Search input for adding items
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Update customer fields when dropdown changes
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerName('مشتری متفرقه');
      setCustomerPhone('');
      setCustomerAddress('');
      return;
    }
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCustomerName(cust.fullName);
      setCustomerPhone(cust.phone || cust.mobile || '');
      setCustomerAddress(cust.address || '');
    }
  };

  // Search parts
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.technicalCode && p.technicalCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        p.internalCode.toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 8));
  };

  // Add item to invoice
  const addItem = (part: any) => {
    // Check if already in items
    const existingIndex = items.findIndex((i) => i.partId === part.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice =
        updated[existingIndex].quantity * updated[existingIndex].unitPrice - updated[existingIndex].discount;
      setItems(updated);
    } else {
      const newItem: InvoiceItem = {
        partId: part.id,
        partName: part.name,
        technicalCode: part.technicalCode || part.internalCode,
        quantity: 1,
        unitPrice: part.salePrice || 0,
        discount: 0,
        totalPrice: part.salePrice || 0,
      };
      setItems([...items, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Load incoming draft from AI Assistant
  React.useEffect(() => {
    if (draftInvoice) {
      if (draftInvoice.customerName) setCustomerName(draftInvoice.customerName);
      if (draftInvoice.customerPhone) setCustomerPhone(draftInvoice.customerPhone);
      if (draftInvoice.type) setInvoiceType(draftInvoice.type);
      if (draftInvoice.paymentMethod) setPaymentMethod(draftInvoice.paymentMethod);
      if (draftInvoice.warehouseId) setWarehouseId(draftInvoice.warehouseId);
      if (draftInvoice.discount !== undefined) setOverallDiscount(draftInvoice.discount);
      if (draftInvoice.items && Array.isArray(draftInvoice.items)) {
        setItems(draftInvoice.items);
      }
      showToast('اقلام استخراج‌شده در فرم فاکتور بارگذاری شدند. می‌توانید آن‌ها را تغییر داده یا چاپ کنید.', 'success');
      setDraftInvoice(null);
    }
  }, [draftInvoice, setDraftInvoice, showToast]);

  // Update item line
  const updateLineItem = (index: number, field: keyof InvoiceItem, value: number) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };
    row.totalPrice = row.quantity * row.unitPrice - (row.discount || 0);
    updated[index] = row;
    setItems(updated);
  };

  // Update item name
  const updateLineItemName = (index: number, newName: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], partName: newName };
    setItems(updated);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemsDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalDiscount = itemsDiscount + Number(overallDiscount);
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const remainingAmount = Math.max(0, grandTotal - Number(paidAmount));

  // Submit invoice
  const handleSaveInvoice = async () => {
    if (items.length === 0) {
      showToast('لطفاً حداقل یک قلم کالا به فاکتور اضافه کنید.', 'error');
      return;
    }

    setIsSubmitting(true);
    const invoiceNumber = generateInvoiceCode(invoices.length + 101);

    const payload = {
      invoiceNumber,
      type: invoiceType,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim() || 'مشتری متفرقه',
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      warehouseId,
      items,
      subtotal,
      discount: totalDiscount,
      tax: 0,
      grandTotal,
      paidAmount: invoiceType === 'PROFORMA' ? 0 : Number(paidAmount),
      remainingAmount: invoiceType === 'PROFORMA' ? grandTotal : remainingAmount,
      paymentMethod,
      notes: notes.trim() || undefined,
      createdBy: 'مدیر فروش',
    };

    const result = await createSalesInvoice(payload);
    setIsSubmitting(false);

    if (result.success && result.invoice) {
      setLastIssuedInvoice(result.invoice);
      // Reset form
      setItems([]);
      setPaidAmount(0);
      setOverallDiscount(0);
      setNotes('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              صدور فاکتور فروش و پیش‌فاکتور رسمی موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            امکان ثبت فروش نقدی، اعتباری، کارتی، چک و چاپ استاندارد فاکتور
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setInvoiceType('SALE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                invoiceType === 'SALE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              فاکتور فروش نهایی
            </button>
            <button
              onClick={() => setInvoiceType('PROFORMA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                invoiceType === 'PROFORMA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              پیش‌فاکتور (استعلام)
            </button>
          </div>

          <button
            type="button"
            onClick={openHeaderCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-xs"
            title="تغییر متن یا حذف اقلام سربرگ فاکتور (شعار، تلفن، نشانی، لوگو)"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>تنظیم سربرگ فاکتور</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('invoice_history')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition shadow-xs"
            title="مشاهده آرشیو و تاریخچه فاکتورها"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>تاریخچه فاکتورها</span>
          </button>

          {lastIssuedInvoice && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Invoice Builder Card */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                <span>مشخصات خریدار و انبار</span>
              </span>
              <span className="text-[11px] text-slate-400">
                تاریخ صدور: {getTodayJalali()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  انتخاب مشتری از دفتر حساب
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">مشتری متفرقه (نقدی)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  نام خریدار *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="نام خریدار"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  شماره تماس
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="۰۹۱۲..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Item Search and Rapid Adder */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
            <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1">
              افزودن قطعه (جستجو با نام، بارکد یا کد فنی OEM)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="نام قطعه را تایپ کنید یا بارکدخوان را اسکن نمایید..."
                className="w-full pr-9 pl-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Live Search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute right-4 left-4 top-20 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {searchResults.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => addItem(part)}
                    className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {part.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        کد: {part.technicalCode || part.internalCode} | موجودی: {toPersianDigits(part.currentStock || 0)} {part.unit}
                      </span>
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPersianCurrency(part.salePrice, settings.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              اقلام فاکتور ({toPersianDigits(items.length)} ردیف)
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-1">
                <p>هیچ ردیفی به فاکتور اضافه نشده است.</p>
                <p className="text-[11px]">با استفاده از جستجوی بالا، قطعات مورد نظر را اضافه نمایید.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">شرح قطعه</th>
                      <th className="py-2.5 px-3 w-20 text-center">تعداد</th>
                      <th className="py-2.5 px-3 w-32 text-left">قیمت واحد</th>
                      <th className="py-2.5 px-3 w-28 text-left">تخفیف</th>
                      <th className="py-2.5 px-3 w-32 text-left">مجموع سطر</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.partName}
                            onChange={(e) => updateLineItemName(idx, e.target.value)}
                            title="برای تغییر نام قطعه کلیک کنید"
                            placeholder="نام قطعه..."
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:outline-none"
                          />
                          {item.technicalCode && (
                            <span className="text-[10px] text-slate-400 font-mono block px-2 mt-0.5">
                              {item.technicalCode}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(idx, 'quantity', Math.max(1, Number(e.target.value)))
                            }
                            className="w-16 px-1.5 py-1 text-center font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-left">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(idx, 'unitPrice', Number(e.target.value))
                            }
                            className="w-28 px-1.5 py-1 text-left font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-left">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              updateLineItem(idx, 'discount', Number(e.target.value))
                            }
                            className="w-24 px-1.5 py-1 text-left font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-left font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatPersianCurrency(item.totalPrice, settings.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Totals, Payments and Submit */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>تسویه و مبالغ فاکتور</span>
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>جمع اقلام:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatPersianCurrency(subtotal, settings.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>تخفیف کل فاکتور:</span>
                <div className="w-32">
                  <input
                    type="number"
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(Number(e.target.value))}
                    className="w-full px-2 py-1 text-left font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatPersianCurrency(grandTotal, settings.currency)}
                </span>
              </div>

              {invoiceType === 'SALE' && (
                <>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      روش پرداخت
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="CASH">نقدی (صندوق)</option>
                      <option value="CARD">کارتخوان (بانک)</option>
                      <option value="TRANSFER">کارت به کارت / حواله پایا</option>
                      <option value="CHECK">چک صیادی</option>
                      <option value="CREDIT">نسیه / حساب دفتری</option>
                      <option value="MIXED">ترکیبی</option>
                    </select>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        مبلغ دریافتی فعلی:
                      </span>
                      <div className="w-32">
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          placeholder="۰"
                          className="w-full px-2 py-1 text-left font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">مانده بدهی:</span>
                      <span className={`font-mono font-bold ${remainingAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {formatPersianCurrency(remainingAmount, settings.currency)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات فاکتور
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="شرایط ضمانت، نحوه ارسال یا توضیحات مشتری..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                disabled={isSubmitting || items.length === 0}
                onClick={handleSaveInvoice}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'در حال ثبت فاکتور...' : 'ثبت و صدور نهایی فاکتور'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Section (Visible when previewed or printed) */}
      <div className="space-y-3">
        {/* Helper toolbar for screen mode */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
            <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
            <span>تنظیمات سربرگ فاکتور (برای تغییر متن یا حذف هر بخش از دکمه‌های روبرو استفاده کنید):</span>
          </div>
          <button
            type="button"
            onClick={openHeaderCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ویرایش و مدیریت اقلام سربرگ</span>
          </button>
        </div>

        <div className="printable-area p-8 rounded-2xl bg-white text-black border border-slate-200 shadow-sm space-y-6">
          {/* Invoice Header */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-slate-800">
            <div className="flex items-center gap-4">
              {(settings.showInvoiceLogo ?? true) ? (
                <div className="relative group/logo">
                  <MohanLogo size="lg" variant="horizontal" showSubtitle={false} />
                  <button
                    type="button"
                    onClick={() => updateSettings({ showInvoiceLogo: false })}
                    className="no-print opacity-0 group-hover/logo:opacity-100 absolute -top-2 -left-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md text-[10px] transition"
                    title="حذف لوگو از فاکتور"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="no-print p-2 rounded-xl border border-dashed border-slate-300 text-[10px] text-slate-400">
                  لوگو مخفی است
                  <button
                    type="button"
                    onClick={() => updateSettings({ showInvoiceLogo: true })}
                    className="block font-bold text-amber-600 hover:underline mt-0.5"
                  >
                    + نمایش مجدد لوگو
                  </button>
                </div>
              )}

              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{settings.storeName}</h2>
                  <button
                    type="button"
                    onClick={openHeaderCustomizer}
                    className="no-print text-slate-400 hover:text-amber-600 text-[11px] p-0.5 rounded transition"
                    title="تغییر نام فروشگاه"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtitle (CSS Selector 1) */}
                {(settings.showInvoiceSubtitle ?? true) ? (
                  <div className="group/sub flex items-center gap-2">
                    <p className="text-xs text-slate-600">{settings.storeSubtitle}</p>
                    <div className="no-print opacity-0 group-hover/sub:opacity-100 flex items-center gap-1 transition">
                      <button
                        type="button"
                        onClick={() => updateSettings({ showInvoiceSubtitle: false })}
                        className="text-[10px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 transition"
                        title="حذف زیرعنوان از سربرگ فاکتور"
                      >
                        حذف ✕
                      </button>
                      <button
                        type="button"
                        onClick={openHeaderCustomizer}
                        className="text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 transition"
                        title="ویرایش متن زیرعنوان"
                      >
                        تغییر ✎
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-print py-0.5">
                    <button
                      type="button"
                      onClick={() => updateSettings({ showInvoiceSubtitle: true })}
                      className="text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-dashed border-amber-300 transition"
                    >
                      + افزودن مجدد زیرعنوان (شعار) به فاکتور
                    </button>
                  </div>
                )}

                {/* Phones (CSS Selector 2) */}
                {(settings.showInvoicePhones ?? true) ? (
                  <div className="group/phone flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-600">
                      تلفن: {toPersianDigits(settings.phone)} | همراه: {toPersianDigits(settings.mobile)}
                    </p>
                    <div className="no-print opacity-0 group-hover/phone:opacity-100 flex items-center gap-1 transition">
                      <button
                        type="button"
                        onClick={() => updateSettings({ showInvoicePhones: false })}
                        className="text-[10px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 transition"
                        title="حذف شماره تلفن‌ها از سربرگ فاکتور"
                      >
                        حذف ✕
                      </button>
                      <button
                        type="button"
                        onClick={openHeaderCustomizer}
                        className="text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 transition"
                        title="ویرایش شماره‌های تماس"
                      >
                        تغییر ✎
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-print py-0.5">
                    <button
                      type="button"
                      onClick={() => updateSettings({ showInvoicePhones: true })}
                      className="text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-dashed border-amber-300 transition"
                    >
                      + افزودن مجدد شماره‌های تماس به فاکتور
                    </button>
                  </div>
                )}

                {/* Address (CSS Selector 3) */}
                {(settings.showInvoiceAddress ?? true) ? (
                  <div className="group/addr flex items-center gap-2">
                    <p className="text-xs text-slate-600">نشانی: {settings.address}</p>
                    <div className="no-print opacity-0 group-hover/addr:opacity-100 flex items-center gap-1 transition">
                      <button
                        type="button"
                        onClick={() => updateSettings({ showInvoiceAddress: false })}
                        className="text-[10px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 transition"
                        title="حذف نشانی از سربرگ فاکتور"
                      >
                        حذف ✕
                      </button>
                      <button
                        type="button"
                        onClick={openHeaderCustomizer}
                        className="text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 transition"
                        title="ویرایش متن نشانی"
                      >
                        تغییر ✎
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-print py-0.5">
                    <button
                      type="button"
                      onClick={() => updateSettings({ showInvoiceAddress: true })}
                      className="text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-dashed border-amber-300 transition"
                    >
                      + افزودن مجدد نشانی به فاکتور
                    </button>
                  </div>
                )}
              </div>
            </div>

          <div className="text-left space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-48">
            <div className="text-sm font-extrabold text-slate-900">
              {invoiceType === 'SALE' ? 'فاکتور رسمی فروش' : 'پیش‌فاکتور رسمی'}
            </div>
            <div className="text-xs text-slate-700">
              شماره: <span className="font-mono font-bold">{toPersianDigits(lastIssuedInvoice?.invoiceNumber || generateInvoiceCode(invoices.length + 101))}</span>
            </div>
            <div className="text-xs text-slate-700">
              تاریخ: <span>{getTodayJalali()}</span>
            </div>
          </div>
        </div>

        {/* Customer Information Box */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">نام خریدار:</span>
            <span className="font-bold text-slate-900">{customerName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">شماره تماس:</span>
            <span className="font-mono font-bold text-slate-900">{toPersianDigits(customerPhone || '-')}</span>
          </div>
          <div>
            <span className="text-slate-500 block">روش پرداخت:</span>
            <span className="font-bold text-slate-900">
              {paymentMethod === 'CASH' && 'نقدی'}
              {paymentMethod === 'CARD' && 'کارتخوان'}
              {paymentMethod === 'TRANSFER' && 'حواله بانکی'}
              {paymentMethod === 'CHECK' && 'چک صیادی'}
              {paymentMethod === 'CREDIT' && 'نسیه / حساب دفتری'}
              {paymentMethod === 'MIXED' && 'ترکیبی'}
            </span>
          </div>
        </div>

        {/* Table of Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-400 text-slate-700">
                <th className="py-2.5 px-3 text-center w-12 border-l border-slate-300">ردیف</th>
                <th className="py-2.5 px-3 border-l border-slate-300">نام و شرح قطعه</th>
                <th className="py-2.5 px-3 border-l border-slate-300 w-32">کد فنی / OEM</th>
                <th className="py-2.5 px-3 text-center w-20 border-l border-slate-300">تعداد</th>
                <th className="py-2.5 px-3 text-left w-32 border-l border-slate-300">قیمت واحد ({settings.currency})</th>
                <th className="py-2.5 px-3 text-left w-24 border-l border-slate-300">تخفیف</th>
                <th className="py-2.5 px-3 text-left w-36">جمع کل ({settings.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(items.length > 0 ? items : [
                { partName: 'نمونه: لنت ترمز جلو دیسکی موهان', technicalCode: '58101-1RA00', quantity: 1, unitPrice: 850000, discount: 0, totalPrice: 850000 }
              ]).map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center font-mono border-l border-slate-200">{toPersianDigits(idx + 1)}</td>
                  <td className="py-2.5 px-3 font-bold border-l border-slate-200">{it.partName}</td>
                  <td className="py-2.5 px-3 font-mono border-l border-slate-200">{it.technicalCode || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono border-l border-slate-200">{toPersianDigits(it.quantity)}</td>
                  <td className="py-2.5 px-3 text-left font-mono border-l border-slate-200">{formatPersianCurrency(it.unitPrice, '')}</td>
                  <td className="py-2.5 px-3 text-left font-mono border-l border-slate-200">{formatPersianCurrency(it.discount, '')}</td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold">{formatPersianCurrency(it.totalPrice, '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary and Footer */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300">
          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-bold text-slate-800">شرایط و توضیحات:</p>
            <p>{settings.invoiceFooterNote}</p>
            {notes && <p className="text-slate-800 font-semibold">یادداشت: {notes}</p>}
          </div>

          <div className="space-y-1.5 text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-600">جمع کل اقلام:</span>
              <span className="font-mono font-bold">{formatPersianCurrency(subtotal || 850000, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">تخفیف کل:</span>
              <span className="font-mono font-bold">{formatPersianCurrency(totalDiscount, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-300 text-slate-900">
              <span>مبلغ نهایی فاکتور:</span>
              <span>{formatPersianCurrency(grandTotal || 850000, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>مبلغ پرداخت‌شده:</span>
              <span className="font-mono font-bold">{formatPersianCurrency(paidAmount, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>مانده بدهی:</span>
              <span className="font-mono font-bold text-red-600">{formatPersianCurrency(remainingAmount, settings.currency)}</span>
            </div>
          </div>
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
          <div className="border-t border-dashed border-slate-400 pt-2 text-slate-500">
            محل امضاء و مهر فروشگاه موهان
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 text-slate-500">
            محل امضاء و اثرانگشت خریدار
          </div>
        </div>
      </div>
    </div>

      {/* Header Customizer Modal */}
      {isHeaderCustomizerOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-7 space-y-5 text-xs text-right overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تنظیمات و شخصی‌سازی سربرگ فاکتور
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHeaderCustomizerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              می‌توانید متن هر بخش از سربرگ فاکتور رسمی را تغییر دهید، یا نمایش هر کدام از اقلام (زیرعنوان/شعار، شماره تلفن‌ها، نشانی، لوگو) را در فاکتور چاپی غیرفعال یا فعال کنید:
            </p>

            <form onSubmit={handleSaveHeaderCustomizer} className="space-y-4">
              {/* Store Name */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  نام فروشگاه در سربرگ:
                </label>
                <input
                  type="text"
                  required
                  value={headerStoreName}
                  onChange={(e) => setHeaderStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* Subtitle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    زیرعنوان و شعار فروشگاه:
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-600 dark:text-amber-400 font-bold">
                    <input
                      type="checkbox"
                      checked={headerShowSubtitle}
                      onChange={(e) => setHeaderShowSubtitle(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>نمایش در فاکتور</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={headerStoreSubtitle}
                  onChange={(e) => setHeaderStoreSubtitle(e.target.value)}
                  placeholder="مثال: تأمین و توزیع تخصصی قطعات یدکی خودروهای سبک و سنگین"
                  disabled={!headerShowSubtitle}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>

              {/* Phones */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    شماره تلفن‌ها و تماس:
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-600 dark:text-amber-400 font-bold">
                    <input
                      type="checkbox"
                      checked={headerShowPhones}
                      onChange={(e) => setHeaderShowPhones(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>نمایش در فاکتور</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={headerPhone}
                    onChange={(e) => setHeaderPhone(e.target.value)}
                    placeholder="تلفن ثابت: ۰۲۱-۳۳..."
                    disabled={!headerShowPhones}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={headerMobile}
                    onChange={(e) => setHeaderMobile(e.target.value)}
                    placeholder="شماره همراه: ۰۹۱۲..."
                    disabled={!headerShowPhones}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    نشانی و آدرس فروشگاه:
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-600 dark:text-amber-400 font-bold">
                    <input
                      type="checkbox"
                      checked={headerShowAddress}
                      onChange={(e) => setHeaderShowAddress(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>نمایش در فاکتور</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={headerAddress}
                  onChange={(e) => setHeaderAddress(e.target.value)}
                  placeholder="تهران، خیابان امیرکبیر، پاساژ کاشانی..."
                  disabled={!headerShowAddress}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>

              {/* Logo Switch */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  نمایش نشان و لوگوی طلایی موهان
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-600 dark:text-amber-400 font-bold">
                  <input
                    type="checkbox"
                    checked={headerShowLogo}
                    onChange={(e) => setHeaderShowLogo(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>نمایش در فاکتور</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHeaderCustomizerOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition"
                >
                  ذخیره تنظیمات سربرگ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
