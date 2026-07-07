import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, CURRENT_STORE_ID, CURRENT_STAFF_ID } from '@/constants/api';
import { OfflineQueueService } from '@/services/OfflineQueueService';
import { Colors, Shadows, Radius, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 600;
const TILE_WIDTH = isTablet ? (width - Spacing['5xl']) / 4 : (width - Spacing['2xl'] - Spacing.md) / 2;

export default function POSScreen() {
  const [cart, setCart] = useState<any[]>([]);
  const [scanValue, setScanValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hidBuffer, setHidBuffer] = useState('');
  
  // State
  const [quickItems, setQuickItems] = useState<any[]>([]);
  const [activeRate, setActiveRate] = useState<'MRP' | 'SALE_A'>('MRP');
  
  // Modals
  const [showCartModal, setShowCartModal] = useState(false);
  const [holdBillModal, setHoldBillModal] = useState(false);
  const [holdBillName, setHoldBillName] = useState('');
  const [heldBills, setHeldBills] = useState<any[]>([]);

  const [zapCreditModal, setZapCreditModal] = useState(false);
  const [zapCustomerPhone, setZapCustomerPhone] = useState('');

  const lastKeystrokeTime = useRef<number>(0);
  const hidRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchQuickItems();
    loadHeldBills();
  }, []);

  const fetchQuickItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`);
      if (res.ok) {
        const data = await res.json();
        setQuickItems(data); // Display all available products
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadHeldBills = async () => {
    try {
      const saved = await AsyncStorage.getItem('@held_bills');
      if (saved) setHeldBills(JSON.parse(saved));
    } catch (e) {}
  };

  const saveHoldBill = async () => {
    if (cart.length === 0 || !holdBillName.trim()) return;
    const newHold = { id: Date.now().toString(), name: holdBillName, cart };
    const updated = [...heldBills, newHold];
    await AsyncStorage.setItem('@held_bills', JSON.stringify(updated));
    setHeldBills(updated);
    setCart([]);
    setHoldBillName('');
    setHoldBillModal(false);
    setShowCartModal(false);
  };

  const recallHoldBill = async (held: any) => {
    setCart(held.cart);
    const updated = heldBills.filter(h => h.id !== held.id);
    setHeldBills(updated);
    await AsyncStorage.setItem('@held_bills', JSON.stringify(updated));
  };
  
  const getPriceForRate = (product: any) => {
    if (activeRate === 'SALE_A') return product.saleRateA || product.sellingPrice;
    return product.mrp || product.sellingPrice;
  };

  const addItemToCart = useCallback((product: any) => {
    const price = getPriceForRate(product);
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price, qty: 1, isBox: false, baseUnit: product.unit, conversionToBase: product.conversionToBase || 1 }];
    });
  }, [activeRate]);

  const modifyQty = (idx: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      if (newCart[idx].qty + delta <= 0) {
        newCart.splice(idx, 1);
      } else {
        newCart[idx].qty += delta;
      }
      return newCart;
    });
  };

  const toggleUnit = (idx: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[idx];
      if (item.isBox) {
        item.isBox = false;
        item.price = item.price / item.conversionToBase;
      } else {
        item.isBox = true;
        item.price = item.price * item.conversionToBase;
      }
      return newCart;
    });
  };

  const lookupAndAddProduct = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/barcode/${barcode.trim()}?storeId=${CURRENT_STORE_ID}`);
      if (!res.ok) {
        alert(`Barcode not found.`);
        setScanValue('');
        return;
      }
      const product = await res.json();
      addItemToCart(product);
      setScanValue('');
    } catch {}
  }, [addItemToCart]);

  const handlePosScan = () => lookupAndAddProduct(scanValue);

  const handleHidInput = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastKeystrokeTime.current > 200) setHidBuffer(text);
    else setHidBuffer(prev => prev + text.slice(-1));
    lastKeystrokeTime.current = now;
  }, []);

  const handleHidSubmit = useCallback(() => {
    if (hidBuffer.length >= 8) lookupAndAddProduct(hidBuffer);
    setHidBuffer('');
    setTimeout(() => hidRef.current?.focus(), 50);
  }, [hidBuffer, lookupAndAddProduct]);

  const posTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const processZapCreditCheckout = async () => {
    if (!zapCustomerPhone.trim()) { alert('Enter phone'); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/pos/customer/by-phone/${zapCustomerPhone}`);
      if (!res.ok) { alert('Customer not found.'); return; }
      const customer = await res.json();
      setZapCreditModal(false);
      processCheckout('ZAPCREDIT', customer.id);
    } catch { alert('Error'); }
  };

  const processCheckout = async (method: string, customerId?: string) => {
    setIsProcessing(true);
    try {
      const billRes = await OfflineQueueService.apiFetch(`${API_BASE_URL}/pos/bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: CURRENT_STORE_ID, staffId: CURRENT_STAFF_ID })
      });
      const bill = await billRes.json();

      for (const item of cart) {
        const qtyToDeduct = item.isBox ? item.qty * item.conversionToBase : item.qty;
        await OfflineQueueService.apiFetch(`${API_BASE_URL}/pos/bill/${bill.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: item.id, quantity: qtyToDeduct })
        });
      }

      const checkoutRes = await OfflineQueueService.apiFetch(`${API_BASE_URL}/pos/bill/${bill.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentMethod: method === 'Cash' ? 'CASH' : (method === 'ZAPCREDIT' ? 'ZAPCREDIT' : 'UPI'), 
          amount: posTotal,
          customerId 
        })
      });

      if (checkoutRes.ok || checkoutRes.status === 202) {
        setCart([]);
        setZapCustomerPhone('');
        setShowCartModal(false);
      } else {
        alert('Checkout failed');
      }
    } catch { alert('Network error'); } 
    finally { setIsProcessing(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <View style={styles.headerActions}>
          <View style={styles.rateToggle}>
            <TouchableOpacity 
              style={[styles.rateTab, activeRate === 'MRP' && styles.rateTabActive]} 
              onPress={() => setActiveRate('MRP')}>
              <Text style={[styles.rateTabText, activeRate === 'MRP' && styles.rateTabTextActive]}>Retail</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.rateTab, activeRate === 'SALE_A' && styles.rateTabActive]} 
              onPress={() => setActiveRate('SALE_A')}>
              <Text style={[styles.rateTabText, activeRate === 'SALE_A' && styles.rateTabTextActive]}>Whsle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TextInput
        ref={hidRef}
        style={styles.hidInput}
        value={hidBuffer}
        onChangeText={handleHidInput}
        onSubmitEditing={handleHidSubmit}
        autoFocus={true}
        blurOnSubmit={false}
      />

      {/* Main Search & Grid Area */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.searchContainer}>
          <Ionicons name="barcode-outline" size={24} color={Colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Scan barcode or type..." 
            value={scanValue}
            onChangeText={setScanValue}
            onSubmitEditing={handlePosScan}
            returnKeyType="search"
          />
        </View>

        {heldBills.length > 0 && (
          <View style={styles.heldBillsContainer}>
            <Text style={styles.sectionHeader}>On Hold:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {heldBills.map((h, i) => (
                <TouchableOpacity key={i} style={styles.heldBillBtn} onPress={() => recallHoldBill(h)}>
                  <Ionicons name="play-outline" size={16} color={Colors.warningDark} />
                  <Text style={styles.heldBillText}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.gridContent}>
          <Text style={styles.sectionHeader}>Quick Products</Text>
          <View style={styles.grid}>
            {quickItems.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.productCard} onPress={() => addItemToCart(item)}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>₹{getPriceForRate(item)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCartModal(true)}>
          <View style={styles.fabLeft}>
            <View style={styles.fabBadge}><Text style={styles.fabBadgeText}>{totalItems}</Text></View>
            <Text style={styles.fabText}>View Cart</Text>
          </View>
          <Text style={styles.fabTotal}>₹{posTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* CART & CHECKOUT MODAL */}
      <Modal visible={showCartModal} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Current Cart</Text>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={() => setHoldBillModal(true)}>
                <Ionicons name="pause-circle" size={28} color={Colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCartModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.cartList}>
            {cart.map((item, idx) => (
              <View key={idx} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <TouchableOpacity style={styles.unitBtn} onPress={() => toggleUnit(idx)}>
                    <Text style={styles.unitBtnText}>{item.isBox ? 'BOX' : item.baseUnit}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.cartRight}>
                  <Text style={styles.cartItemPrice}>₹{(item.price * item.qty).toFixed(2)}</Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => modifyQty(idx, -1)}>
                      <Ionicons name="remove" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => modifyQty(idx, 1)}>
                      <Ionicons name="add" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.checkoutPanel}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payable</Text>
              <Text style={styles.summaryValue}>₹{posTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.paymentGrid}>
              <TouchableOpacity style={styles.payBtnCash} onPress={() => processCheckout('Cash')} disabled={isProcessing}>
                <Ionicons name="cash-outline" size={24} color={Colors.textOnPrimary} />
                <Text style={styles.payBtnText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.payBtnUpi} onPress={() => processCheckout('Card/UPI')} disabled={isProcessing}>
                <Ionicons name="qr-code-outline" size={24} color={Colors.infoDark} />
                <Text style={[styles.payBtnText, { color: Colors.infoDark }]}>UPI</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.payBtnZap} onPress={() => setZapCreditModal(true)} disabled={isProcessing}>
              <Ionicons name="book-outline" size={20} color={Colors.textOnAccent} />
              <Text style={styles.payBtnZapText}>ZapCredit Ledger</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* HOLD BILL MODAL */}
      <Modal visible={holdBillModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Hold Current Bill</Text>
            <TextInput 
              style={styles.dialogInput} 
              placeholder="Customer Name..." 
              value={holdBillName}
              onChangeText={setHoldBillName}
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setHoldBillModal(false)}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={saveHoldBill}>
                <Text style={styles.dialogConfirmText}>Hold Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ZAPCREDIT MODAL */}
      <Modal visible={zapCreditModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>ZapCredit Checkout</Text>
            <TextInput 
              style={styles.dialogInput} 
              placeholder="Customer Phone (e.g. 9876543210)" 
              keyboardType="phone-pad"
              value={zapCustomerPhone}
              onChangeText={setZapCustomerPhone}
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setZapCreditModal(false)}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogConfirm, { backgroundColor: Colors.warning }]} onPress={processZapCreditCheckout}>
                <Text style={[styles.dialogConfirmText, { color: Colors.textOnAccent }]}>Charge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  
  rateToggle: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, padding: 4 },
  rateTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  rateTabActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  rateTabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  rateTabTextActive: { color: Colors.textPrimary },

  hidInput: { position: 'absolute', opacity: 0, width: 1, height: 1, top: -999 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, paddingHorizontal: Spacing.lg, height: 50, borderRadius: Radius.lg, ...Shadows.sm, marginBottom: Spacing.md },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },

  sectionHeader: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  
  heldBillsContainer: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  heldBillBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.warning },
  heldBillText: { marginLeft: 4, fontWeight: '700', color: Colors.warningDark },

  gridContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  productCard: { width: TILE_WIDTH, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadows.sm, height: 90, justifyContent: 'space-between' },
  productName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  productPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary },

  fab: { position: 'absolute', bottom: Spacing.xl, left: Spacing.xl, right: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.xl, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, ...Shadows.lg },
  fabLeft: { flexDirection: 'row', alignItems: 'center' },
  fabBadge: { backgroundColor: Colors.surface, borderRadius: Radius.full, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  fabBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  fabText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
  fabTotal: { color: Colors.textOnPrimary, fontSize: 18, fontWeight: '800' },

  modalContainer: { flex: 1, backgroundColor: Colors.surfaceAlt },
  modalHeader: { padding: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  
  cartList: { flex: 1, padding: Spacing.xl },
  cartItem: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadows.sm },
  cartItemName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  unitBtn: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.md },
  unitBtnText: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  cartRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  cartItemPrice: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, padding: 4 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, ...Shadows.sm },
  qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: '700' },

  checkoutPanel: { backgroundColor: Colors.surface, padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  summaryLabel: { fontSize: 18, color: Colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 28, color: Colors.textPrimary, fontWeight: '800' },
  
  paymentGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  payBtnCash: { flex: 1, backgroundColor: Colors.primary, height: 56, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnUpi: { flex: 1, backgroundColor: Colors.infoLight, height: 56, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
  
  payBtnZap: { backgroundColor: Colors.accentLight, height: 56, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnZapText: { color: Colors.textOnAccent, fontSize: 16, fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Spacing.xl },
  dialog: { backgroundColor: Colors.surface, padding: Spacing.xl, borderRadius: Radius.xl, ...Shadows.lg },
  dialogTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.lg, color: Colors.textPrimary },
  dialogInput: { backgroundColor: Colors.surfaceAlt, height: 50, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, fontSize: 16, marginBottom: Spacing.xl },
  dialogActions: { flexDirection: 'row', gap: Spacing.md },
  dialogCancel: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg },
  dialogCancelText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  dialogConfirm: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.lg },
  dialogConfirmText: { fontSize: 16, fontWeight: '700', color: Colors.textOnPrimary },
});
