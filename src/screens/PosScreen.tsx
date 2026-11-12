import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  ShoppingCart,
  ScanLine,
  CreditCard,
  History,
} from 'lucide-react-native';
import { usePosStore } from '../store/posStore';
import { SaleInvoice } from '../types';

// Components
import { Header } from '../components/Header';
import { ManualSkuInput } from '../components/ManualSkuInput';
import { ScannerView } from '../components/ScannerView';
import { CartList } from '../components/CartList';
import { BillSummary } from '../components/BillSummary';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { QuickCatalogModal } from '../components/QuickCatalogModal';
import { StoreSettingsModal } from '../components/StoreSettingsModal';
import { SalesHistory } from '../components/SalesHistory';

type PhoneTab = 'CART' | 'SCANNER' | 'CHECKOUT' | 'HISTORY';

const INDIGO = '#6366f1';
const SLATE = '#94a3b8';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const BORDER = '#e2e8f0';
const RED_BADGE = '#ef4444';

export const PosScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isTabletOrLandscape = width >= 768 || (width > height && width >= 640);

  const { cart, hydrateStore } = usePosStore();
  const [activeTab, setActiveTab] = useState<PhoneTab>('CART');

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [activeReceiptInvoice, setActiveReceiptInvoice] =
    useState<SaleInvoice | null>(null);

  // Tablet right pane toggle between Checkout/Summary and History
  const [tabletRightView, setTabletRightView] = useState<'CHECKOUT' | 'HISTORY'>('CHECKOUT');

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  const handleCheckoutSuccess = (invoice: SaleInvoice) => {
    setActiveReceiptInvoice(invoice);
  };

  const handleReprintFromHistory = (invoice: SaleInvoice) => {
    setActiveReceiptInvoice(invoice);
  };

  // ── Tab bar item renderer ──────────────────────────────────────────────────
  const renderPhoneTab = (
    tab: PhoneTab,
    Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>,
    label: string,
    showBadge?: boolean,
  ) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setActiveTab(tab)}
        style={styles.tabBarItem}
        accessibilityLabel={`${label} View`}
        accessibilityRole="tab"
      >
        {/* Active indicator dot */}
        {isActive && <View style={styles.activeIndicator} />}

        {/* Icon wrapper (relative for badge) */}
        <View style={styles.tabIconWrap}>
          <Icon
            size={22}
            color={isActive ? INDIGO : SLATE}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {showBadge && totalCartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText} numberOfLines={1}>
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.tabBarText, isActive && styles.tabBarTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Global POS Header */}
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCatalog={() => setShowCatalogModal(true)}
        isTabletSplit={isTabletOrLandscape}
      />

      {/* Main Responsive Body */}
      {isTabletOrLandscape ? (
        /* ── TABLET / LANDSCAPE: SPLIT SCREEN ── */
        <View style={styles.splitLayout}>
          {/* LEFT PANE: Scanner, Manual Entry & Cart List */}
          <View style={styles.leftPane}>
            <ManualSkuInput />
            <ScannerView />
            <CartList onOpenCatalog={() => setShowCatalogModal(true)} />
          </View>

          {/* RIGHT PANE: Bill Breakdown, Checkout & Quick History Switch */}
          <View style={styles.rightPane}>
            {/* Pill tab switcher */}
            <View style={styles.tabletRightTabs}>
              <TouchableOpacity
                onPress={() => setTabletRightView('CHECKOUT')}
                style={[
                  styles.tabletTabBtn,
                  tabletRightView === 'CHECKOUT' && styles.tabletTabActive,
                ]}
              >
                <CreditCard
                  size={16}
                  color={tabletRightView === 'CHECKOUT' ? WHITE : SLATE}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.tabletTabText,
                    tabletRightView === 'CHECKOUT' && styles.tabletTabTextActive,
                  ]}
                >
                  Billing & Pay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTabletRightView('HISTORY')}
                style={[
                  styles.tabletTabBtn,
                  tabletRightView === 'HISTORY' && styles.tabletTabActive,
                ]}
              >
                <History
                  size={16}
                  color={tabletRightView === 'HISTORY' ? WHITE : SLATE}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.tabletTabText,
                    tabletRightView === 'HISTORY' && styles.tabletTabTextActive,
                  ]}
                >
                  Sales Logs
                </Text>
              </TouchableOpacity>
            </View>

            {tabletRightView === 'CHECKOUT' ? (
              <View style={styles.tabletCheckoutContent}>
                <BillSummary
                  onPressCheckout={() => setShowCheckoutModal(true)}
                />
              </View>
            ) : (
              <View style={styles.tabletHistoryContent}>
                <SalesHistory onReprintInvoice={handleReprintFromHistory} />
              </View>
            )}
          </View>
        </View>
      ) : (
        /* ── PHONE: TABBED VIEW ── */
        <View style={styles.phoneLayout}>
          {/* Content area */}
          <View style={styles.phoneContent}>
            {activeTab === 'CART' && (
              <View style={styles.fullFlex}>
                <ManualSkuInput />
                <CartList onOpenCatalog={() => setShowCatalogModal(true)} />
                <BillSummary onPressCheckout={() => setShowCheckoutModal(true)} />
              </View>
            )}

            {activeTab === 'SCANNER' && (
              <View style={styles.fullFlex}>
                <ScannerView />
                <ManualSkuInput />
                <CartList onOpenCatalog={() => setShowCatalogModal(true)} />
              </View>
            )}

            {activeTab === 'CHECKOUT' && (
              <View style={styles.fullFlex}>
                <BillSummary onPressCheckout={() => setShowCheckoutModal(true)} />
              </View>
            )}

            {activeTab === 'HISTORY' && (
              <View style={styles.fullFlex}>
                <SalesHistory onReprintInvoice={handleReprintFromHistory} />
              </View>
            )}
          </View>

          {/* ── Modern Pill Tab Bar ── */}
          <View style={styles.phoneTabBar}>
            {renderPhoneTab('CART', ShoppingCart, 'Cart', true)}
            {renderPhoneTab('SCANNER', ScanLine, 'Scan')}
            {renderPhoneTab('CHECKOUT', CreditCard, 'Pay')}
            {renderPhoneTab('HISTORY', History, 'History')}
          </View>
        </View>
      )}

      {/* ── Modals ── */}
      <CheckoutModal
        visible={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      <ReceiptModal
        visible={!!activeReceiptInvoice}
        invoice={activeReceiptInvoice}
        onClose={() => setActiveReceiptInvoice(null)}
      />

      <QuickCatalogModal
        visible={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
      />

      <StoreSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  fullFlex: {
    flex: 1,
  },

  // ── Tablet / Split ──────────────────────────────────────────────────────────
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: BG,
  },
  leftPane: {
    flex: 1.3,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    backgroundColor: WHITE,
  },
  rightPane: {
    flex: 1,
    backgroundColor: BG,
    flexDirection: 'column',
  },
  tabletRightTabs: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabletTabBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 24,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabletTabActive: {
    backgroundColor: INDIGO,
    borderColor: INDIGO,
  },
  tabletTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: SLATE,
    letterSpacing: 0.1,
  },
  tabletTabTextActive: {
    color: WHITE,
  },
  tabletCheckoutContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tabletHistoryContent: {
    flex: 1,
  },

  // ── Phone Layout ────────────────────────────────────────────────────────────
  phoneLayout: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: BG,
  },
  phoneContent: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Modern Phone Tab Bar ────────────────────────────────────────────────────
  phoneTabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    height: 68,
    paddingBottom: 8,
    borderTopWidth: 0,
    // Shadow — iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    // Shadow — Android
    elevation: 16,
  },
  tabBarItem: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: INDIGO,
  },
  tabIconWrap: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: RED_BADGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  tabBarText: {
    fontSize: 10,
    fontWeight: '500',
    color: SLATE,
    letterSpacing: 0.1,
  },
  tabBarTextActive: {
    color: INDIGO,
    fontWeight: '700',
  },
});
