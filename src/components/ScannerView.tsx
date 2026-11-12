import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { CameraView, useCameraPermissions, type FocusMode } from 'expo-camera';
import {
  Zap,
  ZapOff,
  Repeat,
  ScanLine,
  Camera,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react-native';
import { usePosStore } from '../store/posStore';
import { ProductFormModal } from './ProductFormModal';

interface ScannerViewProps {
  onBarcodeFound?: (sku: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onBarcodeFound }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const {
    isContinuousScan,
    toggleContinuousScan,
    isFlashOn,
    toggleFlash,
    addItemBySku,
    addProductToCart,
  } = usePosStore();

  const [lastScanResult, setLastScanResult] = useState<{
    sku: string;
    name?: string;
    time: number;
    found: boolean;
  } | null>(null);

  // Barcode flagged as "not found" which the cashier wants to register.
  const [registerSku, setRegisterSku] = useState<string | null>(null);

  const [isSingleScanPaused, setIsSingleScanPaused] = useState(false);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedSkuRef = useRef<string>('');

  // Hardware focus management. expo-camera has no imperative "focus now" method,
  // but flipping the autofocus prop to "on" makes the native layer run a
  // one-shot focus pass (iOS .autoFocus, Android CameraX startFocusAndMetering).
  // Switching back to "off" restores continuous autofocus on both platforms.
  const [autoFocus, setAutoFocus] = useState<FocusMode>('off');
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Remount key: last-resort recovery when a camera session deadlocks.
  const [cameraKey, setCameraKey] = useState(0);

  const triggerFocus = useCallback(() => {
    setAutoFocus('on');
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => setAutoFocus('off'), 350);
  }, []);

  const restartCamera = useCallback(() => {
    setCameraKey((key) => key + 1);
  }, []);

  // Camera focus often stays locked at the old distance after the app returns
  // from the background; nudge it back whenever we become active again.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') triggerFocus();
    });
    return () => {
      subscription.remove();
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [triggerFocus]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!data) return;
    const now = Date.now();
    if (lastScannedSkuRef.current === data && now - lastScannedTimeRef.current < 1200) return;
    if (now - lastScannedTimeRef.current < 600) return;
    if (!isContinuousScan && isSingleScanPaused) return;
    lastScannedTimeRef.current = now;
    lastScannedSkuRef.current = data;
    const res = addItemBySku(data);
    setLastScanResult({ sku: data, name: res.product?.name, time: now, found: res.success });
    if (onBarcodeFound) onBarcodeFound(data);
    // Only pause single-scan mode when an item was actually added; unknown
    // barcodes keep scanning so the cashier can register them right away.
    if (!isContinuousScan && res.success) setIsSingleScanPaused(true);
  };

  const resumeSingleScan = () => {
    setIsSingleScanPaused(false);
    lastScannedSkuRef.current = '';
  };

  const renderViewportContent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webFallback}>
          <View style={styles.webIconCircle}>
            <Camera size={36} color="#6366f1" />
          </View>
          <Text style={styles.webFallbackTitle}>Camera not available on web</Text>
          <Text style={styles.webFallbackSub}>Use the mobile app to scan barcodes</Text>
          <TouchableOpacity
            style={styles.webSimulateBtn}
            onPress={() => handleBarcodeScanned({ data: 'DEMO-SKU-001' })}
          >
            <Text style={styles.webSimulateBtnText}>Simulate Scan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!permission) {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionCard}>
          <Camera size={32} color="#6366f1" style={{ marginBottom: 10 }} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>Grant camera permission to scan barcodes</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <CameraView
          key={cameraKey}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={isFlashOn}
          autofocus={autoFocus}
          onCameraReady={triggerFocus}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Tap to force a focus pass; long-press restarts a stuck camera session */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={triggerFocus}
          onLongPress={restartCamera}
          delayLongPress={800}
          activeOpacity={1}
          accessibilityLabel="Tap to refocus camera"
          accessibilityHint="Long press restarts the camera if it stays stuck"
          accessibilityRole="button"
        />

        {/* Focus affordance */}
        <View style={styles.focusHint} pointerEvents="none">
          <Text style={styles.focusHintText}>TAP TO FOCUS</Text>
        </View>

        {/* Reticle corners */}
        <View style={styles.reticleWrapper} pointerEvents="none">
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {/* Laser line */}
          <View style={styles.laserLine} />
        </View>

        {/* Single scan paused overlay */}
        {!isContinuousScan && isSingleScanPaused && (
          <View style={styles.pausedOverlay}>
            <CheckCircle2 size={40} color="#fff" style={{ marginBottom: 12 }} />
            <Text style={styles.pausedTitle}>Item Added</Text>
            {lastScanResult?.name && (
              <Text style={styles.pausedSub} numberOfLines={2}>{lastScanResult.name}</Text>
            )}
            <TouchableOpacity style={styles.resumeBtn} onPress={resumeSingleScan}>
              <Text style={styles.resumeBtnText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Control card */}
      <View style={styles.controlCard}>
        <View style={styles.controlRow}>
          {/* Segmented pill toggle */}
          <View style={styles.segmentedPill}>
            <TouchableOpacity
              style={[styles.segPill, isContinuousScan && styles.segPillActive]}
              onPress={() => { if (!isContinuousScan) toggleContinuousScan(); }}
              activeOpacity={0.8}
            >
              <Repeat size={15} color={isContinuousScan ? '#fff' : '#94a3b8'} style={{ marginRight: 5 }} />
              <Text style={[styles.segPillText, isContinuousScan && styles.segPillTextActive]}>
                Continuous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segPill, !isContinuousScan && styles.segPillActive]}
              onPress={() => { if (isContinuousScan) toggleContinuousScan(); }}
              activeOpacity={0.8}
            >
              <ScanLine size={15} color={!isContinuousScan ? '#fff' : '#94a3b8'} style={{ marginRight: 5 }} />
              <Text style={[styles.segPillText, !isContinuousScan && styles.segPillTextActive]}>
                Single
              </Text>
            </TouchableOpacity>
          </View>

          {/* Flash button */}
          <TouchableOpacity
            style={[styles.flashBtn, isFlashOn && styles.flashBtnOn]}
            onPress={toggleFlash}
            activeOpacity={0.8}
          >
            {isFlashOn ? (
              <Zap size={20} color="#d97706" />
            ) : (
              <ZapOff size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Viewport */}
      <View style={styles.viewportWrapper}>
        {renderViewportContent()}

        {/* Feedback banner (shown on native camera and web fallback alike) */}
        {lastScanResult && (
          <View
            style={[
              styles.feedbackBanner,
              { backgroundColor: lastScanResult.found ? 'rgba(16,185,129,0.92)' : 'rgba(245,158,11,0.92)' },
            ]}
          >
            {lastScanResult.found ? (
              <CheckCircle2 size={18} color="#fff" />
            ) : (
              <AlertCircle size={18} color="#fff" />
            )}
            <Text style={styles.feedbackText} numberOfLines={1}>
              {lastScanResult.found
                ? lastScanResult.name ?? lastScanResult.sku
                : `Not found: ${lastScanResult.sku}`}
            </Text>
            {!lastScanResult.found && (
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => setRegisterSku(lastScanResult.sku)}
                accessibilityLabel={`Add item for barcode ${lastScanResult.sku}`}
                accessibilityRole="button"
              >
                <Plus size={14} color="#b45309" strokeWidth={3} />
                <Text style={styles.registerBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Register an unknown barcode, then add it straight to the cart */}
      {registerSku !== null && (
        <ProductFormModal
          prefillSku={registerSku}
          onClose={() => setRegisterSku(null)}
          onSaved={(product) => {
            addProductToCart(product, 1);
            setLastScanResult({
              sku: product.sku,
              name: product.name,
              time: Date.now(),
              found: true,
            });
          }}
        />
      )}
    </View>
  );
};

const INDIGO = '#6366f1';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
  },

  /* Control card */
  controlCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  /* Segmented pill */
  segmentedPill: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    height: 44,
    padding: 3,
  },
  segPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  segPillActive: {
    backgroundColor: INDIGO,
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  segPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  segPillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  /* Flash button */
  flashBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnOn: {
    backgroundColor: '#fef3c7',
  },

  /* Viewport */
  viewportWrapper: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#0f172a',
  },
  focusHint: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  focusHintText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.6,
  },

  /* Reticle */
  reticleWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: INDIGO,
    borderWidth: 3,
  },
  cornerTL: {
    top: '25%',
    left: '20%',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: '25%',
    right: '20%',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: '25%',
    left: '20%',
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: '25%',
    right: '20%',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  laserLine: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: INDIGO,
    opacity: 0.6,
    borderRadius: 1,
  },

  /* Feedback banner */
  feedbackBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    minHeight: 30,
    borderRadius: 15,
  },
  registerBtnText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Single scan paused overlay */
  pausedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pausedTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  pausedSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  resumeBtn: {
    backgroundColor: INDIGO,
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  resumeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Centered loading/permission states */
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },

  /* Permission denied card */
  permissionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: INDIGO,
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Web fallback */
  webFallback: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#c7d2fe',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
  },
  webIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  webFallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  webFallbackSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  webSimulateBtn: {
    backgroundColor: INDIGO,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webSimulateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
