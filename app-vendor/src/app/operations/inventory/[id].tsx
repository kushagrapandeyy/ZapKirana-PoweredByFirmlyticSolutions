import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';

export default function InventoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token, role } = useAuth();
  const queryClient = useQueryClient();
  
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockAmount, setStockAmount] = useState('');
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    barcode: '',
    name: '',
    category: '',
    imageUrl: '',
    price: '',
    supplierLink: '', supplierId: '', stock: '',
    rateA: '', rateB: '', rateC: '',
    minimumQty: '', reorderDays: ''
  });
  
  const openEditModal = () => {
    setEditForm({
      barcode: product.barcode || product.id || '',
      name: product.name || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      price: product.price?.toString() || '',
      supplierLink: '', // Not used anymore
      supplierId: supplierProductInfo?.supplierId || '',
      stock: (productWrapper?.quantity || 0).toString(),
      rateA: product.rateA?.toString() || '',
      rateB: product.rateB?.toString() || '',
      rateC: product.rateC?.toString() || '',
      minimumQty: product.minimumQty?.toString() || '',
      reorderDays: product.reorderDays?.toString() || ''
    });
    setIsEditModalVisible(true);
  };
  
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/inventory/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: CURRENT_STORE_ID,
          name: data.name,
          category: data.category,
          price: parseFloat(data.price),
          imageUrl: data.imageUrl,
          supplierId: data.supplierId,
          rateA: parseFloat(data.rateA) || null,
          rateB: parseFloat(data.rateB) || null,
          rateC: parseFloat(data.rateC) || null,
          minimumQty: parseInt(data.minimumQty) || null,
          reorderDays: parseInt(data.reorderDays) || null
        })
      });
      if (!res.ok) throw new Error('Failed to update product');
      
      // If stock changed, adjust it
      const currentQty = productWrapper?.quantity || 0;
      const newQty = parseInt(data.stock);
      if (!isNaN(newQty) && newQty !== currentQty) {
         await fetch(`${API_BASE_URL}/inventory/adjust`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             storeId: CURRENT_STORE_ID,
             productId: product.id,
             quantityChange: newQty - currentQty,
             reason: 'Manual Edit from Product Page',
             staffId: 'system'
           })
         });
      }
      return res.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory', CURRENT_STORE_ID] });
      setIsEditModalVisible(false);
    }
  });

  
  // Fetch All Products to find the right one
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['inventory_products', CURRENT_STORE_ID],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  // Fetch Ledger (Stock Transactions)
  const { data: ledger } = useQuery({
    queryKey: ['inventory_ledger', CURRENT_STORE_ID, id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/inventory/ledger?storeId=${CURRENT_STORE_ID}&productId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch ledger');
      return res.json();
    }
  });

  const productWrapper = products?.find((p: any) => p.productId === id || p.id === id);
  const product = productWrapper?.product || productWrapper; // Accommodate join response structure

  // Role Checks
  const isManagerOrOwner = role === 'MANAGER' || role === 'OWNER';

  // Dummy Stock Update Mutation (using AuditLog or actual backend if supported)
  const updateStockMutation = useMutation({
    mutationFn: async (amount: number) => {
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      Alert.alert('Success', isManagerOrOwner ? 'Stock updated successfully!' : 'Stock change requested successfully! Awaiting manager approval.');
      setIsStockModalVisible(false);
      setStockAmount('');
    }
  });

  const handleStockAction = () => {
    if (!stockAmount.trim() || isNaN(Number(stockAmount))) {
      Alert.alert('Invalid', 'Please enter a valid number.');
      return;
    }
    updateStockMutation.mutate(Number(stockAmount));
  };

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers`);
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    }
  });

  if (isLoadingProducts || !product) {
    return <SafeAreaView style={styles.container}><View style={styles.loader}><Text>Loading...</Text></View>
      
</SafeAreaView>
;
  }

  // Check if we have supplier info
  const supplierProductInfo = product.supplierProducts?.[0]; // Get the first mapped supplier
  const supplierId = supplierProductInfo?.supplierId;


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image' }} 
            style={styles.heroImage} 
            resizeMode="cover" 
          />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productCategory}>{product.category || 'Uncategorized'}</Text>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={openEditModal}>
            <Ionicons name="pencil-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, !isManagerOrOwner && { backgroundColor: '#F8FAFC' }]}
            onPress={() => setIsStockModalVisible(true)}
          >
            <Ionicons name={isManagerOrOwner ? "cube-outline" : "alert-circle-outline"} size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>{isManagerOrOwner ? 'Update Stock' : 'Request Stock Change'}</Text>
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Barcode/ID</Text>
              <Text style={styles.infoValue}>{product.barcode || product.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{product.category || 'Uncategorized'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Stock</Text>
              <Text style={styles.infoValueGreen}>{productWrapper?.quantity || 0}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>₹{product.price}</Text>
            </View>
          </View>
        </View>

        {/* Supplier Tag */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>View Supplier</Text>
          <TouchableOpacity 
            style={[styles.supplierCard, !supplierId && { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]} 
            onPress={() => {
              if (supplierId) router.push(`/operations/supplier/${supplierId}`);
              else Alert.alert('Not Linked', 'No supplier is mapped to this product yet.');
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.supplierTitle, !supplierId && { color: Colors.textSecondary }]}>
                {supplierId ? 'Contact supplier for this product' : 'No Supplier Linked'}
              </Text>
              <Text style={styles.supplierSub}>
                {supplierId ? 'Tap to view interconnected supplier ledger.' : 'Edit product to map a supplier.'}
              </Text>
            </View>
            {supplierId && <Ionicons name="arrow-forward" size={20} color={Colors.primary} />}
          </TouchableOpacity>
        </View>

        {/* Stock Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Transactions</Text>
          <View style={styles.card}>
            {!ledger || ledger.length === 0 ? (
              <Text style={styles.emptyText}>No stock history available.</Text>
            ) : (
              ledger.slice(0, 10).map((txn: any, idx: number) => (
                <View key={txn.id || idx} style={[styles.txnRow, idx === Math.min(ledger.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={styles.txnType}>{txn.type}</Text>
                    <Text style={styles.txnDate}>{new Date(txn.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.txnQty, txn.quantityChange > 0 ? styles.textGreen : styles.textRed]}>
                    {txn.quantityChange > 0 ? '+' : ''}{txn.quantityChange}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Sales (Dummy for now as it needs POS Bills mapping) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <View style={styles.card}>
             <Text style={styles.emptyText}>No recent sales available.</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Stock Modal */}
      <Modal visible={isStockModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isManagerOrOwner ? 'Update Stock' : 'Request Stock Change'}</Text>
              <TouchableOpacity onPress={() => setIsStockModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.formContent}>
              <Text style={styles.label}>{isManagerOrOwner ? 'New Stock Quantity' : 'Requested Stock Amount'}</Text>
              
            <TextInput style={styles.input} value={stockAmount} onChangeText={setStockAmount} keyboardType="numeric" placeholder="e.g. 100" />
              <TouchableOpacity style={[styles.submitBtn, !stockAmount.trim() && { opacity: 0.5 }]} onPress={handleStockAction} disabled={!stockAmount.trim()}>
                <Text style={styles.submitBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Light Theme Native PageSheet Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#FAF9F6' }}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 20 : 20, paddingBottom: 15 }]}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1E293B' }}>Edit Product</Text>
            <TouchableOpacity onPress={() => updateProductMutation.mutate(editForm)}>
              <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Submit</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            
            <Text style={[styles.label, { color: '#64748B' }]}>Barcode/ID</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#1E293B' }]} value={editForm.barcode} editable={false} />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Name</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.name} onChangeText={(v) => setEditForm({...editForm, name: v})} />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Category</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.category} onChangeText={(v) => setEditForm({...editForm, category: v})} />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Image URL</Text>
            <View style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Image source={{ uri: editForm.imageUrl || 'https://via.placeholder.com/40' }} style={{ width: 30, height: 30, borderRadius: 4 }} />
                <TextInput style={{ flex: 1, fontFamily: 'Inter_400Regular', color: '#1E293B' }} value={editForm.imageUrl} onChangeText={(v) => setEditForm({...editForm, imageUrl: v})} placeholder="https://..." />
              </View>
            </View>

            <Text style={[styles.label, { color: '#64748B' }]}>Current Stock</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.stock} onChangeText={(v) => setEditForm({...editForm, stock: v})} keyboardType="numeric" />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Retail Price (₹)</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.price} onChangeText={(v) => setEditForm({...editForm, price: v})} keyboardType="numeric" />
            
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.primary, marginTop: 10, marginBottom: 15 }}>ERP Pricing & Inventory Settings</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: '#64748B' }]}>Rate A (₹)</Text>
                <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]} value={editForm.rateA} onChangeText={(v) => setEditForm({...editForm, rateA: v})} keyboardType="numeric" placeholder="13.57" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: '#64748B' }]}>Rate B (₹)</Text>
                <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]} value={editForm.rateB} onChangeText={(v) => setEditForm({...editForm, rateB: v})} keyboardType="numeric" placeholder="12.95" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: '#64748B' }]}>Rate C (₹)</Text>
                <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]} value={editForm.rateC} onChangeText={(v) => setEditForm({...editForm, rateC: v})} keyboardType="numeric" placeholder="14.38" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: '#64748B' }]}>Min Qty</Text>
                <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]} value={editForm.minimumQty} onChangeText={(v) => setEditForm({...editForm, minimumQty: v})} keyboardType="numeric" placeholder="10" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: '#64748B' }]}>Reorder (Days)</Text>
                <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]} value={editForm.reorderDays} onChangeText={(v) => setEditForm({...editForm, reorderDays: v})} keyboardType="numeric" placeholder="0" />
              </View>
            </View>
            <Text style={[styles.label, { color: '#64748B' }]}>Supplier</Text>
{/* Selected Supplier Card if not searching */}
            {!isSupplierDropdownOpen && editForm.supplierId && (
              <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: Colors.primary, marginBottom: 12 }}>
                {(() => {
                  const s = suppliers?.find((sup: any) => sup.id === editForm.supplierId);
                  if (!s) return <Text>Selected Supplier</Text>;
                  return (
                    <>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: Colors.primary, fontSize: 15, marginBottom: 4 }}>
                        {s.businessName || s.name}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                        {s.city && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="location-outline" size={12} color="#64748B" /><Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.city}</Text></View>}
                        {s.contactPerson && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="person-outline" size={12} color="#64748B" /><Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.contactPerson}</Text></View>}
                        {s.gstin && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="document-text-outline" size={12} color="#64748B" /><Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>GST: {s.gstin}</Text></View>}
                      </View>
                      <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setIsSupplierDropdownOpen(true)}>
                        <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Change Supplier</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            )}

            {/* Search Input */}
            {(!editForm.supplierId || isSupplierDropdownOpen) && (
              <TextInput 
                style={[styles.input, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#1E293B', marginBottom: 12 }]} 
                placeholder="Search suppliers to tag..." 
                value={supplierSearch}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                onChangeText={(v) => { setSupplierSearch(v); setIsSupplierDropdownOpen(true); }}
              />
            )}

            {/* Active Dropdown List */}
            {isSupplierDropdownOpen && (
              <ScrollView nestedScrollEnabled={true} style={{ marginBottom: 20, maxHeight: 300 }}>
                 {((suppliers || []).filter((s: any) => {
                   const query = supplierSearch.toLowerCase();
                   return (s.businessName || '').toLowerCase().includes(query) || 
                          (s.name || '').toLowerCase().includes(query) ||
                          (s.city || '').toLowerCase().includes(query) ||
                          (s.gstin || '').toLowerCase().includes(query);
                 }).slice(0, 10)).map((s: any) => {
                   const isSelected = editForm.supplierId === s.id;
                   return (
                     <TouchableOpacity 
                       key={s.id} 
                       onPress={() => {
                         setEditForm({...editForm, supplierId: s.id});
                         setIsSupplierDropdownOpen(false);
                         setSupplierSearch(''); // Clear search after selection
                       }}
                       style={{ 
                         padding: 16, 
                         borderRadius: 12, 
                         backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF', 
                         borderWidth: 1,
                         borderColor: isSelected ? Colors.primary : '#E2E8F0',
                         marginBottom: 10 
                       }}
                     >
                       <Text style={{ fontFamily: 'Inter_600SemiBold', color: isSelected ? Colors.primary : '#1E293B', fontSize: 15, marginBottom: 4 }}>
                         {s.businessName || s.name}
                       </Text>
                       
                       <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                         {s.city && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                             <Ionicons name="location-outline" size={12} color="#64748B" />
                             <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.city}</Text>
                           </View>
                         )}
                         {s.contactPerson && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                             <Ionicons name="person-outline" size={12} color="#64748B" />
                             <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.contactPerson}</Text>
                           </View>
                         )}
                         {s.phone && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                             <Ionicons name="call-outline" size={12} color="#64748B" />
                             <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.phone}</Text>
                           </View>
                         )}
                         {s.gstin && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                             <Ionicons name="document-text-outline" size={12} color="#64748B" />
                             <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>GST: {s.gstin}</Text>
                           </View>
                         )}
                       </View>
                     </TouchableOpacity>
                   );
                 })}
              </ScrollView>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: { padding: 20 },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...Shadows.sm,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroImage: { width: '100%', height: '100%' },
  titleSection: { marginBottom: 20 },
  productTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productCategory: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {},
  actionText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  infoValueGreen: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  supplierCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supplierTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  supplierSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.primary,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txnType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  txnDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  txnQty: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  textGreen: { color: Colors.success },
  textRed: { color: Colors.danger },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  formContent: {},
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 14,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
