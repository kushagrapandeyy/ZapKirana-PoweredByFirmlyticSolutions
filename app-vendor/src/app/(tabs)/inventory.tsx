import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, CURRENT_STORE_ID, CURRENT_STAFF_ID } from '@/constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function InventoryScreen() {
  const { role } = useAuth();
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // State for Reason Code Modal
  const [adjustingItem, setAdjustingItem] = useState<{id: string, delta: number} | null>(null);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const REASONS = ['Count Correction', 'Damaged', 'Expired', 'Theft Suspected'];

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products?storeId=${CURRENT_STORE_ID}`);
      const products = await res.json();
      
      if (!Array.isArray(products)) {
        console.error('Invalid products response:', products);
        return;
      }
      
      const inventoryData = await Promise.all(products.map(async (p: any) => {
        const stockRes = await fetch(`${API_BASE_URL}/inventory/${p.id}/available?storeId=${CURRENT_STORE_ID}`);
        const stockData = await stockRes.json();
        return {
          id: p.id,
          name: p.name,
          price: p.sellingPrice,
          stock: stockData.available || 0,
        };
      }));
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setIsScanning(false);
    try {
      // Find product by barcode
      const res = await fetch(`${API_BASE_URL}/products/barcode/${data}?storeId=${CURRENT_STORE_ID}`);
      if (!res.ok) {
        alert('Product not found for this barcode!');
        return;
      }
      const product = await res.json();
      
      // Receive stock automatically on scan (simplified logic for demo)
      await fetch(`${API_BASE_URL}/inventory/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: CURRENT_STORE_ID,
          productId: product.id,
          quantity: 10,
          staffId: CURRENT_STAFF_ID,
        }),
      });
      
      alert(`Scanned: ${product.name}. Added 10 units!`);
      fetchInventory();
    } catch (err) {
      alert('Error processing barcode scan.');
    }
  };

  const attemptStockUpdate = (id: string, delta: number) => {
    if (role === 'PICKER') {
      alert('Pickers cannot manually adjust stock. Please use the scanner or ask a Manager.');
      return;
    }
    setAdjustingItem({ id, delta });
    setReasonModalVisible(true);
  };

  const confirmStockUpdate = async () => {
    if (!adjustingItem || !selectedReason) {
      alert('Please select a reason code.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: CURRENT_STORE_ID,
          productId: adjustingItem.id,
          quantityChange: adjustingItem.delta,
          reason: selectedReason,
          staffId: CURRENT_STAFF_ID,
        }),
      });

      if (res.ok) {
        alert(`Stock updated. Reason logged: ${selectedReason}`);
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert(`Failed to update stock: ${errorData.message}`);
      }
    } catch (err) {
      alert('Network error updating stock.');
    }
    
    setReasonModalVisible(false);
    setAdjustingItem(null);
    setSelectedReason(null);
  };

  if (isScanning) {
    return (
      <View style={styles.scannerMode}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.backBtn}>
            <Ionicons name="close" size={28} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>Scan Barcode</Text>
        </View>
        
        {hasPermission ? (
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128"],
            }}
            style={styles.camera}
          />
        ) : (
          <Text style={styles.noCameraText}>No Camera Access</Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Manager</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={() => setIsScanning(true)}>
          <Ionicons name="barcode-outline" size={20} color={WHITE} />
          <Text style={styles.scanBtnText}>Scan Stock</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Search inventory..." />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {inventory.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.stockController}>
              <TouchableOpacity style={styles.stockBtn} onPress={() => attemptStockUpdate(item.id, -1)}>
                <Ionicons name="remove" size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={[styles.stockValue, item.stock < 10 && styles.lowStock]}>{item.stock}</Text>
              <TouchableOpacity style={styles.stockBtn} onPress={() => attemptStockUpdate(item.id, 1)}>
                <Ionicons name="add" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Reason Code Modal */}
      <Modal visible={reasonModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Reason Code</Text>
            <Text style={styles.modalSubtitle}>Manual edits require an audit reason.</Text>
            
            <View style={styles.reasonsList}>
              {REASONS.map(reason => (
                <TouchableOpacity 
                  key={reason} 
                  style={[styles.reasonBtn, selectedReason === reason && styles.reasonBtnActive]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text style={[styles.reasonBtnText, selectedReason === reason && styles.reasonBtnTextActive]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setReasonModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmStockUpdate}>
                <Text style={styles.modalConfirmText}>Confirm Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, color: '#0f172a', fontFamily: 'PlayfairDisplay_700Bold' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: ROYAL_BLUE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  scanBtnText: { color: WHITE, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, fontFamily: 'Inter_400Regular' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: WHITE, padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#0f172a', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b' },
  stockController: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
  stockBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE, borderRadius: 6 },
  stockValue: { width: 40, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  lowStock: { color: '#ef4444' }, // red color for low stock
  scannerMode: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scannerTitle: { color: WHITE, fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  camera: { flex: 1 },
  noCameraText: { color: WHITE, textAlign: 'center', marginTop: 150, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b', marginBottom: 20 },
  reasonsList: { gap: 10, marginBottom: 30 },
  reasonBtn: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  reasonBtnActive: { borderColor: ROYAL_BLUE, backgroundColor: '#eff6ff' },
  reasonBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#475569' },
  reasonBtnTextActive: { color: ROYAL_BLUE },
  modalActions: { flexDirection: 'row', gap: 15 },
  modalCancel: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#64748b' },
  modalConfirm: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: ROYAL_BLUE, alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: WHITE },
});
