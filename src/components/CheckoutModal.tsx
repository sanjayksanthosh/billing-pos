import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  Banknote, QrCode, CreditCard, BookOpen,
  X, CheckCircle, Phone, User,
} from 'lucide-react-native';
import { PaymentMethod, SaleInvoice } from '../types';
import { usePosStore } from '../store/posStore';

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onCheckoutSuccess: (invoice: SaleInvoice) => void;
}

const METHODS: { key: PaymentMethod; label: string; sub: string; color: string; bg: string; Icon: any }[] = [
  { key: 'CASH',  label: 'Cash',          sub: 'Count & collect cash',   color: '#16a34a', bg: '#dcfce7', Icon: Banknote    },
  { key: 'UPI',   label: 'UPI / QR',      sub: 'GPay, PhonePe, Paytm',   color: '#7c3aed', bg: '#ede9fe', Icon: QrCode      },
  { key: 'CARD',  label: 'Card / POS',    sub: 'Debit or credit card',    color: '#0ea5e9', bg: '#e0f2fe', Icon: CreditCard  },
  { key: 'KHATA', label: 'Khata / Credit',sub: 'Pay later ledger',        color: '#ea580c', bg: '#fff7ed', Icon: BookOpen    },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ visible, onClose, onCheckoutSuccess }) => {
  const { cart, discountType, discountValue, taxPercent, settings, checkout } = usePosStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sym = settings.currencySymbol || '₹';

  const subtotal = cart.reduce((sum, it) => sum + it.lineTotal, 0);
  let discountAmount = discountType === 'PERCENT'
    ? (subtotal * discountValue) / 100
    : discountValue;
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * taxPercent) / 100;
  const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

  const parsedCash = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedCash - grandTotal);

  const upiPayUri = `upi://pay?pa=${encodeURIComponent(settings.upiVpa || 'vendor@upi')}&pn=${encodeURIComponent(settings.storeName)}&am=${grandTotal.toFixed(2)}&cu=INR`;

  const handleCompleteSale = async () => {
    if (!cart.length) return;
    if (paymentMethod === 'KHATA' && !customerName.trim()) {
      Alert.alert('Customer Required', 'Enter customer name for Khata credit.');
      return;
    }
    try {
      setIsSubmitting(true);
      const invoice = await checkout({
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? (parsedCash || grandTotal) : grandTotal,
        customer: customerName.trim() ? { name: customerName.trim(), phone: customerPhone.trim() } : undefined,
      });
      setCashTendered(''); setCustomerName(''); setCustomerPhone('');
      setPaymentMethod('CASH');
      onClose();
      onCheckoutSuccess(invoice);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMethod = METHODS.find(m => m.key === paymentMethod)!;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Collect Payment</Text>
              <Text style={styles.sheetAmount}>{sym}{grandTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Payment Method Grid */}
            <Text style={styles.sectionTitle}>HOW DO THEY PAY?</Text>
            <View style={styles.methodGrid}>
              {METHODS.map((m) => {
                const active = paymentMethod === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setPaymentMethod(m.key)}
                    style={[styles.methodCard, active && { borderColor: m.color, backgroundColor: m.bg }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.methodIcon, { backgroundColor: active ? m.color : '#f1f5f9' }]}>
                      <m.Icon size={20} color={active ? '#ffffff' : '#64748b'} strokeWidth={2.2} />
                    </View>
                    <Text style={[styles.methodLabel, active && { color: m.color }]}>{m.label}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CASH Section */}
            {paymentMethod === 'CASH' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CASH RECEIVED ({sym})</Text>
                <TextInput
                  style={styles.bigInput}
                  placeholder={grandTotal.toFixed(2)}
                  value={cashTendered}
                  onChangeText={setCashTendered}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                />
                {/* Quick tendered shortcuts */}
                <View style={styles.quickCashRow}>
                  {[grandTotal, 50, 100, 200, 500].map((amt, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setCashTendered(String(amt % 1 === 0 ? Math.ceil(amt) : amt.toFixed(2)))}
                      style={styles.cashPill}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cashPillText}>
                        {i === 0 ? 'Exact' : `${sym}${amt}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {parsedCash > 0 && (
                  <View style={styles.changeBox}>
                    <Text style={styles.changeLabel}>Change to Return</Text>
                    <Text style={styles.changeValue}>{sym}{changeDue.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* UPI QR Section */}
            {paymentMethod === 'UPI' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SHOW QR TO CUSTOMER</Text>
                <View style={styles.qrCard}>
                  <QRCode value={upiPayUri} size={180} color="#0f172a" backgroundColor="#ffffff" />
                  <Text style={styles.qrVpa}>{settings.upiVpa}</Text>
                  <Text style={styles.qrAmount}>{sym}{grandTotal.toFixed(2)}</Text>
                  <Text style={styles.qrApps}>GPay • PhonePe • Paytm • BHIM</Text>
                </View>
              </View>
            )}

            {/* Customer Info for Khata / optional others */}
            {(paymentMethod === 'KHATA' || paymentMethod === 'CARD') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {paymentMethod === 'KHATA' ? 'CUSTOMER INFO (REQUIRED)' : 'CUSTOMER INFO (OPTIONAL)'}
                </Text>
                <View style={styles.inputRow}>
                  <User size={18} color="#94a3b8" />
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Customer name"
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.inputRow, { marginTop: 10 }]}>
                  <Phone size={18} color="#94a3b8" />
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Phone number"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleCompleteSale}
              disabled={isSubmitting}
              style={[styles.confirmBtn, { backgroundColor: selectedMethod.color }]}
              activeOpacity={0.85}
            >
              <CheckCircle size={20} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.confirmBtnText}>
                {isSubmitting ? 'Processing…' : `Confirm & Bill  ${sym}${grandTotal.toFixed(2)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  sheetAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  methodCard: {
    width: '47.5%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 14,
    alignItems: 'flex-start',
    gap: 6,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  methodSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  section: {
    marginTop: 4,
  },
  bigInput: {
    marginHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 18,
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  quickCashRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  cashPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cashPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  changeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16a34a',
    letterSpacing: -0.5,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 20,
    padding: 24,
    gap: 8,
  },
  qrVpa: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  qrAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7c3aed',
    letterSpacing: -0.5,
  },
  qrApps: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 10,
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: 27,
    gap: 10,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
