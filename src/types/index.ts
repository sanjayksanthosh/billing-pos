export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'KHATA';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  taxRate?: number; // e.g. 5, 12, 18%
  unit?: string; // pcs, kg, litre, pkt
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  notes?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  createdAt: number; // timestamp ms
  items: CartItem[];
  subtotal: number;
  discountType: 'FLAT' | 'PERCENT';
  discountValue: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeDue: number;
  customer?: CustomerInfo;
}

export interface StoreSettings {
  storeName: string;
  addressLine1: string;
  addressLine2: string;
  gstNumber: string;
  phone: string;
  upiVpa: string;
  currencySymbol: string;
  paperWidth: '58mm' | '80mm';
}
