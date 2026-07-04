import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5';

export default function SubscriptionsHub() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions?customerId=${CURRENT_CUSTOMER_ID}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (e) {
      console.error('Failed to fetch subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string, isPaused: boolean) => {
    const endpoint = isPaused ? 'resume' : 'pause';
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/subscriptions/${id}/${endpoint}`, { method: 'PATCH' });
      await fetchSubscriptions();
    } catch (e) {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && subscriptions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="repeat" size={60} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Subscriptions Yet</Text>
            <Text style={styles.emptyDesc}>Subscribe to everyday essentials like milk, bread, and eggs to get them delivered automatically.</Text>
          </View>
        ) : (
          subscriptions.map(sub => (
            <View key={sub.id} style={styles.subCard}>
              <View style={styles.subHeader}>
                <Text style={styles.subStore}>{sub.store?.name || 'Store'}</Text>
                <View style={[styles.statusBadge, sub.status === 'PAUSED' && styles.statusBadgePaused]}>
                  <Text style={[styles.statusText, sub.status === 'PAUSED' && styles.statusTextPaused]}>
                    {sub.status}
                  </Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                {sub.items.map((item: any, idx: number) => (
                  <Text key={idx} style={styles.itemName}>• {item.productName} (Qty: {item.quantity})</Text>
                ))}
              </View>

              <View style={styles.subDetails}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>{sub.frequency}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Next Delivery</Text>
                  <Text style={styles.detailValue}>{formatDate(sub.nextDeliveryDate)}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, sub.status === 'PAUSED' && styles.actionBtnResume]}
                  onPress={() => handlePause(sub.id, sub.status === 'PAUSED')}
                >
                  <Text style={[styles.actionBtnText, sub.status === 'PAUSED' && styles.actionBtnTextResume]}>
                    {sub.status === 'PAUSED' ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  headerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  content: { padding: 16 },
  
  subCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subStore: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusBadgePaused: { backgroundColor: '#fef08a' },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.success },
  statusTextPaused: { color: Colors.warning },
  
  itemRow: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 },
  
  subDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 4 },
  detailValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight },
  actionBtnResume: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  actionBtnTextResume: { color: '#fff' },
  
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
