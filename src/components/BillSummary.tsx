import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react-native';
import { usePosStore } from '../store/posStore';

interface BillSummaryProps {
  onPressCheckout: () => void;
}

export const BillSummary: React.FC<BillSummaryProps> = ({ onPressCheckout }) => {
  const {
    cart,
    discountType,
    discountValue,
    taxPercent,
    setDiscount,
    setTaxPercent,
    settings,
  } = usePosStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const sym = settings.currencySymbol || '₹';

  // Instant Computations
  const subtotal = cart.reduce((sum, it) => sum + it.lineTotal, 0);

  let discountAmount = 0;
  if (discountType === 'PERCENT') {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  return (
    <View style={styles.wrapper}>
      {/* Expandable Bill Breakdown Drawer */}
      {isExpanded && (
        <View style={styles.expandedDetails}>
          {/* Quick Discount Presets */}
          <View style={styles.pillRow}>
            <Text style={styles.pillRowLabel}>Discount:</Text>
            {[0, 5, 10].map((rate) => (
              <TouchableOpacity
                key={rate}
                onPress={() => setDiscount('PERCENT', rate)}
                style={[
                  styles.optionPill,
                  discountValue === rate ? styles.optionPillActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    discountValue === rate ? styles.optionPillTextActive : null,
                  ]}
                >
                  {rate}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick GST Presets */}
          <View style={styles.pillRow}>
            <Text style={styles.pillRowLabel}>Tax / GST:</Text>
            {[0, 5, 12, 18].map((rate) => (
              <TouchableOpacity
                key={rate}
                onPress={() => setTaxPercent(rate)}
                style={[
                  styles.optionPill,
                  taxPercent === rate ? styles.optionPillActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    taxPercent === rate ? styles.optionPillTextActive : null,
                  ]}
                >
                  {rate}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Line items */}
          <View style={styles.linesBlock}>
            <View style={styles.detailLine}>
              <Text style={styles.lineLabel}>Subtotal</Text>
              <Text style={styles.lineVal}>{sym}{subtotal.toFixed(2)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.detailLine}>
                <Text style={styles.discountLabel}>Discount ({discountValue}%)</Text>
                <Text style={styles.discountVal}>-{sym}{discountAmount.toFixed(2)}</Text>
              </View>
            )}
            {taxAmount > 0 && (
              <View style={styles.detailLine}>
                <Text style={styles.lineLabel}>GST ({taxPercent}%)</Text>
                <Text style={styles.lineVal}>+{sym}{taxAmount.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Primary Sticky Slice-style Checkout Bar */}
      <View style={styles.mainBar}>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.amountToggle}
          activeOpacity={0.7}
        >
          <View>
            <View style={styles.totalHeaderRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              {isExpanded ? (
                <ChevronDown size={14} color="#64748b" />
              ) : (
                <ChevronUp size={14} color="#64748b" />
              )}
            </View>
            <Text style={styles.bigTotal}>
              {sym}{grandTotal.toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressCheckout}
          disabled={cart.length === 0}
          style={[
            styles.chargeBtn,
            cart.length === 0 ? styles.chargeBtnDisabled : null,
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.chargeBtnText}>
            COLLECT {sym}{grandTotal.toFixed(0)}
          </Text>
          <ArrowRight size={20} color="#ffffff" strokeWidth={2.8} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  expandedDetails: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillRowLabel: {
    width: 70,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  optionPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  optionPillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  optionPillTextActive: {
    color: '#ffffff',
  },
  linesBlock: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 4,
  },
  detailLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  lineVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  discountLabel: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },
  discountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  amountToggle: {
    flex: 1,
  },
  totalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  bigTotal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  chargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    gap: 8,
  },
  chargeBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  chargeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
