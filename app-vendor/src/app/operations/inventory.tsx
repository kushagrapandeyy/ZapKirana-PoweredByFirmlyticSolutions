import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
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
      const storeId = CURRENT_STORE_ID; // Bypass AsyncStorage cache for testing
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
          style={styles.productCard}
          onPress={() => {
            setSelectedProduct(item);
            setUpdateStock(item.stockLevel.toString());
          }}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category || 'Uncategorized'}</Text>
            </View>
            <View style={[styles.stockBadge, isLowStock ? styles.lowStockBadge : null]}>
              <Text style={[styles.stockText, isLowStock ? styles.lowStockText : null]}>
                {item.stockLevel} in stock
              </Text>
            </View>
          </View>
          <View style={styles.cardDetails}>
            <Text style={styles.detailText}>SKU: {item.sku}</Text>
            <Text style={styles.detailText}>₹{item.sellingPrice}</Text>
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
          contentContainerStyle={styles.listContainer}
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
  
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  productCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, marginBottom: 12, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  productCategory: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary },
  stockBadge: { backgroundColor: Colors.primaryGhost, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  stockText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.primary },
  lowStockBadge: { backgroundColor: Colors.dangerLight, borderColor: 'rgba(225, 29, 72, 0.1)' },
  lowStockText: { color: Colors.danger },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  detailText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  
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
