import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';

const API_URL = 'http://192.168.1.100:3000/api/v1';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token, storeId, deviceId, staffId } = useAuthStore();
  
  const workflow = params.workflow || 'STOCK_AUDIT';

  useEffect(() => {
    // Reset scan state when screen focuses
    setScanned(false);
  }, [params]);

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
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "code128", "itf14"],
        }}
      />
      
      <View style={styles.overlay}>
        <Text style={styles.workflowText}>Current Workflow: {workflow}</Text>
        <View style={styles.targetBox} />
      </View>

      {processing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Resolving Barcode...</Text>
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
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workflowText: {
    position: 'absolute',
    top: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: 8,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  targetBox: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontWeight: 'bold',
  }
});
