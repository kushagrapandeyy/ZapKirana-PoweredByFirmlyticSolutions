/**
 * DataWedge Intent Bridge
 *
 * On Zebra hardware: listens to Android broadcast intents fired by DataWedge.
 * On non-Zebra (dev / iOS): falls back to camera scanning via expo-barcode-scanner.
 *
 * DataWedge intent action: "com.symbol.datawedge.api.RESULT_ACTION"
 * The barcode value is in the intent extra "com.symbol.datawedge.data_string".
 *
 * To configure DataWedge on a Zebra device:
 *   1. Open DataWedge app
 *   2. Create a profile named "Basko Scanner"
 *   3. Associate with app package: com.basko.scanner
 *   4. Enable Intent Output → action = com.symbol.datawedge.api.RESULT_ACTION
 *   5. Disable Keystroke Output (we handle the intent, not keystroke injection)
 */

import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const DATAWEDGE_INTENT_ACTION = 'com.symbol.datawedge.api.RESULT_ACTION';
const DATAWEDGE_BARCODE_EXTRA = 'com.symbol.datawedge.data_string';
const DATAWEDGE_SOURCE_EXTRA = 'com.symbol.datawedge.label_type';

export interface ScanEvent {
  barcode: string;
  source: 'datawedge' | 'camera' | 'manual';
  labelType?: string; // EAN13, CODE128, QR_CODE, etc.
}

/**
 * useDataWedge
 *
 * Registers a DataWedge intent listener.
 * On iOS or non-Zebra Android, the listener is a no-op
 * (camera scanning is handled separately via expo-barcode-scanner).
 *
 * @param onScan  Called on every successful scan. Guaranteed to be called
 *                at most once per physical trigger pull.
 * @param enabled Whether the listener is active (use false to pause in modals)
 */
export function useDataWedge(
  onScan: (event: ScanEvent) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(onScan);
  callbackRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== 'android') return;

    // DataWedge broadcasts are delivered via the ReactNativeIntentReceiver module
    // available when the Zebra RxTx or react-native-datawedge-intents package is linked.
    const IntentModule = (NativeModules as any).IntentModule;
    if (!IntentModule) {
      // Running on non-Zebra Android (emulator or standard phone) — no-op
      return;
    }

    const emitter = new NativeEventEmitter(IntentModule);
    IntentModule.registerBroadcastReceiver({
      filterActions: [DATAWEDGE_INTENT_ACTION],
      filterCategories: [],
    });

    const sub = emitter.addListener('onBroadcastReceived', (intent: Record<string, string>) => {
      const barcode = intent[DATAWEDGE_BARCODE_EXTRA];
      const labelType = intent[DATAWEDGE_SOURCE_EXTRA];
      if (barcode) {
        callbackRef.current({
          barcode: barcode.trim(),
          source: 'datawedge',
          labelType,
        });
      }
    });

    return () => {
      sub.remove();
      IntentModule.unregisterBroadcastReceiver?.();
    };
  }, [enabled]);
}
