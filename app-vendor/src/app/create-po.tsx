import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

export default function CreatePO() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, { qty: number, price: number }>>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storeId = await AsyncStorage.getItem('@vendor_store_id') || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f';
      
      const [suppRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/suppliers`), // Using admin endpoint for now or specific store supplier endpoint
        fetch(`${API_BASE_URL}/inventory/products?storeId=${storeId}`)
      ]);

      if (suppRes.ok && prodRes.ok) {
        setSuppliers(await suppRes.json());
        setProducts(await prodRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (productId: string, qty: string, defaultPrice: number) => {
    const numQty = parseInt(qty, 10);
    if (isNaN(numQty) || numQty <= 0) {
      const newItems = { ...selectedItems };
      delete newItems[productId];
      setSelectedItems(newItems);
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [productId]: { qty: numQty, price: prev[productId]?.price || defaultPrice }
      }));
    }
  };

  const handlePriceChange = (productId: string, price: string, defaultQty: number) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) return;
    
    setSelectedItems(prev => ({
      ...prev,
      [productId]: { qty: prev[productId]?.qty || defaultQty, price: numPrice }
    }));
  };

  const submitPO = async () => {
    if (!selectedSupplierId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a supplier' });
      return;
    }
    
    const items = Object.keys(selectedItems).map(id => ({
      productId: id,
      quantity: selectedItems[id].qty,
      purchasePrice: selectedItems[id].price
    }));

    if (items.length === 0) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Add at least one item' });
      return;
    }

    setIsSubmitting(true);
    try {
      const storeId = await AsyncStorage.getItem('@vendor_store_id') || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f';
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 2); // default 2 days delivery

      const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          supplierId: selectedSupplierId,
          expectedDeliveryDate: expectedDate.toISOString(),
          items,
          notes
        })
      });

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'PO Created', text2: 'Purchase order generated successfully' });
        router.back();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create PO' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Could not connect to server' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = Object.values(selectedItems).reduce((acc, item) => acc + (item.qty * item.price), 0);
  const itemCount = Object.keys(selectedItems).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create PO</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Supplier Selection */}
        <Animated.View entering={FadeInDown} style={styles.section}>
          <Text style={styles.sectionTitle}>Select Supplier</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {suppliers.map(sup => (
              <TouchableOpacity 
                key={sup.id}
                style={[styles.supplierChip, selectedSupplierId === sup.id && styles.supplierChipActive]}
                onPress={() => setSelectedSupplierId(sup.id)}
              >
                <Ionicons name="business" size={16} color={selectedSupplierId === sup.id ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.supplierName, selectedSupplierId === sup.id && styles.supplierNameActive]}>{sup.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Product Selection */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Items</Text>
            <Text style={styles.itemCountText}>{itemCount} selected</Text>
          </View>
          
          <View style={styles.productsContainer}>
            {products.map((p, idx) => {
              const isSelected = !!selectedItems[p.id];
              return (
                <View key={p.id} style={[styles.productRow, isSelected && styles.productRowSelected]}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.stockLevel}>Current Stock: {p.stockLevel}</Text>
                  </View>
                  
                  <View style={styles.inputControls}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Qty</Text>
                      <TextInput 
                        style={styles.numberInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        value={selectedItems[p.id]?.qty?.toString() || ''}
                        onChangeText={(t) => handleQtyChange(p.id, t, p.sellingPrice * 0.7)} // default cost is 70% of selling price
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Cost (₹)</Text>
                      <TextInput 
                        style={styles.numberInput}
                        keyboardType="decimal-pad"
                        placeholder={(p.sellingPrice * 0.7).toFixed(2)}
                        value={selectedItems[p.id]?.price?.toString() || ''}
                        onChangeText={(t) => handlePriceChange(p.id, t, 10)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            placeholder="Delivery instructions, quality requirements..."
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </Animated.View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.submitBtn, (itemCount === 0 || isSubmitting) && styles.submitBtnDisabled]}
          onPress={submitPO}
          disabled={itemCount === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Create PO</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 24 },
  
  section: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  itemCountText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  
  supplierChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 10 },
  supplierChipActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  supplierName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  supplierNameActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  
  productsContainer: { backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm, overflow: 'hidden' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  productRowSelected: { backgroundColor: Colors.primaryGhost + '30' },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  stockLevel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  
  inputControls: { flexDirection: 'row', gap: 8 },
  inputWrapper: { width: 60 },
  inputLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 2, textAlign: 'center' },
  numberInput: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 8, fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', color: Colors.textPrimary },
  
  notesInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 16, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, minHeight: 100 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md },
  footerInfo: {},
  totalLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 2 },
  totalValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  submitBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full, ...Shadows.glow },
  submitBtnDisabled: { backgroundColor: Colors.border, shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
