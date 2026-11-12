import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Download,
  Search,
  Printer,
  TrendingUp,
  Receipt,
  User,
} from 'lucide-react-native';
import { SaleInvoice } from '../types';
import { usePosStore } from '../store/posStore';
import { exportInvoicesToCsv } from '../utils/csvExport';

interface SalesHistoryProps {
  onReprintInvoice: (invoice: SaleInvoice) => void;
}

type DateFilter = 'TODAY' | '7DAYS' | 'ALL';

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  onReprintInvoice,
}) => {
  const { invoices, settings } = usePosStore();
  const [filterMode, setFilterMode] = useState<DateFilter>('ALL');
  const [searchText, setSearchText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  // Captured once on mount so renders stay idempotent (no impure read during render)
  const [now] = useState(() => Date.now());

  const sym = settings.currencySymbol || '₹';

  // Filtered invoices
  const oneDayMs = 24 * 60 * 60 * 1000;

  const filteredInvoices = invoices.filter((inv) => {
    if (filterMode === 'TODAY') {
      const invDate = new Date(inv.createdAt).toDateString();
      const todayDate = new Date().toDateString();
      if (invDate !== todayDate) return false;
    } else if (filterMode === '7DAYS') {
      if (now - inv.createdAt > 7 * oneDayMs) return false;
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCust = inv.customer?.name?.toLowerCase().includes(q);
      const matchItems = inv.items.some((it) =>
        it.product.name.toLowerCase().includes(q)
      );
      return matchInv || matchCust || matchItems;
    }
    return true;
  });

  // Stats
  const totalRevenue = filteredInvoices.reduce(
    (acc, inv) => acc + inv.grandTotal,
    0
  );
  const avgBill =
    filteredInvoices.length > 0
      ? totalRevenue / filteredInvoices.length
      : 0;

  const handleExport = async () => {
    if (invoices.length === 0) {
      Alert.alert('No Sales Data', 'No invoices to export.');
      return;
    }
    try {
      setIsExporting(true);
      await exportInvoicesToCsv(invoices);
      Alert.alert('Exported!', 'Sales data saved as CSV and ready to share.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export Error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const getPaymentLabel = (method: SaleInvoice['paymentMethod']) => {
    switch (method) {
      case 'CASH': return 'Cash';
      case 'UPI': return 'UPI';
      case 'CARD': return 'Card';
      case 'KHATA': return 'Khata';
      default: return method;
    }
  };

  const getPaymentColor = (method: SaleInvoice['paymentMethod']) => {
    switch (method) {
      case 'CASH': return '#10b981';
      case 'UPI': return '#6366f1';
      case 'CARD': return '#3b82f6';
      case 'KHATA': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const renderInvoiceItem = ({ item }: { item: SaleInvoice }) => {
    const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = new Date(item.createdAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const pmColor = getPaymentColor(item.paymentMethod);
    const pmLabel = getPaymentLabel(item.paymentMethod);

    return (
      <View style={styles.invoiceCard}>
        {/* Top row */}
        <View style={styles.invoiceTopRow}>
          <Text style={styles.invoiceNumber} numberOfLines={1}>
            #{item.invoiceNumber}
          </Text>
          <View style={[styles.pmBadge, { backgroundColor: pmColor + '20' }]}>
            <Text style={[styles.pmBadgeText, { color: pmColor }]}>
              {pmLabel}
            </Text>
          </View>
        </View>
        {/* Customer / date */}
        <Text style={styles.invoiceDateText}>
          {dateStr} · {timeStr}
          {item.customer?.name ? ` · ${item.customer.name}` : ''}
        </Text>
        {/* Item count */}
        <Text style={styles.invoiceItemCount}>
          {item.items.length} item{item.items.length !== 1 ? 's' : ''}
        </Text>
        {/* Bottom row */}
        <View style={styles.invoiceBottomRow}>
          <Text style={styles.invoiceTotal}>
            {sym}{item.grandTotal.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={() => onReprintInvoice(item)}
            style={styles.reprintBtn}
            accessibilityLabel="Reprint Receipt"
          >
            <Printer size={14} color="#6366f1" strokeWidth={2.5} />
            <Text style={styles.reprintBtnText}>Reprint</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardRevenue]}>
          <TrendingUp size={18} color="#10b981" strokeWidth={2.5} />
          <Text style={styles.statValue}>
            {sym}{totalRevenue.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Receipt size={18} color="#6366f1" strokeWidth={2.5} />
          <Text style={[styles.statValue, { color: '#6366f1' }]}>
            {filteredInvoices.length}
          </Text>
          <Text style={styles.statLabel}>Bills</Text>
        </View>
        <View style={styles.statCard}>
          <User size={18} color="#64748b" strokeWidth={2.5} />
          <Text style={[styles.statValue, { color: '#64748b' }]}>
            {sym}{avgBill.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Avg Bill</Text>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(['TODAY', '7DAYS', 'ALL'] as DateFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilterMode(f)}
            style={[styles.filterPill, filterMode === f && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterMode === f && styles.filterPillTextActive]}>
              {f === '7DAYS' ? '7 Days' : f === 'TODAY' ? 'Today' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color="#94a3b8" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices, customers..."
          placeholderTextColor="#94a3b8"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Receipt size={48} color="#c7d2fe" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No invoices</Text>
            <Text style={styles.emptySubtitle}>
              {filterMode !== 'ALL' ? 'Try a wider date range' : 'Complete a sale to see history'}
            </Text>
          </View>
        }
      />

      {/* Export FAB */}
      <TouchableOpacity
        onPress={handleExport}
        disabled={isExporting}
        style={styles.exportFab}
        accessibilityLabel="Export to CSV"
      >
        <Download size={24} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 4,
  },
  statCardRevenue: {},
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  pmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pmBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceDateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  invoiceItemCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 10,
  },
  invoiceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  invoiceTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  reprintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  reprintBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  exportFab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
