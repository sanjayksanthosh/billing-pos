import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  X,
  Building2,
  Printer,
  Trash2,
} from 'lucide-react-native';
import { usePosStore } from '../store/posStore';

interface StoreSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { settings, updateSettings, clearAllHistory } = usePosStore();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [addressLine1, setAddressLine1] = useState(settings.addressLine1);
  const [addressLine2, setAddressLine2] = useState(settings.addressLine2);
  const [phone, setPhone] = useState(settings.phone);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber);
  const [upiVpa, setUpiVpa] = useState(settings.upiVpa);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.paperWidth);

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert('Store Name Required', 'Please enter store name.');
      return;
    }

    await updateSettings({
      storeName: storeName.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      phone: phone.trim(),
      gstNumber: gstNumber.trim(),
      upiVpa: upiVpa.trim(),
      currencySymbol: currencySymbol.trim() || '₹',
      paperWidth,
    });

    onClose();
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All Invoices?',
      'This will permanently delete all local sales invoices. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            Alert.alert('History Cleared', 'All sales records have been wiped.');
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={22} color="#1e293b" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store Settings</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerSaveBtn}>
            <Text style={styles.headerSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Store Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Building2 size={32} color="#6366f1" strokeWidth={1.75} />
            </View>
          </View>

          {/* Section: Store Info */}
          <Text style={styles.sectionHeader}>Store Info</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>Store Name</Text>
              <TextInput
                style={styles.rowInput}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. Apna Super Mart"
                placeholderTextColor="#cbd5e1"
                textAlign="right"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>Address Line 1</Text>
              <TextInput
                style={styles.rowInput}
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="Shop # / Street"
                placeholderTextColor="#cbd5e1"
                textAlign="right"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>Address Line 2</Text>
              <TextInput
                style={styles.rowInput}
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="City, State, Pincode"
                placeholderTextColor="#cbd5e1"
                textAlign="right"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>Phone</Text>
              <TextInput
                style={styles.rowInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>
          </View>

          {/* Section: Tax & Payment */}
          <Text style={styles.sectionHeader}>Tax &amp; Payment</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>GST Number</Text>
              <TextInput
                style={styles.rowInput}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="29ABCDE1234F1Z5"
                placeholderTextColor="#cbd5e1"
                autoCapitalize="characters"
                textAlign="right"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>UPI VPA</Text>
              <TextInput
                style={[styles.rowInput, styles.monoInput]}
                value={upiVpa}
                onChangeText={setUpiVpa}
                placeholder="vendor@upi"
                placeholderTextColor="#cbd5e1"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.rowLabel}>Currency Symbol</Text>
              <TextInput
                style={[styles.rowInput, styles.monoInput]}
                value={currencySymbol}
                onChangeText={setCurrencySymbol}
                placeholder="₹"
                placeholderTextColor="#cbd5e1"
                textAlign="right"
              />
            </View>
          </View>

          {/* Section: Printer */}
          <Text style={styles.sectionHeader}>Printer</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.rowLabelWrap}>
                <Printer size={16} color="#94a3b8" strokeWidth={1.75} style={{ marginRight: 8 }} />
                <Text style={styles.rowLabel}>Paper Width</Text>
              </View>
              <View style={styles.segmentedControl}>
                {(['58mm', '80mm'] as const).map((width, idx) => (
                  <TouchableOpacity
                    key={width}
                    onPress={() => setPaperWidth(width)}
                    style={[
                      styles.segmentBtn,
                      idx === 0 ? styles.segmentBtnLeft : styles.segmentBtnRight,
                      paperWidth === width ? styles.segmentBtnActive : null,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        paperWidth === width ? styles.segmentTextActive : null,
                      ]}
                    >
                      {width}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerLabel}>Danger Zone</Text>
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.clearHistoryBtn}
              activeOpacity={0.75}
            >
              <Trash2 size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.clearHistoryText}>Clear All Sales History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  headerBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    flex: 1,
  },
  headerSaveBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },

  /* ── Scroll ── */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* ── Avatar ── */
  avatarWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Section Header ── */
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 16,
  },
  rowLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  rowInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
    minHeight: 52,
    paddingLeft: 8,
  },
  monoInput: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },

  /* ── Segmented Control ── */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
    marginLeft: 'auto',
  },
  segmentBtn: {
    paddingHorizontal: 14,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  segmentBtnRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  segmentBtnActive: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  segmentTextActive: {
    color: '#ffffff',
  },

  /* ── Danger Zone ── */
  dangerCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    padding: 16,
    shadowColor: '#fca5a5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 1,
  },
  dangerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    height: 48,
    gap: 8,
    width: '100%',
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },

  /* ── Footer ── */
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
