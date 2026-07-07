import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import { Colors } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

const BASE_URL = API_BASE_URL;

export default function ManualEntryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token, storeId } = useAuthStore();

  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [generating, setGenerating] = useState(false);

  const workflow = typeof params.workflow === 'string' ? params.workflow : 'PRODUCT_INTAKE';

  const handleGenerateBarcode = async () => {
    setGenerating(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/scanner/barcode/generate-internal`, {
        params: { storeId },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setBarcode(response.data);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate internal barcode.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    if (!productName.trim() || !barcode.trim()) {
      Alert.alert('Validation Error', 'Product Name and Barcode are required.');
      return;
    }

    // Pass data to action screen to enter quantity and submit
    router.push({
      pathname: '/(tabs)/action',
      params: {
        workflow,
        rawValue: barcode,
        symbology: 'EAN-13',
        productName: productName,
        actionLabel: 'CREATE_PENDING_PRODUCT',
        idempotencyKey: `${Date.now()}-${barcode}`
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Manual Intake</Text>
        <Text style={styles.subtitle}>Enter product details or generate an internal barcode.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Parle G 100g"
            placeholderTextColor={Colors.textMuted}
            value={productName}
            onChangeText={setProductName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Barcode (EAN-13 / UPCA) *</Text>
          <View style={styles.barcodeRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Enter barcode or generate"
              placeholderTextColor={Colors.textMuted}
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.generateBtn} 
              onPress={handleGenerateBarcode}
              disabled={generating}
            >
              {generating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.generateBtnText}>Generate</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
          <Text style={styles.submitBtnText}>Next (Enter Quantity)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
