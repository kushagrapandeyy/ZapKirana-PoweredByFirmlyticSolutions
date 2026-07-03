import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

// Mocked RBAC Context
const CURRENT_STAFF_ROLE = 'STAFF'; // Change to 'MANAGER' to unlock edits

export default function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '85%'], []);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [updateStock, setUpdateStock] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openProductDetails = (product: any) => {
    setSelectedProduct(product);
    setUpdateStock((product.stockLevel ?? product.onHandQty ?? 0).toString());
    bottomSheetRef.current?.expand();
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedProduct(null);
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const submitStockUpdate = async () => {
    if (CURRENT_STAFF_ROLE !== 'MANAGER') {
      Alert.alert('Access Denied', 'Manager approval is required to manually adjust stock levels outside of a Purchase Order or GRN.');
      return;
    }
    
    if (!selectedProduct) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockLevel: parseInt(updateStock, 10) })
      });
      
      if (res.ok) {
        loadInventory();
        bottomSheetRef.current?.close();
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
    const stock = item.stockLevel ?? item.onHandQty ?? 0;
    const isLowStock = stock <= (item.reorderPoint || 10);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(400)}>
        <TouchableOpacity 
          style={styles.productCard}
          activeOpacity={0.8}
          onPress={() => openProductDetails(item)}
        >
          <Image source={{ uri: item.imageUrl || `https://placehold.co/100x100?text=${item.name.substring(0,1)}` }} style={styles.cardImage} />
          
          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category || 'Uncategorized'}</Text>
            <Text style={styles.productPrice}>₹{item.sellingPrice}</Text>
          </View>

          <View style={[styles.stockBadge, isLowStock ? styles.lowStockBadge : null]}>
            <Text style={[styles.stockText, isLowStock ? styles.lowStockText : null]}>
              {stock} units
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Manager</Text>
        <TouchableOpacity style={styles.scanBtn}>
          <Ionicons name="barcode-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Role Badge Indicator */}
      <View style={styles.roleBanner}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.surface} />
        <Text style={styles.roleText}>Access Level: {CURRENT_STAFF_ROLE}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBg}
        enablePanDownToClose={true}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {selectedProduct && (
            <>
              <Image source={{ uri: selectedProduct.imageUrl || `https://placehold.co/400x300?text=${selectedProduct.name.substring(0,1)}` }} style={styles.sheetImage} />
              
              <Text style={styles.sheetTitle}>{selectedProduct.name}</Text>
              
              <View style={styles.tagsRow}>
                <View style={styles.tag}><Text style={styles.tagText}>{selectedProduct.category}</Text></View>
                <View style={[styles.tag, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.tagText, { color: '#7E22CE' }]}>SKU: {selectedProduct.sku}</Text></View>
                <View style={[styles.tag, { backgroundColor: '#FFEDD5' }]}><Text style={[styles.tagText, { color: '#C2410C' }]}>GST: {selectedProduct.gstClass}%</Text></View>
              </View>

              <View style={styles.divider} />

              <View style={styles.sheetRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Selling Price</Text>
                  <Text style={styles.statValue}>₹{selectedProduct.sellingPrice}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Cost Price</Text>
                  <Text style={styles.statValue}>₹{selectedProduct.costPrice || '--'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>On Hand</Text>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>{selectedProduct.stockLevel ?? selectedProduct.onHandQty}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Manual Stock Adjustment</Text>
              
              {CURRENT_STAFF_ROLE !== 'MANAGER' && (
                <View style={styles.alertBox}>
                  <Ionicons name="lock-closed" size={20} color="#B45309" />
                  <Text style={styles.alertText}>Manager privileges required to manually edit stock levels. Please use the Scanner App for GRN.</Text>
                </View>
              )}

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>New Stock Level:</Text>
                <TextInput
                  style={[styles.stockInput, CURRENT_STAFF_ROLE !== 'MANAGER' && styles.disabledInput]}
                  value={updateStock}
                  onChangeText={setUpdateStock}
                  keyboardType="numeric"
                  editable={CURRENT_STAFF_ROLE === 'MANAGER'}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, CURRENT_STAFF_ROLE !== 'MANAGER' && styles.saveBtnDisabled]} 
                onPress={submitStockUpdate}
                disabled={CURRENT_STAFF_ROLE !== 'MANAGER'}
              >
                <Text style={styles.saveBtnText}>Update Inventory</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  scanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, marginBottom: 16, borderRadius: Radius.lg, paddingHorizontal: 16, height: 50, ...Shadows.sm },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  roleBanner: { backgroundColor: Colors.textPrimary, paddingVertical: 6, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { color: Colors.surface, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  list: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 16 },
  
  productCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, marginBottom: 12, alignItems: 'center', ...Shadows.sm },
  cardImage: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: '#F1F5F9', marginRight: 16 },
  cardInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 2 },
  productCategory: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 },
  productPrice: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#EFF6FF' },
  stockText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.primary },
  lowStockBadge: { backgroundColor: '#FEF2F2' },
  lowStockText: { color: Colors.danger },

  bottomSheetBg: { backgroundColor: '#F8FAFC', borderRadius: 24 },
  sheetContent: { padding: 24, paddingBottom: 40 },
  sheetImage: { width: '100%', height: 200, borderRadius: Radius.lg, backgroundColor: '#fff', marginBottom: 20, resizeMode: 'contain' },
  sheetTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: '#F0FDF4' },
  tagText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#166534' },

  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 24 },

  sheetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, marginHorizontal: 4, alignItems: 'center', ...Shadows.sm },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },

  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  
  alertBox: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: Radius.md, flexDirection: 'row', gap: 10, marginBottom: 16 },
  alertText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#92400E', lineHeight: 18 },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  inputLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginRight: 16 },
  stockInput: { flex: 1, backgroundColor: '#fff', height: 50, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, borderWidth: 1, borderColor: '#CBD5E1' },
  disabledInput: { backgroundColor: '#F1F5F9', color: Colors.textMuted },
  
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#94A3B8' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
