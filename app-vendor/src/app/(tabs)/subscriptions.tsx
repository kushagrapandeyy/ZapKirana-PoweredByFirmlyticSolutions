import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { useAuth } from '@/context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import { supabase } from '../../utils/supabase';

export default function SubscriptionsTracking() {
  const { tenantId } = useAuth();
  const actualStoreId = tenantId || CURRENT_STORE_ID;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      // Actually fetch bundled subscriptions from the backend
      const res = await fetch(`${API_BASE_URL}/subscriptions/store/${actualStoreId}`);
      if (res.ok) {
        const subs = await res.json();
        
        // Transform backend Subscriptions into Bundle Cards for the UI
        // We simulate bundle formatting based on the backend data.
        const formatted = subs.map((sub: any) => ({
          id: sub.id,
          customer: sub.customer?.name || 'Unknown Customer',
          bundleSize: sub.items?.length || 1,
          items: sub.items?.map((i: any) => i.productName).join(', ') || 'Various Items',
          nextDelivery: new Date(sub.nextDeliveryDate).toLocaleDateString() + ' ' + (sub.deliverySlot || 'Morning'),
          status: sub.status,
        }));
        
        setData(formatted);
      }
    } catch (e) {
      console.error('Failed to fetch subscriptions', e);
    } finally {
      setLoading(false);
    }
  }, [actualStoreId]);

  useEffect(() => {
    fetchSubscriptions();

    // Subscribe to real-time subscription bundle updates
    const channel = supabase.channel(`store:${actualStoreId}:subscriptions`)
      .on('broadcast', { event: 'subscription_update' }, (payload) => {
        console.log('Realtime subscription update received:', payload);
        fetchSubscriptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [actualStoreId, fetchSubscriptions]);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.customer.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{item.customer}</Text>
            <Text style={styles.deliveryTime}><Ionicons name="time-outline" size={12} /> {item.nextDelivery}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, item.status === 'PAUSED' && styles.statusBadgePaused]}>
          <Text style={[styles.statusText, item.status === 'PAUSED' && styles.statusTextPaused]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.bundleBox}>
          <Ionicons name="cube-outline" size={16} color={Colors.primary} />
          <Text style={styles.bundleText}>{item.bundleSize} Items Bundled</Text>
        </View>
        <Text style={styles.itemsText} numberOfLines={1}>{item.items}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Manage</Text>
        </TouchableOpacity>
        {item.status === 'ACTIVE' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
            <Text style={[styles.actionText, { color: '#fff' }]}>Fulfill Bundle</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscription Bundles</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="calendar-outline" size={48} color={Colors.border} />
              <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>No active subscriptions found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  filterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  list: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, marginBottom: 16, ...Shadows.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.primaryDark },
  customerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  deliveryTime: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.warningDark, marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.successLight },
  statusBadgePaused: { backgroundColor: Colors.borderLight },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.success, textTransform: 'uppercase' },
  statusTextPaused: { color: Colors.textMuted },
  
  cardBody: { backgroundColor: Colors.bg, padding: 12, borderRadius: Radius.md, gap: 8, marginBottom: 16 },
  bundleBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bundleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  itemsText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 40, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  actionBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary, borderWidth: 0 },
  actionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
});
