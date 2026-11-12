import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product, SaleInvoice, StoreSettings, PaymentMethod, CustomerInfo } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialCatalog';
import { playScannerBeep } from '../utils/audio';

const STORAGE_KEY_INVOICES = '@pos_invoices_v1';
const STORAGE_KEY_SETTINGS = '@pos_settings_v1';
const STORAGE_KEY_PRODUCTS = '@pos_products_v1';

export interface ProductMutationResult {
  success: boolean;
  product?: Product;
  error?: string;
}

function persistProducts(products: Product[]) {
  AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products)).catch((err) =>
    console.error('Failed to save product catalog:', err)
  );
}

function generateSku() {
  return `SKU-${Date.now().toString(36).toUpperCase()}`;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'APNA SUPER MART',
  addressLine1: 'Shop #12, Market Square',
  addressLine2: 'MG Road, Bengaluru 560001',
  gstNumber: '29ABCDE1234F1Z5',
  phone: '+91 98765 43210',
  upiVpa: 'vendor@upi',
  currencySymbol: '₹',
  paperWidth: '58mm',
};

interface PosState {
  // Cart
  cart: CartItem[];
  discountType: 'FLAT' | 'PERCENT';
  discountValue: number;
  taxPercent: number;

  // Scanner settings
  isContinuousScan: boolean;
  isFlashOn: boolean;
  lastScannedSku: string | null;

  // Catalog
  products: Product[];

  // Sales records & Settings
  invoices: SaleInvoice[];
  settings: StoreSettings;
  isHydrated: boolean;

  // Actions - Cart
  addItemBySku: (sku: string) => { success: boolean; product?: Product };
  addProductToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  quickAdjustQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setDiscount: (type: 'FLAT' | 'PERCENT', value: number) => void;
  setTaxPercent: (percent: number) => void;

  // Actions - Scanner
  toggleContinuousScan: () => void;
  toggleFlash: () => void;

  // Actions - Catalog
  addNewProduct: (product: Omit<Product, 'id'>) => ProductMutationResult;
  updateProduct: (product: Product) => ProductMutationResult;
  deleteProduct: (productId: string) => void;

  // Actions - Checkout & Invoices
  checkout: (params: {
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    customer?: CustomerInfo;
  }) => Promise<SaleInvoice>;

  // Persistence
  hydrateStore: () => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  clearAllHistory: () => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  discountType: 'PERCENT',
  discountValue: 0,
  taxPercent: 5, // Default 5% GST

  isContinuousScan: true,
  isFlashOn: false,
  lastScannedSku: null,

  products: INITIAL_PRODUCTS,
  invoices: [],
  settings: DEFAULT_SETTINGS,
  isHydrated: false,

  addItemBySku: (sku: string) => {
    const query = sku.trim();
    if (!query) return { success: false };

    const { products, cart } = get();
    const lower = query.toLowerCase();

    // Match exact barcode/SKU first, then exact name, then a unique partial name
    // (the manual input bar accepts either a barcode or an item name).
    let product = products.find((p) => p.sku.toLowerCase() === lower);
    if (!product) {
      product = products.find((p) => p.name.trim().toLowerCase() === lower);
    }
    if (!product) {
      const partialMatches = products.filter((p) =>
        p.name.toLowerCase().includes(lower)
      );
      if (partialMatches.length === 1) product = partialMatches[0];
    }

    if (product) {
      playScannerBeep();
      const existingIndex = cart.findIndex((item) => item.product.id === product.id);

      let updatedCart: CartItem[];
      if (existingIndex > -1) {
        updatedCart = [...cart];
        const current = updatedCart[existingIndex];
        const newQty = current.quantity + 1;
        updatedCart[existingIndex] = {
          ...current,
          quantity: newQty,
          lineTotal: newQty * current.unitPrice,
        };
      } else {
        updatedCart = [
          {
            product,
            quantity: 1,
            unitPrice: product.price,
            lineTotal: product.price,
          },
          ...cart,
        ];
      }

      set({ cart: updatedCart, lastScannedSku: product.sku });
      return { success: true, product };
    }

    return { success: false };
  },

  addProductToCart: (product: Product, quantity = 1) => {
    playScannerBeep();
    const { cart } = get();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = [...cart];
      const current = updatedCart[existingIndex];
      const newQty = current.quantity + quantity;
      updatedCart[existingIndex] = {
        ...current,
        quantity: newQty,
        lineTotal: newQty * current.unitPrice,
      };
    } else {
      updatedCart = [
        {
          product,
          quantity,
          unitPrice: product.price,
          lineTotal: quantity * product.price,
        },
        ...cart,
      ];
    }
    set({ cart: updatedCart, lastScannedSku: product.sku });
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { cart } = get();
    if (quantity <= 0) {
      set({ cart: cart.filter((i) => i.product.id !== productId) });
      return;
    }

