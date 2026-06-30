import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, TextInput } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, CURRENT_STORE_ID, CURRENT_STAFF_ID } from '@/constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';
const isTablet = Dimensions.get('window').width > 600;

export default function POSScreen() {
  const [cart, setCart] = useState<any[]>([]);
  const [scanValue, setScanValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { role } = useAuth();
  
  const handlePosScan = async () => {
    if (!scanValue) return;
    try {
      // Lookup product by barcode or SKU
      const res = await fetch(`${API_BASE_URL}/products/barcode/${scanValue}?storeId=${CURRENT_STORE_ID}`);
      if (!res.ok) {
        alert('Product not found in catalog');
        setScanValue('');
        return;
      }
      const product = await res.json();
      
      setCart(prev => {
        const existing = prev.find(i => i.id === product.id);
        if (existing) {
          return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, { id: product.id, name: product.name, price: product.sellingPrice, qty: 1 }];
      });
      setScanValue('');
    } catch(err) {
      alert('Error fetching product');
    }
  };

  const posTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = posTotal * 1.05; // 5% flat GST for demo

  const handleCheckout = async (method: string) => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      // 1. Create Draft Bill
      const billRes = await fetch(`${API_BASE_URL}/pos/bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: CURRENT_STORE_ID, staffId: CURRENT_STAFF_ID })
      });
      const bill = await billRes.json();

      // 2. Add Items
      for (const item of cart) {
        await fetch(`${API_BASE_URL}/pos/bill/${bill.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: item.id, quantity: item.qty })
        });
      }

      // 3. Checkout (Deducts stock via InventoryService!)
      const checkoutRes = await fetch(`${API_BASE_URL}/pos/bill/${bill.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentMethod: method === 'Cash' ? 'CASH' : 'UPI', 
          amount: finalTotal 
        })
      });

      if (checkoutRes.ok) {
        alert(`Paid ₹${finalTotal.toFixed(2)} via ${method}! Inventory deducted.`);
        setCart([]);
      } else {
        const err = await checkoutRes.json();
        alert(`Checkout failed: ${err.message}`);
      }
    } catch(err) {
      alert('Network error during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Point of Sale</Text>
      </View>

      <View style={isTablet ? styles.posTablet : styles.posMobile}>
        {/* Cart List */}
        <View style={styles.posLeft}>
          <View style={styles.scanInputArea}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Type barcode or scan..." 
              value={scanValue}
              onChangeText={setScanValue}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={handlePosScan}>
              <Text style={styles.scanBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cartList}>
            {cart.map((item, idx) => (
              <View key={idx} style={styles.cartItem}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>₹{item.price}</Text>
              </View>
            ))}
            {cart.length === 0 && <Text style={styles.emptyCart}>No items scanned</Text>}
          </ScrollView>
        </View>

        {/* Checkout Panel */}
        <View style={styles.posRight}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{posTotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (5%)</Text>
              <Text style={styles.summaryValue}>₹{(posTotal * 0.05).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.paymentMethods}>
            <TouchableOpacity style={styles.paymentBtn} onPress={() => handleCheckout('Card/UPI')}><Text style={styles.paymentBtnText}>💳 Card/UPI</Text></TouchableOpacity>
            <TouchableOpacity style={styles.paymentBtn} onPress={() => handleCheckout('Cash')}><Text style={styles.paymentBtnText}>💵 Cash</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 28, color: '#0f172a', fontFamily: 'PlayfairDisplay_700Bold' },
  posTablet: { flex: 1, flexDirection: 'row' },
  posMobile: { flex: 1, flexDirection: 'column' },
  posLeft: { flex: 2, backgroundColor: WHITE, borderRightWidth: isTablet ? 1 : 0, borderRightColor: '#e2e8f0' },
  scanInputArea: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 15, borderRadius: 8, fontSize: 16, marginRight: 10, fontFamily: 'Inter_400Regular' },
  scanBtn: { backgroundColor: ROYAL_BLUE, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  scanBtnText: { color: WHITE, fontFamily: 'Inter_700Bold' },
  cartList: { flex: 1, padding: 20 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  cartItemName: { fontSize: 16, color: '#1e293b', fontFamily: 'Inter_600SemiBold' },
  cartItemPrice: { fontSize: 16, color: ROYAL_BLUE, fontFamily: 'Inter_700Bold' },
  emptyCart: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 16, fontFamily: 'Inter_400Regular' },
  posRight: { flex: 1, backgroundColor: '#f8fafc', padding: 20, justifyContent: 'space-between' },
  summaryBox: { backgroundColor: WHITE, padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryTitle: { fontSize: 20, marginBottom: 20, color: '#1e293b', fontFamily: 'Inter_700Bold' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: '#64748b', fontFamily: 'Inter_400Regular' },
  summaryValue: { fontSize: 15, color: '#1e293b', fontFamily: 'Inter_600SemiBold' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 15, marginTop: 10 },
  summaryTotalLabel: { fontSize: 18, color: '#1e293b', fontFamily: 'Inter_700Bold' },
  summaryTotalValue: { fontSize: 22, color: ROYAL_BLUE, fontFamily: 'Inter_700Bold' },
  paymentMethods: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  paymentBtn: { flex: 1, backgroundColor: WHITE, padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  paymentBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  checkoutBtn: { backgroundColor: ROYAL_BLUE, padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 60 }, // padding bottom for tab bar
  checkoutBtnText: { color: WHITE, fontSize: 18, fontFamily: 'Inter_700Bold' },
});
