import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import {
  X,
  Search,
  Package,
  Check,
  Plus,
  Pencil,
} from 'lucide-react-native';
import { Product } from '../types';
import { usePosStore } from '../store/posStore';
import { ProductForm } from './ProductFormModal';

interface QuickCatalogModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickCatalogModal: React.FC<QuickCatalogModalProps> = ({
  visible,
  onClose,
}) => {
  const { products, addProductToCart, settings } = usePosStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const sym = settings.currencySymbol || '₹';

  const handleCloseCatalog = useCallback(() => {
    setShowForm(false);
    setEditingProduct(null);
    onClose();
  }, [onClose]);

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectProduct = useCallback((p: Product) => {
    addProductToCart(p, 1);
    setRecentlyAdded((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
    }, 1500);
  }, [addProductToCart]);

  const numColumns = Platform.OS === 'web' ? 3 : 2;

  const openNewItemForm = useCallback(() => {
    setEditingProduct(null);
    setSearch('');
    setSelectedCategory('ALL');
    setShowForm(true);
  }, []);

  const openEditItemForm = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  }, []);

  const renderProductCard = useCallback(({ item: p }: { item: Product }) => {
    const added = !!recentlyAdded[p.id];
    return (
      <View style={styles.productCard}>
        {/* Category label + edit */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardCategory} numberOfLines={1}>
            {p.category.toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => openEditItemForm(p)}
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Edit ${p.name}`}
            accessibilityRole="button"
          >
            <Pencil size={13} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Tap name/price to add to cart */}
        <TouchableOpacity
          onPress={() => handleSelectProduct(p)}
          style={styles.cardBody}
          activeOpacity={0.85}
          accessibilityLabel={`Add ${p.name} to cart`}
          accessibilityRole="button"
        >
          <Text style={styles.cardName} numberOfLines={2}>
            {p.name}
          </Text>
          <Text style={styles.cardPrice}>
            {sym}{p.price.toFixed(2)}
          </Text>
        </TouchableOpacity>

        {/* ADD button */}
        <TouchableOpacity
          onPress={() => handleSelectProduct(p)}
          style={[styles.addBtn, added && styles.addBtnAdded]}
          activeOpacity={0.8}
          accessibilityLabel={added ? `${p.name} added` : `Add ${p.name}`}
          accessibilityRole="button"
        >
          {added ? (
            <Check size={16} color="#ffffff" strokeWidth={3} />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [recentlyAdded, handleSelectProduct, openEditItemForm, sym]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Package size={48} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        Try a different search or category
      </Text>
      <TouchableOpacity
        onPress={openNewItemForm}
        style={styles.emptyAddBtn}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Plus size={16} color="#ffffff" strokeWidth={3} />
        <Text style={styles.emptyAddBtnText}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (showForm) {
          setShowForm(false);
          setEditingProduct(null);
        } else {
          handleCloseCatalog();
        }
      }}
    >
      <View style={styles.overlay}>
        {/* Tap-outside dismiss */}
        <TouchableOpacity
          style={styles.backdropTap}
          onPress={handleCloseCatalog}
          activeOpacity={1}
        />

        {/* Bottom sheet */}
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Products</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={openNewItemForm}
                style={styles.newItemBtn}
                accessibilityLabel="Add new item"
                accessibilityRole="button"
              >
                <Plus size={16} color="#ffffff" strokeWidth={3} />
                <Text style={styles.newItemBtnText}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCloseCatalog}
                style={styles.closeBtn}
                accessibilityLabel="Close catalog"
                accessibilityRole="button"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products by name or SKU..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
            style={styles.pillsScroll}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.pill, active && styles.pillActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Product grid */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(p) => p.id}
            numColumns={numColumns}
            key={`grid-${numColumns}`}
            renderItem={renderProductCard}
            contentContainerStyle={[
              styles.gridContent,
              filteredProducts.length === 0 && styles.gridContentEmpty,
            ]}
            columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />

          {/* In-sheet Add/Edit item form (avoids stacked native modals) */}
          {showForm && (
            <View style={styles.formOverlay}>
              <ProductForm
                product={editingProduct}
                onClose={() => setShowForm(false)}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    maxHeight: '92%',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    // Elevation for Android
    elevation: 24,
  },

  // Drag handle
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 5,
  },
  newItemBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    height: 48,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },

  // Category pills
  pillsScroll: {
    flexGrow: 0,
    marginBottom: 4,
  },
  pillsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  pillTextActive: {
    color: '#ffffff',
  },

  // Product grid
  gridContent: {
    padding: 12,
    paddingBottom: 32,
  },
  gridContentEmpty: {
    flexGrow: 1,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },

  // Product card
  productCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    margin: 4,
    minHeight: 148,
    justifyContent: 'space-between',
    // iOS shadow
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Android elevation
    elevation: 3,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  editBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 19,
    flex: 1,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 10,
  },
  addBtn: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnAdded: {
    backgroundColor: '#10b981',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    gap: 6,
    marginTop: 6,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  formOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 10,
    elevation: 10,
  },
});
