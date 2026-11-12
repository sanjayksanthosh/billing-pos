import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Settings, LayoutGrid, RotateCcw } from 'lucide-react-native';
import { usePosStore } from '../store/posStore';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenCatalog: () => void;
  isTabletSplit: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenCatalog,
  isTabletSplit,
}) => {
  const { settings, cart, clearCart } = usePosStore();
  const totalItems = cart.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <View style={styles.header}>
      {/* Brand & Store Name */}
      <View style={styles.storeInfo}>
        <View style={styles.storeAvatar}>
          <Text style={styles.storeAvatarText}>
            {settings.storeName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.storeTextCol}>
          <Text style={styles.storeName} numberOfLines={1}>
            {settings.storeName}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>POS ACTIVE • READY</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onOpenCatalog}
          style={styles.catalogPill}
          activeOpacity={0.7}
        >
          <LayoutGrid size={16} color="#6366f1" strokeWidth={2.5} />
          <Text style={styles.catalogPillText}>Items</Text>
        </TouchableOpacity>

        {cart.length > 0 && (
          <TouchableOpacity
            onPress={clearCart}
            style={styles.clearPill}
            activeOpacity={0.7}
          >
            <RotateCcw size={15} color="#ef4444" strokeWidth={2.5} />
            <Text style={styles.clearPillText}>Reset ({totalItems})</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onOpenSettings}
          style={styles.settingsBtn}
          activeOpacity={0.7}
        >
          <Settings size={20} color="#475569" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  storeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  storeAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  storeTextCol: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catalogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 20,
    gap: 6,
  },
  catalogPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366f1',
  },
  clearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    minHeight: 40,
    borderRadius: 20,
    gap: 5,
  },
  clearPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
