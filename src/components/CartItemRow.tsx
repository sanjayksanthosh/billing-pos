import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem } from '../types';
import { usePosStore } from '../store/posStore';

interface CartItemRowProps {
  item: CartItem;
  index: number;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item, index }) => {
  const { updateQuantity, quickAdjustQuantity, removeItem, settings } = usePosStore();
  const sym = settings.currencySymbol || '₹';

  return (
    <View style={styles.card}>
      {/* Top Details */}
      <View style={styles.topRow}>
        <View style={styles.infoCol}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.product.name}
          </Text>
          <Text style={styles.unitPrice}>
            {sym}{item.unitPrice.toFixed(0)} / {item.product.unit || 'unit'}
          </Text>
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.lineTotal}>
            {sym}{item.lineTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Steppers & Quick Actions */}
      <View style={styles.bottomRow}>
        {/* Modern Circular Stepper */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
            style={styles.circleBtn}
            activeOpacity={0.7}
            accessibilityLabel="Decrease"
          >
            <Minus size={16} color="#0f172a" strokeWidth={3} />
          </TouchableOpacity>

          <View style={styles.qtyBadge}>
            <Text style={styles.qtyNumber}>{item.quantity}</Text>
          </View>

          <TouchableOpacity
            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
            style={[styles.circleBtn, styles.circleBtnActive]}
            activeOpacity={0.7}
            accessibilityLabel="Increase"
          >
            <Plus size={16} color="#ffffff" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Quick Add Shortcuts */}
        <View style={styles.quickAddGroup}>
          <TouchableOpacity
            onPress={() => quickAdjustQuantity(item.product.id, 5)}
            style={styles.quickAddPill}
            activeOpacity={0.7}
          >
            <Text style={styles.quickAddText}>+5</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => quickAdjustQuantity(item.product.id, 10)}
            style={styles.quickAddPill}
            activeOpacity={0.7}
          >
            <Text style={styles.quickAddText}>+10</Text>
          </TouchableOpacity>

          {/* Delete Icon */}
          <TouchableOpacity
            onPress={() => removeItem(item.product.id)}
            style={styles.deleteBtn}
            activeOpacity={0.7}
            accessibilityLabel="Remove"
          >
            <Trash2 size={16} color="#ef4444" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  lineTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  circleBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  qtyBadge: {
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  qtyNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  quickAddGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
