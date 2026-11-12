import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Search, Barcode } from 'lucide-react-native';
import { usePosStore } from '../store/posStore';
import { ProductFormModal } from './ProductFormModal';

interface ManualSkuInputProps {
  onOpenScanner?: () => void;
}

// Barcodes are digit runs (optionally with separators) or digit-bearing codes
// without whitespace; anything else is treated as an item name.
function looksLikeBarcode(value: string) {
  if (/^\d{4,}$/.test(value)) return true;
  return /\d/.test(value) && !/\s/.test(value) && value.length >= 6;
}

export const ManualSkuInput: React.FC<ManualSkuInputProps> = ({ onOpenScanner }) => {
  const [skuText, setSkuText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

  const { addItemBySku, addProductToCart, settings, products } = usePosStore();
  const sym = settings.currencySymbol || '₹';

  const handleLookup = () => {
    const trimmed = skuText.trim();
    if (!trimmed) return;

    const res = addItemBySku(trimmed);
    if (res.success) {
      setSkuText('');
    } else {
      setPendingQuery(trimmed);
      setShowAddModal(true);
    }
  };

  const pendingIsBarcode = looksLikeBarcode(pendingQuery);

  // 4 popular quick items for one-tap addition
  const quickItems = products.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Sleek Search / SKU Bar */}
      <View style={styles.searchBar}>
        <Search size={20} color="#6366f1" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Type item name or barcode..."
          placeholderTextColor="#94a3b8"
          value={skuText}
          onChangeText={setSkuText}
          onSubmitEditing={handleLookup}
          returnKeyType="done"
        />

        {skuText.length > 0 ? (
          <TouchableOpacity
            onPress={handleLookup}
            style={styles.enterBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.enterBtnText}>ADD</Text>
          </TouchableOpacity>
        ) : onOpenScanner ? (
          <TouchableOpacity
            onPress={onOpenScanner}
            style={styles.scannerIconBtn}
            activeOpacity={0.8}
          >
            <Barcode size={22} color="#0f172a" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick Fast-Tap Items (Local Store Top Sellers) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickScroll}
      >
        <Text style={styles.quickHeader}>TOP ITEMS:</Text>
        {quickItems.map((prod) => (
          <TouchableOpacity
            key={prod.id}
            onPress={() => addProductToCart(prod, 1)}
            style={styles.itemPill}
            activeOpacity={0.7}
          >
            <Text style={styles.itemPillName} numberOfLines={1}>
              {prod.name.split(' (')[0]}
            </Text>
            <Text style={styles.itemPillPrice}>
              {sym}{prod.price.toFixed(0)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Register an unrecognised barcode/name, then add it straight to the cart */}
      {showAddModal && (
        <ProductFormModal
          prefillSku={pendingIsBarcode ? pendingQuery : ''}
          prefillName={pendingIsBarcode ? '' : pendingQuery}
          onClose={() => setShowAddModal(false)}
          onSaved={(product) => {
            addProductToCart(product, 1);
            setSkuText('');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 10,
  },
  enterBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  enterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scannerIconBtn: {
    padding: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  quickHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  itemPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemPillPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366f1',
  },
});
