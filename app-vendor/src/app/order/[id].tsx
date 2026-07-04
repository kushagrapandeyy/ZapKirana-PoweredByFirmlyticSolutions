import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, TextInput, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL, CURRENT_STAFF_ID } from '@/constants/api';
import Toast from 'react-native-toast-message';

const MINT_GREEN = '#10b981';
const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';
const ORANGE = '#f59e0b';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [mapModalVisible, setMapModalVisible] = useState(false);
  
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (action: 'pick' | 'deliver' | 'complete', otp?: string) => {
    try {
      const endpoint = `${API_BASE_URL}/orders/${id}/${action}`;
      const payload: any = { staffId: CURRENT_STAFF_ID };
      if (otp) payload.otp = otp;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: `Order ${action}ed successfully!` });
        if (action === 'complete') setOtpModalVisible(false);
        fetchOrder();
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: err.message || `Failed to ${action}` });
      }
    } catch(e) {
      Toast.show({ type: 'error', text1: 'Network error' });
    }
  };

  const handleCompleteRequest = () => {
    if (order?.requireOtp) {
      setOtpInput('');
      setOtpModalVisible(true);
    } else {
      handleAction('complete');
    }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: CURRENT_STAFF_ID, text: chatInput.trim() })
      });
      if (res.ok) {
        setChatInput('');
        fetchChatMessages();
      }
    } catch(e) {
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    }
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: '#64748b'}}>Loading Order Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.split('-')[0].toUpperCase()}</Text>
        <TouchableOpacity onPress={() => { setChatModalVisible(true); fetchChatMessages(); }}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color={ROYAL_BLUE} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 100}}>
        {/* Status Tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Status</Text>
          <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
          {order.status === 'OUT_FOR_DELIVERY' && (
            <TouchableOpacity style={styles.mapPromptBtn} onPress={() => {
              const lat = order.deliveryLat || 12.9750;
              const lng = order.deliveryLng || 77.5950;
              const label = encodeURIComponent(order.deliveryAddress || 'Delivery Address');
              const url = Platform.select({
                ios: `maps:0,0?q=${label}@${lat},${lng}`,
                android: `geo:0,0?q=${lat},${lng}(${label})`
              });
              if(url) Linking.openURL(url);
            }}>
              <Ionicons name="navigate" size={16} color={ROYAL_BLUE} />
              <Text style={styles.mapPromptText}>Open in Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color="#64748b" />
            <Text style={styles.detailText}>{order.customer?.name || 'Customer'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={20} color="#64748b" />
            <Text style={styles.detailText}>{order.customer?.phone || 'No Phone'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <Text style={styles.detailText}>{order.deliveryAddress || 'No Address Provided'}</Text>
          </View>
          {order.requireOtp && (
            <View style={styles.otpWarning}>
              <Ionicons name="lock-closed" size={16} color="#b45309" />
              <Text style={styles.otpWarningText}>Requires OTP to complete delivery.</Text>
            </View>
          )}
        </View>

        {/* Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items to Pick</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.qtyBadge}><Text style={styles.qtyText}>{item.quantity}</Text></View>
              <Text style={styles.itemName}>{item.product?.name || 'Unknown Product'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Footer Actions */}
      <View style={styles.footer}>
        {order.status === 'PAID' && (
          <TouchableOpacity style={[styles.actionBtn, styles.pickBtn]} onPress={() => handleAction('pick')}>
            <Ionicons name="scan-outline" size={20} color={WHITE} />
            <Text style={styles.actionBtnText}>Mark as Picked</Text>
          </TouchableOpacity>
        )}
        {order.status === 'READY_FOR_PICKUP' && (
          <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => handleAction('deliver')}>
            <Ionicons name="bicycle" size={20} color={WHITE} />
            <Text style={styles.actionBtnText}>Start Delivery</Text>
          </TouchableOpacity>
        )}
        {order.status === 'OUT_FOR_DELIVERY' && (
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={handleCompleteRequest}>
            <Ionicons name="checkmark-done" size={20} color={WHITE} />
            <Text style={styles.actionBtnText}>Complete Delivery</Text>
          </TouchableOpacity>
        )}
        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
          <View style={[styles.actionBtn, {backgroundColor: '#e2e8f0'}]}>
            <Text style={[styles.actionBtnText, {color: '#64748b'}]}>Order Closed</Text>
          </View>
        )}
      </View>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery OTP Required</Text>
            <Text style={styles.modalSub}>Ask the customer for the 4-digit code to complete this delivery.</Text>
            <TextInput 
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              value={otpInput}
              onChangeText={setOtpInput}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setOtpModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={() => handleAction('complete', otpInput)}>
                <Text style={styles.modalBtnConfirmText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={chatModalVisible} animationType="slide">
        <SafeAreaView style={styles.chatModalContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat with Customer</Text>
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.chatArea}>
            {chatMessages.map(msg => {
              const isMe = msg.senderId === CURRENT_STAFF_ID;
              return (
                <View key={msg.id} style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgThem]}>
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>{msg.text}</Text>
                  <Text style={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.chatInputArea}>
            <TextInput 
              style={styles.chatInput} 
              placeholder="Type a message..." 
              value={chatInput} 
              onChangeText={setChatInput}
            />
            <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={20} color={WHITE} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Mock Map Modal */}
      <Modal visible={mapModalVisible} animationType="slide">
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Tracker (Mock)</Text>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View style={styles.mockMapArea}>
             <Ionicons name="map" size={100} color="#cbd5e1" />
             <Text style={styles.mockMapText}>Interactive Map Placeholder</Text>
             <Text style={styles.mockMapSub}>Use React Native Maps SDK here in production.</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  content: { padding: 20 },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1e293b', marginBottom: 15 },
  statusText: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: ROYAL_BLUE },
  mapPromptBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, alignSelf: 'flex-start' },
  mapPromptText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: ROYAL_BLUE },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#334155', flex: 1 },
  otpWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 12, borderRadius: 10, marginTop: 10, gap: 8 },
  otpWarningText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#b45309' },

  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc', paddingBottom: 12 },
  qtyBadge: { backgroundColor: '#f1f5f9', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  qtyText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  itemName: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#334155', flex: 1 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: WHITE, padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0,height:-5}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  actionBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, gap: 10 },
  pickBtn: { backgroundColor: ROYAL_BLUE },
  deliverBtn: { backgroundColor: MINT_GREEN },
  completeBtn: { backgroundColor: '#10b981' },
  actionBtnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: WHITE, borderRadius: 16, padding: 25 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 10 },
  modalSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b', marginBottom: 20, lineHeight: 20 },
  otpInput: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 20, fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: 5, marginBottom: 25, color: '#0f172a' },
  modalActions: { flexDirection: 'row', gap: 15 },
  modalBtnCancel: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalBtnCancelText: { color: '#64748b', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  modalBtnConfirm: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: MINT_GREEN, alignItems: 'center' },
  modalBtnConfirmText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  chatModalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  chatTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  chatArea: { flex: 1, padding: 15 },
  msgBubble: { padding: 12, borderRadius: 16, maxWidth: '80%', marginBottom: 10 },
  msgMe: { backgroundColor: ROYAL_BLUE, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  msgThem: { backgroundColor: WHITE, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  msgText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  msgTextMe: { color: WHITE },
  msgTextThem: { color: '#334155' },
  msgTime: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#94a3b8', marginTop: 4, alignSelf: 'flex-end' },
  chatInputArea: { flexDirection: 'row', padding: 15, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center', gap: 10 },
  chatInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  chatSendBtn: { backgroundColor: ROYAL_BLUE, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  mapModalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  mapTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  mockMapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  mockMapText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#64748b', marginTop: 20 },
  mockMapSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#94a3b8', marginTop: 5 }
});
