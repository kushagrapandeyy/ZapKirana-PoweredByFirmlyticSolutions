import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { OfflineQueueService } from '../../../services/OfflineQueueService';

export default function InventoryScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [updateStock, setUpdateStock] = useState('');
  const [subDiscount, setSubDiscount] = useState('0');

  useEffect(() => {
    loadInventory();

    // Subscribe to inventory changes (real-time updates)
    const subscription = supabase
      .channel(`inventory_updates_${CURRENT_STORE_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Inventory', filter: `storeId=eq.${CURRENT_STORE_ID}` },
        (payload) => {
          console.log('Realtime Inventory Update:', payload);
          // Reload inventory to get the latest joined product data
          loadInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
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
    setSubDiscount((product.subscriptionDiscount || 0).toString());
    bottomSheetRef.current?.expand();
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedProduct(null);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const submitStockUpdate = async () => {
    if (role !== 'MANAGER' && role !== 'OWNER') {
      Alert.alert('Access Denied', 'Manager or Owner privileges are required to manually adjust stock levels outside of a Purchase Order or GRN.');
      return;
    }
    
    if (!selectedProduct) return;
    
    try {
      const res = await OfflineQueueService.apiFetch(`${API_BASE_URL}/inventory/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stockLevel: parseInt(updateStock),
          userId: 'de283b71-1972-47b7-996f-6633d0f7b7f5'
        })
      });

      if (res.ok || res.status === 202) {
        bottomSheetRef.current?.close();
        if (res.status === 202) {
          Alert.alert('Offline Mode', 'Stock update queued for sync.');
        } else {
          loadInventory();
          Alert.alert('Stock Updated', `${selectedProduct.name} is now at ${updateStock} units.`);
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update stock.');
    }
  };

  const updateDiscount = async () => {
    if (!selectedProduct) return;
    try {
      const res = await OfflineQueueService.apiFetch(`${API_BASE_URL}/products/${selectedProduct.id}/subscription-discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: parseFloat(subDiscount) || 0 })
      });
      if (res.ok || res.status === 202) {
        if (res.status === 202) {
          Alert.alert('Offline Mode', 'Subscription discount queued for sync.');
        } else {
          Alert.alert('Success', 'Subscription discount updated.');
          loadInventory();
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update discount.');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.includes(searchQuery));

  const renderProduct = ({ item, index }: { item: any, index: number }) => {
    const stock = item.stockLevel ?? item.onHandQty ?? 0;
    const isLow = stock <= 10;

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify().damping(15)}>
        <TouchableOpacity style={styles.productCard} onPress={() => router.push(`/operations/inventory/${item.productId || item.id}`)} activeOpacity={0.7}>
          <Image 
            source={{ uri: item.imageUrl || `https://placehold.co/100x100?text=${item.name.substring(0,1)}` }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category || 'General'}</Text>
            <Text style={styles.productPrice}>₹{item.sellingPrice}</Text>
          </View>
          <View style={styles.stockColumn}>
            <View style={[styles.stockBadge, isLow && styles.lowStockBadge]}>
              <Text style={[styles.stockText, isLow && styles.lowStockText]}>{stock}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginTop: 8 }} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catalog</Text>
        <TouchableOpacity style={styles.scanBtn}>
          <Ionicons name="scan-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Role Banner */}
      <View style={styles.roleBanner}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.surface} />
        <Text style={styles.roleText}>Access Level: {role || 'STAFF'}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, SKU..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
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

      {/* Bottom Sheet */}
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

              <Text style={styles.sectionTitle}>Manual Adjustment</Text>
              
              {(role !== 'MANAGER' && role !== 'OWNER') && (
                <View style={styles.alertBox}>
                  <Ionicons name="lock-closed" size={20} color="#B45309" />
                  <Text style={styles.alertText}>Manager privileges required to manually edit stock levels. Please use the Scanner App for GRN.</Text>
                </View>
              )}

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>New Level:</Text>
                <TextInput
                  style={[styles.stockInput, (role !== 'MANAGER' && role !== 'OWNER') && styles.disabledInput]}
                  value={updateStock}
                  onChangeText={setUpdateStock}
                  keyboardType="numeric"
                  editable={(role === 'MANAGER' || role === 'OWNER')}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, (role !== 'MANAGER' && role !== 'OWNER') && styles.saveBtnDisabled]} 
                onPress={submitStockUpdate}
                disabled={(role !== 'MANAGER' && role !== 'OWNER')}
              >
                <Text style={styles.saveBtnText}>Update Inventory</Text>
              </TouchableOpacity>

              <View style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Subscription Config</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Discount %:</Text>
                <TextInput
                  style={[styles.stockInput, (role !== 'MANAGER' && role !== 'OWNER') && styles.disabledInput]}
                  value={subDiscount}
                  onChangeText={setSubDiscount}
                  keyboardType="numeric"
                  editable={(role === 'MANAGER' || role === 'OWNER')}
                />
              </View>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: '#1E40AF', marginBottom: 20 }, (role !== 'MANAGER' && role !== 'OWNER') && styles.saveBtnDisabled]} 
                onPress={updateDiscount}
                disabled={(role !== 'MANAGER' && role !== 'OWNER')}
              >
                <Text style={styles.saveBtnText}>Update Discount</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  scanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: Radius.lg, paddingHorizontal: 16, height: 52, ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  roleBanner: { backgroundColor: Colors.textPrimary, paddingVertical: 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  roleText: { color: Colors.surface, fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: Radius.xl, padding: 12, marginBottom: 12, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  cardImage: { width: 64, height: 64, borderRadius: Radius.lg, backgroundColor: '#F8FAFC', marginRight: 16 },
  cardInfo: { flex: 1 },
  productName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  productCategory: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 6 },
  productPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  
  stockColumn: { alignItems: 'center', justifyContent: 'center' },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F0FDF4' },
  stockText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  lowStockBadge: { backgroundColor: '#FEF2F2' },
  lowStockText: { color: Colors.danger },

  bottomSheetBg: { backgroundColor: '#FAF9F6', borderRadius: 32 },
  sheetContent: { padding: 24, paddingBottom: 40 },
  sheetImage: { width: '100%', height: 240, borderRadius: Radius.xl, backgroundColor: '#fff', marginBottom: 20, resizeMode: 'cover' },
  sheetTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: '#F1F5F9' },
  tagText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 24 },

  sheetRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: Radius.xl, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  statLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },

  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  
  alertBox: { backgroundColor: '#FFFBEB', padding: 16, borderRadius: Radius.lg, flexDirection: 'row', gap: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A' },
  alertText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: '#92400E', lineHeight: 20 },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  inputLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginRight: 16 },
  stockInput: { flex: 1, backgroundColor: '#fff', height: 56, borderRadius: Radius.lg, paddingHorizontal: 16, fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, borderWidth: 1, borderColor: '#CBD5E1' },
  disabledInput: { backgroundColor: '#F8FAFC', color: Colors.textMuted },
  
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: Radius.xl, alignItems: 'center', ...Shadows.md },
  saveBtnDisabled: { backgroundColor: '#94A3B8' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
});
