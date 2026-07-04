import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function DraftPOScreen() {
  const { supplierId } = useLocalSearchParams();
  const router = useRouter();
  
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSupplierDetails();
    // Default expected date to tomorrow
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    setExpectedDate(tmr.toISOString().split('T')[0]);
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers/${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setSupplier(data);
        
        // Initialize draft items from catalog
        if (data.supplierProducts) {
          setDraftItems(data.supplierProducts.map((sp: any) => ({
            ...sp,
            orderQuantity: 0
          })));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setDraftItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = Math.max(0, item.orderQuantity + delta);
        return { ...item, orderQuantity: newQ };
      }
      return item;
    }));
  };

  const submitPO = async () => {
    const itemsToOrder = draftItems.filter(i => i.orderQuantity > 0);
    if (itemsToOrder.length === 0) {
      Toast.show({ type: 'error', text1: 'No items selected', text2: 'Please add at least one item to the PO.' });
      return;
    }

    setSubmitting(true);
    try {
      const storeId = await AsyncStorage.getItem('@selected_store_id') || CURRENT_STORE_ID;
      
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
        Toast.show({ type: 'success', text1: 'PO Created Successfully' });
        router.replace('/operations/po');
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

        <Text style={styles.sectionTitle}>Select Items</Text>
        
        {draftItems.map(item => (
          <View key={item.id} style={[styles.itemCard, item.orderQuantity > 0 && styles.itemCardActive]}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price.toFixed(2)} / unit</Text>
            </View>
            
            <View style={styles.qtyController}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, -1)}>
                <Ionicons name="remove" size={16} color={Colors.primaryDark} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.orderQuantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, 1)}>
                <Ionicons name="add" size={16} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer sticky */}
      <View style={styles.footer}>
        <View style={styles.summaryBox}>
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
            <Text style={styles.submitBtnText}>Create PO</Text>
          )}
        </TouchableOpacity>
      </View>
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
  
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', ...Shadows.sm },
  itemCardActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryGhost },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.primaryDark },
  
  qtyController: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: Radius.full, borderWidth: 1, borderColor: '#E2E8F0' },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { width: 32, textAlign: 'center', fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', ...Shadows.md },
  summaryBox: {},
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  submitBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, ...Shadows.sm },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
