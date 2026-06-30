import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';

export default function InventoryScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Update Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [updateStock, setUpdateStock] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const storeId = await AsyncStorage.getItem('@vendor_store_id') || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f';
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${storeId}`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScannerOpen(false);
    const product = products.find(p => p.sku === data || p.internalSku === data);
    
    if (product) {
      setSelectedProduct(product);
      setUpdateStock(product.stockLevel.toString());
    } else {
      Alert.alert('Not Found', `No product matched barcode: ${data}`);
    }
  };

  const submitStockUpdate = async () => {
    if (!selectedProduct) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockLevel: parseInt(updateStock, 10) })
      });
      
      if (res.ok) {
        loadInventory();
        setSelectedProduct(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const isLowStock = item.stockLevel <= (item.reorderPoint || 10);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity 
          style={[styles.productCard, isLowStock && styles.productCardLow]}
          onPress={() => {
            setSelectedProduct(item);
            setUpdateStock(item.stockLevel.toString());
          }}
        >
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku || item.internalSku || 'N/A'}</Text>
            <Text style={styles.productCategory}>{item.category || 'General'}</Text>
          </View>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Stock</Text>
            <Text style={[styles.stockValue, isLowStock && styles.stockValueLow]}>{item.stockLevel}</Text>
            {isLowStock && (
              <View style={styles.lowBadge}>
                <Text style={styles.lowBadgeText}>Low</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Manager</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SKU"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.scanBtn}
          onPress={() => {
            if (!permission?.granted) requestPermission();
            setScannerOpen(true);
          }}
        >
          <Ionicons name="barcode-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Scanner Overlay */}
      {scannerOpen && permission?.granted && (
        <View style={styles.scannerOverlay}>
          <SafeAreaView style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setScannerOpen(false)} style={styles.closeScannerBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={{ width: 28 }} />
          </SafeAreaView>
          
          <CameraView 
            style={styles.camera} 
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.scannerMask}>
              <View style={styles.scanBox} />
            </View>
          </CameraView>
        </View>
      )}

      {/* Update Stock Modal */}
      {selectedProduct && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalBackdrop}>
            <Animated.View entering={SlideInUp.springify()} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Stock</Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
              <Text style={styles.modalProductSku}>SKU: {selectedProduct.sku || selectedProduct.internalSku}</Text>

              <View style={styles.stockUpdateControls}>
                <TouchableOpacity 
                  style={styles.qtyAdjustBtn}
                  onPress={() => setUpdateStock(prev => Math.max(0, parseInt(prev || '0') - 1).toString())}
                >
                  <Ionicons name="remove" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={updateStock}
                  onChangeText={setUpdateStock}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={styles.qtyAdjustBtn}
                  onPress={() => setUpdateStock(prev => (parseInt(prev || '0') + 1).toString())}
                >
                  <Ionicons name="add" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={submitStockUpdate}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  searchSection: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, paddingHorizontal: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, height: 48, marginLeft: 10, fontSize: 15, fontFamily: 'Inter_400Regular' },
  scanBtn: { width: 48, height: 48, backgroundColor: Colors.primary, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  list: { padding: 20, gap: 12 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, ...Shadows.sm, borderLeftWidth: 4, borderLeftColor: Colors.success },
  productCardLow: { borderLeftColor: Colors.danger },
  productInfo: { flex: 1, paddingRight: 16 },
  productName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  productSku: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 4 },
  productCategory: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.primary },
  stockInfo: { alignItems: 'flex-end', justifyContent: 'center' },
  stockLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 2 },
  stockValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  stockValueLow: { color: Colors.dangerDark },
  lowBadge: { backgroundColor: Colors.dangerLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  lowBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.dangerDark },
  
  scannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 100 },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, zIndex: 101 },
  closeScannerBtn: { padding: 4 },
  scannerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  camera: { flex: 1 },
  scannerMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'transparent' },
  
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  modalProductName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  modalProductSku: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 24 },
  
  stockUpdateControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32 },
  qtyAdjustBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  qtyInput: { width: 80, height: 60, fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, borderBottomWidth: 2, borderBottomColor: Colors.primary },
  
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', ...Shadows.glow },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
