import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../../constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';
const GREEN = '#10b981';

export default function DeliveryDashboard() {
  const { tenantId, phone } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [otpInput, setOtpInput] = useState('');

  const fetchOrders = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders?storeId=${tenantId}`);
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch orders');
      
      if (Array.isArray(data)) {
        // Filter orders relevant to delivery
        const relevant = data.filter((o: any) => o.status === 'PACKED' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED');
        setOrders(relevant);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [tenantId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      Toast.show({ type: 'success', text1: `Order marked as ${newStatus}` });
      fetchOrders();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleCompleteDelivery = (order: any) => {
    if (order.requireOtp) {
      setSelectedOrder(order);
      setOtpInput('');
      setShowOtpModal(true);
    } else {
      updateOrderStatus(order.id, 'DELIVERED');
    }
  };

  const submitOtp = () => {
    if (otpInput.length < 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'Please enter a valid 4-digit PIN.' });
      return;
    }
    setShowOtpModal(false);
    // Dummy check: In a real app we verify this against the backend generated PIN
    updateOrderStatus(selectedOrder.id, 'DELIVERED');
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={ROYAL_BLUE} /></View>;
  }

  const activeOrders = orders.filter(o => o.status === 'OUT_FOR_DELIVERY');
  const availableOrders = orders.filter(o => o.status === 'PACKED');
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Hub</Text>
        <Text style={styles.subtitle}>Driver: {phone}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Active Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Deliveries ({activeOrders.length})</Text>
          {activeOrders.length === 0 ? (
            <Text style={styles.emptyText}>You have no active deliveries.</Text>
          ) : (
            activeOrders.map(order => (
              <View key={order.id} style={[styles.card, { borderColor: ROYAL_BLUE, borderWidth: 1 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                  <View style={styles.badgeActive}><Text style={styles.badgeTextActive}>On Route</Text></View>
                </View>
                <Text style={styles.addressTitle}>Deliver To:</Text>
                <Text style={styles.address}>{order.deliveryAddress || 'Address not provided'}</Text>
                
                {order.requireOtp && (
                  <View style={styles.otpWarning}>
                    <Ionicons name="key" size={16} color="#d97706" />
                    <Text style={styles.otpWarningText}>OTP Required from Customer</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.completeBtn} onPress={() => handleCompleteDelivery(order)}>
                  <Ionicons name="checkmark-circle" size={20} color={WHITE} />
                  <Text style={styles.completeBtnText}>Complete Delivery</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Available to Pickup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ready for Pickup ({availableOrders.length})</Text>
          {availableOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders currently packed and ready.</Text>
          ) : (
            availableOrders.map(order => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                  <View style={styles.badgePending}><Text style={styles.badgeTextPending}>Packed</Text></View>
                </View>
                <Text style={styles.addressTitle}>Deliver To:</Text>
                <Text style={styles.address}>{order.deliveryAddress || 'Address not provided'}</Text>
                
                <TouchableOpacity style={styles.pickupBtn} onPress={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}>
                  <Ionicons name="bicycle" size={20} color={WHITE} />
                  <Text style={styles.pickupBtnText}>Assign & Start Route</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Completed History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Today</Text>
          {completedOrders.length === 0 ? (
            <Text style={styles.emptyText}>You haven't completed any deliveries yet.</Text>
          ) : (
            completedOrders.map(order => (
              <View key={order.id} style={styles.historyCard}>
                <View>
                  <Text style={styles.historyId}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                  <Text style={styles.historyTime}>Delivered to {order.deliveryAddress}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={GREEN} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Delivery PIN</Text>
            <Text style={styles.modalDesc}>Ask the customer for the 4-digit PIN to confirm delivery.</Text>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0 0 0 0"
              value={otpInput}
              onChangeText={setOtpInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowOtpModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitOtp}>
                <Text style={styles.submitBtnText}>Verify & Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#0f172a' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#64748b', marginTop: 4 },
  scroll: { flex: 1 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1e293b', marginBottom: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#94a3b8' },
  
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  badgeActive: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextActive: { color: ROYAL_BLUE, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  badgePending: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextPending: { color: '#d97706', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  
  addressTitle: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748b', marginBottom: 4 },
  address: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1e293b', marginBottom: 16, lineHeight: 20 },
  
  otpWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', padding: 10, borderRadius: 8, marginBottom: 16, gap: 8 },
  otpWarningText: { color: '#d97706', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  pickupBtn: { backgroundColor: '#1e293b', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickupBtnText: { color: WHITE, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  completeBtn: { backgroundColor: GREEN, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  completeBtnText: { color: WHITE, fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // OTP Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: WHITE, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 8 },
  modalDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b', marginBottom: 20 },
  otpInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center', padding: 16, marginBottom: 24, letterSpacing: 8 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#64748b' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE },

  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  statBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center', minWidth: 80 },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748b' },
  
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  historyId: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 2 },
  historyTime: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748b', maxWidth: 250 },
});
