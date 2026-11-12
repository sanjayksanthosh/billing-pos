import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { Product } from '../types';
import { usePosStore } from '../store/posStore';

interface ProductFormProps {
  product?: Product | null;
  prefillSku?: string;
  prefillName?: string;
  onClose: () => void;
  onSaved?: (product: Product) => void;
}

const CATEGORY_PRESETS = [
  'Groceries',
  'Staples',
  'Dairy',
  'Snacks',
  'Beverages',
  'Personal Care',
  'Household',
  'General',
];
const TAX_PRESETS = [0, 5, 12, 18];
const UNIT_PRESETS = ['pcs', 'pkt', 'kg', 'ltr', 'box', 'bag'];

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  prefillSku = '',
  prefillName = '',
  onClose,
  onSaved,
}) => {
  const { settings, addNewProduct, updateProduct, deleteProduct } =
    usePosStore();
  const isEdit = !!product;
  const sym = settings.currencySymbol || '₹';

  const [name, setName] = useState(product?.name ?? prefillName);
  const [sku, setSku] = useState(product?.sku ?? prefillSku);
  const [price, setPrice] = useState(product ? product.price.toFixed(2) : '');
  const [category, setCategory] = useState(product?.category ?? 'General');
  const [taxRate, setTaxRate] = useState(product?.taxRate ?? 5);
  const [unit, setUnit] = useState(product?.unit ?? 'pcs');

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name for this item.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price.');
      return;
    }

    const details = {
      name: trimmedName,
      sku: sku.trim(),
      price: priceNum,
      category: category.trim() || 'General',
      taxRate,
      unit,
    };

    const result = isEdit && product
      ? updateProduct({ ...product, ...details })
      : addNewProduct(details);

    if (!result.success || !result.product) {
      Alert.alert('Could Not Save', result.error ?? 'Something went wrong.');
      return;
    }

    onSaved?.(result.product);
    onClose();
  };

  const handleDelete = () => {
    if (!product) return;
    Alert.alert(
      'Delete Item',
      `Remove "${product.name}" from the catalog? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(product.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isEdit
              ? product?.sku
              : 'Fill in the details to add this item to your catalog'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityLabel="Close item form"
          accessibilityRole="button"
        >
          <X size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.fieldLabel}>ITEM NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Fresh Milk, Bread, Sugar..."
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>BARCODE / SKU</Text>
          <TextInput
            style={styles.input}
            placeholder="Scan or type barcode (optional)"
            placeholderTextColor="#94a3b8"
            value={sku}
            onChangeText={setSku}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Leave blank to auto-generate an internal SKU.
          </Text>

          <Text style={styles.fieldLabel}>SELLING PRICE ({sym}) *</Text>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dairy"
            placeholderTextColor="#94a3b8"
            value={category}
            onChangeText={setCategory}
          />
          <View style={styles.chips}>
            {CATEGORY_PRESETS.map((cat) => {
              const active = category.trim() === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>TAX / GST</Text>
          <View style={styles.chips}>
            {TAX_PRESETS.map((rate) => {
              const active = taxRate === rate;
              return (
                <TouchableOpacity
                  key={rate}
                  onPress={() => setTaxRate(rate)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>UNIT</Text>
          <View style={styles.chips}>
            {UNIT_PRESETS.map((u) => {
              const active = unit === u;
              return (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {isEdit ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteBtn}
              activeOpacity={0.8}
              accessibilityLabel="Delete item"
              accessibilityRole="button"
            >
              <Trash2 size={17} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {isEdit ? 'Save Changes' : 'Save Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// Render conditionally (mount only while open) so the form initialises from
// props on every launch — no state-syncing effects required.
export const ProductFormModal: React.FC<ProductFormProps> = (props) => (
  <Modal
    visible
    transparent
    animationType="fade"
    onRequestClose={props.onClose}
  >
    <View style={styles.modalBackdrop}>
      <ProductForm {...props} />
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Form body */
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  priceInput: {
    fontSize: 20,
    fontWeight: '800',
  },
  hint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 5,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#ffffff',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  cancelBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    minHeight: 44,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
