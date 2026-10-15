import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Category,
  Brand,
  Vehicle,
  PartItem,
  Warehouse,
  StockMovement,
  Customer,
  Supplier,
  SalesInvoice,
  PurchaseInvoice,
  CashRegister,
  BankAccount,
  Expense,
  BankCheck,
  PricingRule,
  ActivityLog,
  UserAccount,
  AppSettings,
} from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // State
  categories: Category[];
  brands: Brand[];
  vehicles: Vehicle[];
  parts: PartItem[];
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  cashRegisters: CashRegister[];
  bankAccounts: BankAccount[];
  expenses: Expense[];
  checks: BankCheck[];
  pricingRules: PricingRule[];
  activityLogs: ActivityLog[];
  users: UserAccount[];
  settings: AppSettings;
  
  // UI & Auth
  currentUser: UserAccount | null;
  currentView: string;
  setCurrentView: (view: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: (event?: React.MouseEvent) => void;
  isLoading: boolean;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Reload
  refreshData: () => Promise<void>;
  
  // Draft Invoice for transfers
  draftInvoice: any | null;
  setDraftInvoice: (draft: any | null) => void;

  // Operations
  createOrUpdateEntity: (collection: string, data: any) => Promise<boolean>;
  deleteEntity: (collection: string, id: string) => Promise<boolean>;
  createSalesInvoice: (invoiceData: any) => Promise<{ success: boolean; invoice?: SalesInvoice; message?: string }>;
  deleteSalesInvoice: (id: string) => Promise<boolean>;
  createPurchaseInvoice: (purchaseData: any) => Promise<{ success: boolean; purchase?: PurchaseInvoice; message?: string }>;
  adjustStock: (adjustment: { partId: string; warehouseId: string; newQuantity: number; reason: string }) => Promise<boolean>;
  bulkImportParts: (items: any[], stockMode?: 'ADD' | 'SET', warehouseId?: string) => Promise<{ success: boolean; addedCount: number; updatedCount: number; message?: string }>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  login: (username: string, pass: string) => Promise<boolean>;
  setupAdmin: (username: string, pass: string, name: string) => Promise<boolean>;
  logout: () => void;
  restoreBackup: (payload: any) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [checks, setChecks] = useState<BankCheck[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    storeName: 'برنامه حسابداری موهان',
    storeSubtitle: 'سامانه جامع حسابداری، انبارداری و مدیریت قطعات خودرو موهان',
    phone: '۰۲۱-۳۳۹۰۰۰۰۰',
    mobile: '۰۹۱۲۰۰۰۰۰۰۰',
    address: 'تهران، خیابان امیرکبیر، پاساژ کاشانی، طبقه همکف، پلاک ۱۰',
    postalCode: '۱۱۴۵۶۷۸۹۰۱',
    invoiceHeaderNote: 'فاکتور رسمی فروش و ضمانت اصالت لوازم یدکی موهان',
    invoiceFooterNote: 'قطعات برقی و استوک فاقد مهلت تست بوده و تعویض یا مرجوع نمی‌گردند.',
    currency: 'تومان',
    allowNegativeStock: false,
    defaultProfitMargin: 20,
    taxRate: 0,
    lowStockThreshold: 3,
    aiEnabled: true,
    aiModel: 'gemini-3.8-flash',
    aiThinkingLevel: 'HIGH',
    showInvoiceLogo: true,
    showInvoiceSubtitle: true,
    showInvoicePhones: true,
    showInvoiceAddress: true,
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [draftInvoice, setDraftInvoice] = useState<any | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mohan_theme') : null;
    if (saved) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Apply dark mode to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mohan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mohan_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = (event?: React.MouseEvent) => {
    // If browser supports startViewTransition and user hasn't requested reduced motion
    const doc = document as any;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!doc.startViewTransition || prefersReducedMotion || !event) {
      setIsDarkMode((prev) => !prev);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => {
      setIsDarkMode((prev) => !prev);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: isDarkMode ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 400,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: isDarkMode
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        }
      );
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch full state from backend
  const refreshData = async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات سرور');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setCategories(d.categories || []);
        setBrands(d.brands || []);
        setVehicles(d.vehicles || []);
        setParts(d.parts || []);
        setWarehouses(d.warehouses || []);
        setStockMovements(d.stockMovements || []);
        setCustomers(d.customers || []);
        setSuppliers(d.suppliers || []);
        setInvoices(d.invoices || []);
        setPurchaseInvoices(d.purchaseInvoices || []);
        setCashRegisters(d.cashRegisters || []);
        setBankAccounts(d.bankAccounts || []);
        setExpenses(d.expenses || []);
        setChecks(d.checks || []);
        setPricingRules(d.pricingRules || []);
        setActivityLogs(d.activityLogs || []);
        setUsers(d.users || []);
        if (d.settings) setSettings(d.settings);

        // Auto-login session from localStorage if valid
        const savedUser = localStorage.getItem('mohan_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (d.users?.some((u: any) => u.id === parsed.id)) {
              setCurrentUser(parsed);
            }
          } catch {
            localStorage.removeItem('mohan_user');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('خطا در بارگذاری اولیه اطلاعات از سرور', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // CRUD for generic collections
  const createOrUpdateEntity = async (collection: string, data: any): Promise<boolean> => {
    try {
      const isUpdate = !!data.id;
      const url = isUpdate ? `/api/entities/${collection}/${data.id}` : `/api/entities/${collection}`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'خطا در ثبت اطلاعات', 'error');
        return false;
      }

      await refreshData();
      showToast('اطلاعات با موفقیت ذخیره شد.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در ذخیره‌سازی', 'error');
      return false;
    }
  };

  const deleteEntity = async (collection: string, id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/entities/${collection}/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'امکان حذف این مورد وجود ندارد.', 'error');
        return false;
      }
      await refreshData();
      showToast('رکورد با موفقیت حذف شد.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف رکورد', 'error');
      return false;
    }
  };

  // Sales Invoice Creation
  const createSalesInvoice = async (invoiceData: any) => {
    try {
      const res = await fetch('/api/invoices/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'خطا در ثبت فاکتور', 'error');
        return { success: false, message: json.message };
      }
      await refreshData();
      showToast(`فاکتور فروش شماره ${json.invoice.invoiceNumber} با موفقیت ثبت شد.`, 'success');
      return { success: true, invoice: json.invoice };
    } catch (err: any) {
      showToast(err.message || 'خطا در برقراری ارتباط با سرور', 'error');
      return { success: false, message: err.message };
    }
  };

  // Sales Invoice Deletion / Cancellation
  const deleteSalesInvoice = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/invoices/sales/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'خطا در حذف فاکتور', 'error');
        return false;
      }
      await refreshData();
      showToast('فاکتور با موفقیت حذف شد و سوابق مالی و انبار به‌روزرسانی گردید.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در حذف فاکتور', 'error');
      return false;
    }
  };

  // Purchase Invoice Creation
  const createPurchaseInvoice = async (purchaseData: any) => {
    try {
      const res = await fetch('/api/invoices/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'خطا در ثبت فاکتور خرید', 'error');
        return { success: false, message: json.message };
      }
      await refreshData();
      showToast(`فاکتور خرید ${json.purchase.invoiceNumber} ثبت شد و موجودی انبار افزایش یافت.`, 'success');
      return { success: true, purchase: json.purchase };
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در ثبت فاکتور خرید', 'error');
      return { success: false, message: err.message };
    }
  };

  // Stock Adjustment
  const adjustStock = async (adj: { partId: string; warehouseId: string; newQuantity: number; reason: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...adj, userName: currentUser?.fullName || 'انباردار' }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'خطا در تنظیم موجودی', 'error');
        return false;
      }
      await refreshData();
      showToast('موجودی انبار و سابقه انبارگردانی با موفقیت به‌روز شد.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت تغییر موجودی', 'error');
      return false;
    }
  };

  // Bulk Import Parts & Price Updates from File
  const bulkImportParts = async (
    items: any[],
    stockMode: 'ADD' | 'SET' = 'ADD',
    warehouseId: string = 'wh-1'
  ): Promise<{ success: boolean; addedCount: number; updatedCount: number; message?: string }> => {
    try {
      const res = await fetch('/api/parts/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, stockMode, warehouseId }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.message || 'خطا در ورود گروهی فایل', 'error');
        return { success: false, addedCount: 0, updatedCount: 0, message: json.message };
      }
      await refreshData();
      showToast(
        `ورود موفق: ${json.addedCount} قطعه جدید افزوده شد و قیمت ${json.updatedCount} قطعه به‌روزرسانی گردید.`,
        'success'
      );
      return { success: true, addedCount: json.addedCount, updatedCount: json.updatedCount };
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در ورود گروهی فایل', 'error');
      return { success: false, addedCount: 0, updatedCount: 0, message: err.message };
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
        showToast('تنظیمات سامانه ذخیره گردید.', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره تنظیمات', 'error');
      return false;
    }
  };

  // Auth
  const setupAdmin = async (username: string, pass: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass, fullName: name }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.user);
        localStorage.setItem('mohan_user', JSON.stringify(json.user));
        await refreshData();
        showToast(`حساب مدیر اصلی برای ${json.user.fullName} با موفقیت راه‌اندازی شد.`, 'success');
        return true;
      }
      showToast(json.message || 'خطا در ایجاد حساب مدیر', 'error');
      return false;
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه', 'error');
      return false;
    }
  };

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.user);
        localStorage.setItem('mohan_user', JSON.stringify(json.user));
        showToast(`خوش آمدید، ${json.user.fullName}`, 'success');
        return true;
      }
      showToast(json.message || 'نام کاربری یا رمز عبور اشتباه است.', 'error');
      return false;
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در ورود', 'error');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mohan_user');
    showToast('خروج از سامانه انجام شد.', 'info');
  };

  // Restore backup
  const restoreBackup = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await refreshData();
        showToast('پایگاه داده موهان با موفقیت بازیابی شد.', 'success');
        return true;
      }
      showToast(json.message || 'خطا در بازیابی نسخه پشتیبان', 'error');
      return false;
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        categories,
        brands,
        vehicles,
        parts,
        warehouses,
        stockMovements,
        customers,
        suppliers,
        invoices,
        purchaseInvoices,
        cashRegisters,
        bankAccounts,
        expenses,
        checks,
        pricingRules,
        activityLogs,
        users,
        settings,
        currentUser,
        currentView,
        setCurrentView,
        isDarkMode,
        toggleDarkMode,
        isLoading,
        toasts,
        showToast,
        removeToast,
        refreshData,
        createOrUpdateEntity,
        deleteEntity,
        draftInvoice,
        setDraftInvoice,
        deleteSalesInvoice,
        createSalesInvoice,
        createPurchaseInvoice,
        adjustStock,
        bulkImportParts,
        updateSettings,
        login,
        setupAdmin,
        logout,
        restoreBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
