import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/customer/${CURRENT_CUSTOMER_ID}`);
      if (res.ok) {
        setSubscriptions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (id: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'ACTIVE' ? 'pause' : 'resume';
      const res = await fetch(`${API_BASE_URL}/subscriptions/${id}/${action}`, { method: 'PATCH' });
      if (res.ok) {
        fetchSubscriptions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : subscriptions.length > 0 ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {subscriptions.map((sub, index) => {
            const isActive = sub.status === 'ACTIVE';
            return (
              <Animated.View key={sub.id} entering={FadeInDown.delay(index * 100).springify()} style={[styles.card, !isActive && styles.cardInactive]}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.frequencyBadge, { backgroundColor: isActive ? Colors.primaryGhost : Colors.surfaceAlt }]}>
                      <Ionicons name={sub.frequency === 'DAILY' ? 'sunny' : sub.frequency === 'WEEKLY' ? 'calendar' : 'calendar-number'} size={14} color={isActive ? Colors.primary : Colors.textSecondary} />
                      <Text style={[styles.frequencyText, { color: isActive ? Colors.primary : Colors.textSecondary }]}>{sub.frequency}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.successLight : Colors.warningLight }]}>
                    <Text style={[styles.statusText, { color: isActive ? Colors.successDark : Colors.warningDark }]}>{sub.status}</Text>
                  </View>
                </View>

                <View style={styles.productRow}>
                  <Image source={{ uri: sub.product?.imageUrl || `https://placehold.co/100x100?text=${encodeURIComponent(sub.product?.name?.substring(0,3) || 'Item')}` }} style={styles.productImg} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{sub.product?.name}</Text>
                    <Text style={styles.productQty}>Quantity: {sub.quantity}</Text>
                    <Text style={styles.productPrice}>₹{(sub.quantity * sub.product?.sellingPrice).toFixed(2)} / delivery</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Next Delivery</Text>
                    <Text style={styles.scheduleValue}>
                      {sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionBtn, isActive ? styles.pauseBtn : styles.resumeBtn]}
                    onPress={() => toggleSubscription(sub.id, sub.status)}
                  >
                    <Ionicons name={isActive ? "pause" : "play"} size={16} color={isActive ? Colors.danger : Colors.success} />
                    <Text style={[styles.actionText, { color: isActive ? Colors.danger : Colors.success }]}>
                      {isActive ? 'Pause' : 'Resume'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Subscriptions</Text>
          <Text style={styles.emptyText}>Get your daily essentials like milk and bread delivered automatically.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
            <Text style={styles.shopBtnText}>Explore Products</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  cardInactive: { opacity: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  frequencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  frequencyText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  productImg: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  productQty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 2 },
  productPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },
  
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleInfo: {},
  scheduleLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 2 },
  scheduleValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  pauseBtn: { borderColor: Colors.dangerLight, backgroundColor: Colors.dangerLight + '20' },
  resumeBtn: { borderColor: Colors.successLight, backgroundColor: Colors.successLight + '20' },
  actionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 10 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full, ...Shadows.glow },
  shopBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
