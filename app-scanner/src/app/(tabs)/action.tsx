import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import Constants from 'expo-constants';
import axios from 'axios';
import { Check, X } from 'lucide-react-native';

import { API_BASE_URL } from '../../constants/api';
const BASE_URL = API_BASE_URL;

export default function ActionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token, storeId, deviceId, staffId } = useAuthStore();

  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  // Read data passed from scanner screen
  const { 
    workflow, 
    rawValue, 
    symbology, 
    productId, 
    productName, 
    productMrp, 
    actionLabel, 
    idempotencyKey 
  } = params;

  const handleSubmit = async () => {
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number.');
      return;
    }

    setSubmitting(true);

    try {
      // If it's a known product (productId exists) and not CREATE_PENDING_PRODUCT
      if (productId && actionLabel !== 'CREATE_PENDING_PRODUCT') {
        if (workflow === 'ARCHIVE_PRODUCT') {
          await axios.post(`${BASE_URL}/api/v1/scanner/products/${productId}/archive`, {
            storeId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          const backendMovementType = workflow === 'PRODUCT_INTAKE' 
            ? 'PURCHASE_INTAKE' 
            : (workflow === 'DISPATCH' ? 'DISPATCH' : 'MANUAL_ADJUSTMENT');
            
          await axios.post(`${BASE_URL}/api/v1/scanner/stock/update`, {
            storeId,
            productId,
            movementType: backendMovementType,
            quantityInput: qtyNum,
            inputUnit: 'PCS', // Defaulting to PCS, UI can be expanded to support BOX
            conversionToBase: 1, // Defaulting to 1 for PCS
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } else {
        // If it's an unknown barcode
        await axios.post(`${BASE_URL}/api/v1/scanner/product-drafts`, {
          storeId,
          barcode: rawValue,
          productName: `New Item (${rawValue})`,
          mrp: 0,
          gstRate: 0,
          baseUnit: 'PCS'
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.workflowTag}>{workflow}</Text>
        </View>

        <Text style={styles.productName}>{productName || 'Unknown Product'}</Text>
        <Text style={styles.detailsText}>Barcode: {rawValue}</Text>
        {productMrp && <Text style={styles.detailsText}>MRP: ₹{productMrp}</Text>}

        {workflow !== 'ARCHIVE_PRODUCT' && actionLabel !== 'CREATE_PENDING_PRODUCT' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{actionLabel || 'Enter Quantity'}:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              autoFocus
            />
          </View>
        )}

        {workflow === 'ARCHIVE_PRODUCT' && (
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: 'red' }]}>Are you sure you want to archive this product?</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={() => router.back()}
          disabled={submitting}
        >
          <X color="#475569" size={24} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.button, 
            styles.submitButton, 
            workflow === 'ARCHIVE_PRODUCT' && { backgroundColor: '#ef4444' }
          ]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Check color="#fff" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>{workflow === 'ARCHIVE_PRODUCT' ? 'ARCHIVE' : 'SUBMIT'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  workflowTag: {
    backgroundColor: '#E0F2FE',
    color: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  inputContainer: {
    marginTop: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0F172A',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
