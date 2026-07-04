import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import Constants from 'expo-constants';
import axios from 'axios';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

import { API_BASE_URL } from '../../constants/api';
const API_URL = `${API_BASE_URL}/api/v1`;

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [laserPos, setLaserPos] = useState(0);
  const [scanned, setScanned] = useState(false);

  // Laser Animation
  const laserTranslateY = useSharedValue(0);
  useEffect(() => {
    laserTranslateY.value = withRepeat(
      withSequence(
        withTiming(146, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const laserAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserTranslateY.value }],
  }));
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token, storeId, deviceId, staffId } = useAuthStore();
  
  const workflowParam = params.workflow;
  const workflow = typeof workflowParam === 'string' ? workflowParam : (workflowParam?.[0] || 'STOCK_AUDIT');

  useEffect(() => {
    // Reset scan state when screen focuses
    setScanned(false);

    // Scanner Telemetry Heartbeat (every 30 seconds)
    const deviceCode = 'SCN-001'; // In production, this would be stored securely locally or fetched from Expo Constants
    const actualToken = token || 'DUMMY_TOKEN'; // Bypass auth in dev if needed, or use actual
    
    const sendHeartbeat = async () => {
      try {
        await axios.post(`${API_URL}/scanner-management/heartbeat`, 
          { deviceCode },
          { headers: { Authorization: `Bearer ${actualToken}` } }
        );
      } catch (e) {
        // Silently fail if offline
      }
    };

    sendHeartbeat(); // Immediate
    const interval = setInterval(sendHeartbeat, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [params, token]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    setProcessing(true);

    try {
      const response = await axios.post(`${API_URL}/scanner/resolve`, {
        storeId,
        workflow,
        rawValue: data,
        symbology: type,
        deviceId,
        scannedById: staffId,
        idempotencyKey: `${Date.now()}-${data}`
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = response.data;
      
      // If found, route to action screen
      if (result.status === 'FOUND' || result.status === 'INTERNAL_BARCODE') {
        router.push({
          pathname: '/(tabs)/action',
          params: {
            workflow,
            rawValue: data,
            symbology: type,
            productId: result.product?.productId,
            productName: result.product?.name,
            productMrp: result.product?.mrp,
            actionLabel: result.workflow?.action || 'Enter Quantity',
            idempotencyKey: `${Date.now()}-${data}`
          }
        });
      } else {
        Alert.alert(
          'Unknown Barcode', 
          `Barcode ${data} not found in catalog. Send to intake?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
            { text: 'Intake', onPress: () => {
              router.push({
                pathname: '/(tabs)/action',
                params: {
                  workflow: 'PRODUCT_INTAKE',
                  rawValue: data,
                  symbology: type,
                  actionLabel: 'CREATE_PENDING_PRODUCT',
                  idempotencyKey: `${Date.now()}-${data}`
                }
              });
              setScanned(false);
            }}
          ]
        );
      }

    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to resolve barcode. Check network.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "code128", "itf14"],
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.headerGlass}>
          <Text style={styles.workflowText}>{workflow.toUpperCase()}</Text>
        </View>
        <View style={styles.targetBox}>
          {/* Corner accents */}
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          {/* Animated Laser */}
          {!scanned && <Animated.View style={[styles.laser, laserAnimatedStyle]} />}
        </View>
      </View>

      {processing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>RESOLVING BARCODE...</Text>
        </View>
      )}

      {scanned && !processing && (
        <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGlass: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workflowText: {
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
  },
  targetBox: {
    width: 250,
    height: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: Colors.primary },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  laser: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.primary,
    marginTop: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});