    const updated = cart.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity,
          lineTotal: quantity * item.unitPrice,
        };
      }
      return item;
    });
    set({ cart: updated });
  },

  quickAdjustQuantity: (productId: string, delta: number) => {
    const { cart } = get();
    const existing = cart.find((i) => i.product.id === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      set({ cart: cart.filter((i) => i.product.id !== productId) });
    } else {
      const updated = cart.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: newQty,
            lineTotal: newQty * item.unitPrice,
          };
        }
        return item;
      });
      set({ cart: updated });
    }
  },

  removeItem: (productId: string) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart: () => {
    set({
      cart: [],
      discountValue: 0,
      lastScannedSku: null,
    });
  },

  setDiscount: (type, value) => {
    set({ discountType: type, discountValue: Math.max(0, value) });
  },

  setTaxPercent: (percent) => {
    set({ taxPercent: Math.max(0, percent) });
  },

  toggleContinuousScan: () => {
    set((state) => ({ isContinuousScan: !state.isContinuousScan }));
  },

  toggleFlash: () => {
    set((state) => ({ isFlashOn: !state.isFlashOn }));
  },

  addNewProduct: (productData) => {
    const sku = productData.sku.trim() || generateSku();
    const { products } = get();

    if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
      return {
        success: false,
        error: `An item with barcode/SKU "${sku}" already exists.`,
      };
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku,
      name: productData.name.trim(),
      category: productData.category.trim() || 'General',
    };

    set((state) => {
      const updated = [newProduct, ...state.products];
      persistProducts(updated);
      return { products: updated };
    });

    return { success: true, product: newProduct };
  },

  updateProduct: (product) => {
    const sku = product.sku.trim();
    if (!sku) {
      return { success: false, error: 'Barcode/SKU is required.' };
    }

    const { products } = get();
    if (
      products.some(
        (p) => p.id !== product.id && p.sku.toLowerCase() === sku.toLowerCase()
      )
    ) {
      return {
        success: false,
        error: `Another item already uses barcode/SKU "${sku}".`,
      };
    }

    const updatedProduct: Product = {
      ...product,
      sku,
      name: product.name.trim(),
      category: product.category.trim() || 'General',
    };

    set((state) => {
      const updatedProducts = state.products.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      );
      // Keep any in-progress cart lines in sync with the new price/details.
      const updatedCart = state.cart.map((item) =>
        item.product.id === updatedProduct.id
          ? {
              ...item,
              product: updatedProduct,
              unitPrice: updatedProduct.price,
              lineTotal: item.quantity * updatedProduct.price,
            }
          : item
      );
      persistProducts(updatedProducts);
      return { products: updatedProducts, cart: updatedCart };
    });

    return { success: true, product: updatedProduct };
  },

  deleteProduct: (productId) => {
    set((state) => {
      const updatedProducts = state.products.filter((p) => p.id !== productId);
      persistProducts(updatedProducts);
      return { products: updatedProducts };
    });
  },

  checkout: async ({ paymentMethod, amountReceived = 0, customer }) => {
    const { cart, discountType, discountValue, taxPercent, invoices } = get();
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const subtotal = cart.reduce((acc, it) => acc + it.lineTotal, 0);

    let discountAmount = 0;
    if (discountType === 'PERCENT') {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = (discountedSubtotal * taxPercent) / 100;
    const grandTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    const actualAmountReceived =
      paymentMethod === 'CASH'
        ? Math.max(amountReceived, grandTotal)
        : grandTotal;
    const changeDue = Math.max(0, actualAmountReceived - grandTotal);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const newInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      createdAt: Date.now(),
      items: [...cart],
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxPercent,
      taxAmount,
      grandTotal,
      paymentMethod,
      amountReceived: actualAmountReceived,
      changeDue,
      customer,
    };

    const updatedInvoices = [newInvoice, ...invoices];

    // Persist immediately
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_INVOICES,
        JSON.stringify(updatedInvoices)
      );
    } catch (err) {
      console.error('AsyncStorage invoice save error:', err);
    }

    set({
      invoices: updatedInvoices,
      cart: [],
      discountValue: 0,
      lastScannedSku: null,
    });

    return newInvoice;
  },

  hydrateStore: async () => {
    try {
      const [storedInvoices, storedSettings, storedProducts] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_INVOICES),
        AsyncStorage.getItem(STORAGE_KEY_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEY_PRODUCTS),
      ]);

      set({
        invoices: storedInvoices ? JSON.parse(storedInvoices) : [],
        settings: storedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) } : DEFAULT_SETTINGS,
        products: storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS,
        isHydrated: true,
      });
    } catch (err) {
      console.error('Store hydration failed:', err);
      set({ isHydrated: true });
    }
  },

  updateSettings: async (newSettings) => {
    const current = get().settings;
    const merged = { ...current, ...newSettings };
    set({ settings: merged });
    await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
  },

  clearAllHistory: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY_INVOICES);
    set({ invoices: [] });
  },
}));
