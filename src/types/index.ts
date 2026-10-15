export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  order: number;
}

export interface Brand {
  id: string;
  name: string;
  country?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  trim?: string;
  engineType?: string;
  yearRange?: string;
  description?: string;
}

export interface PartItem {
  id: string;
  name: string;
  internalCode: string;
  technicalCode?: string;
  barcode?: string;
  brandId?: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  compatibleVehicleIds?: string[];
  unit: string; // عدد، دست، جفت، کارتن، متر، لیتر
  installationPosition?: string; // جلو، عقب، چپ، راست، بالا، پایین
  country?: string;
  description?: string;
  minStockAlert: number;
  currentStock: number;
  lastPurchasePrice: number;
  weightedAvgCost: number;
  salePrice: number;
  colleaguePrice?: number; // قیمت همکار
  wholesalePrice?: number; // قیمت عمده
  consumerPrice?: number; // قیمت مصرف‌کننده
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  partId: string;
  partName: string;
  warehouseId: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unitPrice: number;
  referenceType: 'SALE' | 'PURCHASE' | 'RETURN' | 'STOCKTAKE' | 'MANUAL';
  referenceId?: string;
  description?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  mobile?: string;
  address?: string;
  nationalCode?: string;
  creditLimit?: number;
  balance: number; // مثبت = بستانکار، منفی = بدهکار به فروشگاه
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  mobile?: string;
  address?: string;
  balance: number; // مثبت = طلبکار، منفی = بدهکار
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  partId: string;
  partName: string;
  technicalCode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'CREDIT' | 'MIXED';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  type: 'SALE' | 'PROFORMA';
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  warehouseId: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: 'COMPLETED' | 'CANCELLED' | 'DRAFT';
  createdBy: string;
  createdAt: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  cardNumber?: string;
  iban?: string;
  balance: number;
  ownerName: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentSource: 'CASH' | 'BANK';
  sourceId: string;
  description?: string;
  createdAt: string;
}

export type CheckStatus = 'IN_VAULT' | 'CLEARED' | 'PAID' | 'BOUNCED' | 'ASSIGNED';

export interface BankCheck {
  id: string;
  checkNumber: string;
  bankName: string;
  drawerName: string;
  amount: number;
  dueDate: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  status: CheckStatus;
  notes?: string;
  createdAt: string;
}

export interface PricingRule {
  id: string;
  targetType: 'GLOBAL' | 'CATEGORY' | 'BRAND' | 'PART';
  targetId?: string;
  targetName?: string;
  profitPercentage: number;
  description?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'WAREHOUSEMAN' | 'ACCOUNTANT';
  isActive: boolean;
  createdAt: string;
}

export interface AppSettings {
  storeName: string;
  storeSubtitle: string;
  phone: string;
  mobile: string;
  address: string;
  postalCode?: string;
  invoiceHeaderNote: string;
  invoiceFooterNote: string;
  currency: 'تومان' | 'ریال';
  allowNegativeStock: boolean;
  defaultProfitMargin: number;
  taxRate: number;
  lowStockThreshold: number;
  logoUrl?: string;
  aiEnabled: boolean;
  aiModel: string;
  aiThinkingLevel: 'HIGH' | 'LOW' | 'MINIMAL';
  showInvoiceLogo?: boolean;
  showInvoiceSubtitle?: boolean;
  showInvoicePhones?: boolean;
  showInvoiceAddress?: boolean;
}
