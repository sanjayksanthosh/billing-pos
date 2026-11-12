import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ShoppingBag, ScanBarcode, Plus } from 'lucide-react-native';
import { usePosStore } from '../store/posStore';
import { CartItemRow } from './CartItemRow';

interface CartListProps {
  onOpenCatalog?: () => void;
  onOpenScanner?: () => void;
}

export const CartList: React.FC<CartListProps> = ({ onOpenCatalog, onOpenScanner }) => {
  const { cart } = usePosStore();
  const totalQty = cart.reduce((sum, it) => sum + it.quantity, 0);

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.iconCircle}>
          <ShoppingBag size={36} color="#6366f1" strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>Cart is Empty</Text>
        <Text style={styles.emptySub}>
          Scan item barcodes or tap below to pick from store items.
        </Text>

        <View style={styles.ctaRow}>
          {onOpenScanner && (
            <TouchableOpacity
              onPress={onOpenScanner}
              style={styles.primaryBtn}
              activeOpacity={0.8}
            >
              <ScanBarcode size={18} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.primaryBtnText}>Scan Barcode</Text>
            </TouchableOpacity>
          )}

          {onOpenCatalog && (
            <TouchableOpacity
              onPress={onOpenCatalog}
              style={styles.secondaryBtn}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#6366f1" strokeWidth={2.5} />
              <Text style={styles.secondaryBtnText}>Browse Items</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <View style={styles.metaHeader}>
        <Text style={styles.metaText}>
          {cart.length} {cart.length === 1 ? 'ITEM' : 'ITEMS'} • {totalQty} UNITS
        </Text>
      </View>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item, index }) => (
          <CartItemRow item={item} index={index} />
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  metaHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 19,
  },
  ctaRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 23,
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    gap: 6,
  },
  secondaryBtnText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '800',
  },
});
