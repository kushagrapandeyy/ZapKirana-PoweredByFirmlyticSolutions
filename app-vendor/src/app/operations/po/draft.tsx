import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function DraftPOScreen() {
  const { supplierId } = useLocalSearchParams();
  const router = useRouter();
  
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    init();
  }, [supplierId]);

  const init = async () => {
    try {
      const sId = await AsyncStorage.getItem('@selected_store_id') || CURRENT_STORE_ID;
      setStoreId(sId);
      
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      setExpectedDate(tmr.toISOString().split('T')[0]);

      // Fetch Supplier Products
      const supRes = await fetch(`${API_BASE_URL}/admin/suppliers/${supplierId}`);
      let supplierData = null;
      if (supRes.ok) {
        supplierData = await supRes.json();
        setSupplier(supplierData);
      }

      // Fetch Store Inventory to get onHandQty
      const invRes = await fetch(`${API_BASE_URL}/inventory/store/${sId}`);
      let inventoryMap: Record<string, number> = {};
      if (invRes.ok) {
        const invData = await invRes.json();
        invData.forEach((inv: any) => {
          inventoryMap[inv.productId] = inv.onHandQty;
        });
      }

      if (supplierData && supplierData.supplierProducts) {
        setDraftItems(supplierData.supplierProducts.map((sp: any) => ({
          ...sp,
          orderQuantity: 0,
          onHandQty: inventoryMap[sp.productId] || 0
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, qtyText: string) => {
    const val = parseInt(qtyText, 10);
    const newQ = isNaN(val) ? 0 : Math.max(0, val);
    
    setDraftItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, orderQuantity: newQ };
      }
      return item;
    }));
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setIsScanning(false);
    setSearchQuery(data);
    Toast.show({ type: 'success', text1: 'Barcode Scanned', text2: data });
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission required', 'Camera permission is required to scan barcodes.');
        return;
      }
    }
    setIsScanning(true);
  };

  const submitPO = async () => {
    const itemsToOrder = draftItems.filter(i => i.orderQuantity > 0);
    if (itemsToOrder.length === 0) {
      Toast.show({ type: 'error', text1: 'No items selected', text2: 'Please add at least one item to the PO.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeId,
        supplierId,
        expectedDeliveryDate: new Date(expectedDate).toISOString(),
        notes,
        items: itemsToOrder.map(i => ({
          productId: i.productId,
          quantity: i.orderQuantity,
          purchasePrice: i.price
        }))
      };

      const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const orderData = await res.json();
        Toast.show({ type: 'success', text1: 'PO Created Successfully' });
        router.replace({
          pathname: '/operations/po/confirmation',
          params: { poId: orderData.id, totalValue: totalPOValue.toFixed(2), supplierName: supplier?.name }
        });
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: 'Failed to create PO', text2: err.message });
      }
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Network Error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Filter and Sort: Ordered items at the top
  const filteredItems = draftItems.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.product?.name?.toLowerCase().includes(q) || 
           item.product?.category?.toLowerCase().includes(q) ||
           item.product?.barcode?.toLowerCase().includes(q);
  }).sort((a, b) => {
    if (a.orderQuantity > 0 && b.orderQuantity === 0) return -1;
    if (b.orderQuantity > 0 && a.orderQuantity === 0) return 1;
    return 0;
  });

  const totalPOValue = draftItems.reduce((acc, item) => acc + (item.orderQuantity * item.price), 0);
  const totalItems = draftItems.reduce((acc, item) => acc + item.orderQuantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Draft Purchase Order</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.supplierCard}>
          <Text style={styles.supplierLabel}>Ordering From</Text>
          <Text style={styles.supplierName}>{supplier?.name}</Text>
          <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8}}>Store ID: {storeId.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Expected Delivery Date (YYYY-MM-DD)</Text>
          <TextInput 
            style={styles.input} 
            value={expectedDate} 
            onChangeText={setExpectedDate} 
            placeholder="2026-10-15"
          />
          
          <Text style={styles.formLabel}>Notes / Instructions</Text>
          <TextInput 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            value={notes} 
            onChangeText={setNotes} 
            placeholder="e.g. Please pack fragile items carefully"
            multiline
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Select Items</Text>
        </View>
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, category, or barcode..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={startScanning} style={styles.scanBtn}>
            <Ionicons name="barcode-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.productListBox}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 650 }} showsVerticalScrollIndicator={true}>
            {filteredItems.map(item => (
              <View key={item.id} style={[styles.itemCard, item.orderQuantity > 0 && styles.itemCardActive]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product?.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price.toFixed(2)} / unit</Text>
                  <Text style={styles.itemStockText}>
                    In Stock: <Text style={{fontFamily: 'Inter_700Bold', color: item.onHandQty < 10 ? Colors.danger : Colors.textPrimary}}>{item.onHandQty}</Text>
                  </Text>
                </View>
                
                <View style={styles.qtyController}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, (item.orderQuantity - 1).toString())}>
                    <Ionicons name="remove" size={16} color={Colors.primaryDark} />
                  </TouchableOpacity>
                  <TextInput 
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={item.orderQuantity.toString()}
                    onChangeText={(val) => updateQuantity(item.productId, val)}
                  />
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, (item.orderQuantity + 1).toString())}>
                    <Ionicons name="add" size={16} color={Colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {filteredItems.length === 0 && (
              <Text style={{textAlign: 'center', padding: 20, color: Colors.textSecondary}}>No products match your search.</Text>
            )}
          </ScrollView>
        </View>
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer sticky */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total ({totalItems} items)</Text>
          <Text style={styles.summaryValue}>₹{totalPOValue.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
          onPress={submitPO}
          disabled={submitting || totalPOValue === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Create Purchase Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Scanner Modal */}
      <Modal visible={isScanning} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Scan Barcode</Text>
          <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.modalCloseBtn}>
            <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "qr", "upc_e", "upc_a"],
            }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>Align barcode within the frame to search</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#FAF9F6', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  scrollContent: { padding: 20 },
  
  supplierCard: { backgroundColor: Colors.primaryDark, padding: 16, borderRadius: Radius.xl, marginBottom: 20, ...Shadows.sm },
  supplierLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 4 },
  supplierName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  
  formSection: { marginBottom: 24 },
  formLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, marginBottom: 16 },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: Radius.lg, paddingHorizontal: 12, height: 48, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  scanBtn: { padding: 8, backgroundColor: Colors.primaryGhost, borderRadius: Radius.md },

  productListBox: { backgroundColor: '#F8FAFC', borderRadius: Radius.xl, borderWidth: 1, borderColor: '#E2E8F0', padding: 8, ...Shadows.sm },

  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: Radius.lg, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  itemCardActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryGhost },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.primaryDark, marginBottom: 2 },
  itemStockText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  qtyController: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#E2E8F0' },
  qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  qtyInput: { width: 44, textAlign: 'center', fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, backgroundColor: '#fff', height: 36, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', ...Shadows.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  summaryValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  submitBtn: { width: '100%', backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: Radius.xl, ...Shadows.sm, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'transparent' },
  scannerText: { color: '#fff', marginTop: 20, fontSize: 14, fontFamily: 'Inter_500Medium' }
});
