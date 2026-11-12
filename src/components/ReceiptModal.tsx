import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  Printer,
  Share2,
  Check,
  X,
  Bluetooth,
} from 'lucide-react-native';
import { SaleInvoice } from '../types';
import { usePosStore } from '../store/posStore';
import { generateThermalReceiptHtml } from '../utils/thermalHtml';
import { generateEscPosReceipt } from '../utils/escpos';

interface ReceiptModalProps {
  visible: boolean;
  invoice: SaleInvoice | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  invoice,
  onClose,
}) => {
  const { settings } = usePosStore();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showEscPosCode, setShowEscPosCode] = useState(false);

  if (!invoice) return null;

  const sym = settings.currencySymbol || '₹';
  const htmlContent = generateThermalReceiptHtml(invoice, settings);
  const escposBytes = generateEscPosReceipt(invoice, settings);

  const handlePrintSystem = async () => {
    try {
      setIsPrinting(true);
      await Print.printAsync({
        html: htmlContent,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Print error';
      Alert.alert('Printing Error', msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsPrinting(true);
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Share Invoice ${invoice.invoiceNumber}`,
        });
      } else {
        Alert.alert('PDF Saved', `Saved to ${uri}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Share error';
      Alert.alert('Share Failed', msg);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        <View style={styles.bottomSheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color="#64748b" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Receipt Preview Card */}
            <View style={styles.receiptCard}>
              {/* Store Header */}
              <Text style={styles.storeName}>{settings.storeName}</Text>
              {settings.addressLine1 ? (
                <Text style={styles.storeDetail}>{settings.addressLine1}</Text>
              ) : null}
              {settings.addressLine2 ? (
                <Text style={styles.storeDetail}>{settings.addressLine2}</Text>
              ) : null}
              {settings.phone ? (
                <Text style={styles.storeDetail}>Phone: {settings.phone}</Text>
              ) : null}
              {settings.gstNumber ? (
                <Text style={styles.storeDetail}>GSTIN: {settings.gstNumber}</Text>
              ) : null}

              {/* Invoice Meta */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Invoice No.</Text>
                  <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>Date</Text>
                  <Text style={styles.metaValue}>
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Payment</Text>
                  <Text style={styles.metaValue}>{invoice.paymentMethod}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>Time</Text>
                  <Text style={styles.metaValue}>
                    {new Date(invoice.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {invoice.customer && (
                <View style={styles.customerChip}>
                  <Text style={styles.customerChipText}>
                    👤 {invoice.customer.name}
                    {invoice.customer.phone ? `  ·  ${invoice.customer.phone}` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Items */}
              <View style={styles.itemsHeader}>
                <Text style={[styles.itemsHeaderText, { flex: 1 }]}>Item</Text>
                <Text style={[styles.itemsHeaderText, { width: 90, textAlign: 'right' }]}>Qty × Rate</Text>
                <Text style={[styles.itemsHeaderText, { width: 72, textAlign: 'right' }]}>Total</Text>
              </View>

              {invoice.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{it.product.name}</Text>
                  <Text style={styles.itemQtyRate}>
                    {it.quantity} × {sym}{it.unitPrice.toFixed(2)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    {sym}{it.lineTotal.toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Totals */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{sym}{invoice.subtotal.toFixed(2)}</Text>
              </View>

              {invoice.discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Discount ({invoice.discountType === 'PERCENT' ? `${invoice.discountValue}%` : 'Flat'})
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                    −{sym}{invoice.discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              {invoice.taxAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST ({invoice.taxPercent}%)</Text>
                  <Text style={styles.summaryValue}>+{sym}{invoice.taxAmount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>{sym}{invoice.grandTotal.toFixed(2)}</Text>
              </View>

              {invoice.paymentMethod === 'CASH' && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cash Tendered</Text>
                    <Text style={styles.summaryValue}>{sym}{invoice.amountReceived.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontWeight: '700', color: '#0f172a' }]}>Change Due</Text>
                    <Text style={[styles.summaryValue, { fontWeight: '700', color: '#0f172a' }]}>
                      {sym}{invoice.changeDue.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}

              <Text style={styles.thankYou}>✦ Thank you! Visit again ✦</Text>
              <Text style={styles.paperNote}>Printed for {settings.paperWidth} Roll Width</Text>
            </View>

            {/* ESC/POS Toggle */}
            <TouchableOpacity
              onPress={() => setShowEscPosCode(!showEscPosCode)}
              style={styles.escPosToggle}
              activeOpacity={0.7}
            >
              <Bluetooth size={13} color="#94a3b8" strokeWidth={2} />
              <Text style={styles.escPosToggleText}>
                {showEscPosCode
                  ? 'ESC/POS Data ▲'
                  : `ESC/POS Data ▼`}
              </Text>
              <Text style={styles.escPosByteCount}>
                {escposBytes.length} bytes
              </Text>
            </TouchableOpacity>

            {showEscPosCode && (
              <View style={styles.escPosBox}>
                <Text style={styles.escPosDesc}>
                  Raw ESC/POS byte sequence ready for Bluetooth Thermal Printer
                  (e.g., Star Micronics, Epson, Sunmi, Xprinter):
                </Text>
                <Text style={styles.escPosHex} numberOfLines={5}>
                  {Array.from(escposBytes)
                    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
                    .join(' ')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionFooter}>
            <TouchableOpacity
              onPress={handlePrintSystem}
              disabled={isPrinting}
              style={[styles.actionBtn, styles.printBtn]}
              accessibilityLabel="Print Thermal Receipt"
              accessibilityRole="button"
            >
              <Printer size={18} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.printBtnText}>
                {isPrinting ? 'Printing…' : 'Print'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSharePdf}
              style={[styles.actionBtn, styles.shareBtn]}
              accessibilityLabel="Share PDF Receipt"
              accessibilityRole="button"
            >
              <Share2 size={18} color="#6366f1" strokeWidth={2.2} />
              <Text style={styles.shareBtnText}>Share PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.actionBtn, styles.doneBtn]}
              accessibilityLabel="Done and Start New Sale"
              accessibilityRole="button"
            >
              <Check size={18} color="#64748b" strokeWidth={2.5} />
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 32, android: 20, default: 20 }),
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  /* Receipt Card */
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  storeDetail: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  customerChip: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  customerChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },

  /* Items */
  itemsHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  itemsHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    paddingRight: 8,
  },
  itemQtyRate: {
    width: 90,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  itemTotal: {
    width: 72,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'right',
  },

  /* Totals */
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: -0.5,
  },
  thankYou: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 14,
    letterSpacing: 0.5,
  },
  paperNote: {
    fontSize: 10,
    textAlign: 'center',
    color: '#cbd5e1',
    marginTop: 3,
  },

  /* ESC/POS Toggle */
  escPosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 5,
  },
  escPosToggleText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  escPosByteCount: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '400',
    marginLeft: 2,
  },
  escPosBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  escPosDesc: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 6,
    lineHeight: 14,
  },
  escPosHex: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    color: '#22c55e',
    lineHeight: 14,
  },

  /* Action Footer */
  actionFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    gap: 6,
  },
  printBtn: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  shareBtn: {
    backgroundColor: '#eef2ff',
  },
  shareBtnText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: '#f1f5f9',
  },
  doneBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
