import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../constants/api';
const API_URL = 'https://kwick.com';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

export default function PODashboard() {
  const router = useRouter();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPOs = async () => {
    try {
      const storeId = CURRENT_STORE_ID; // Bypass AsyncStorage cache for testing
      const res = await fetch(`${API_BASE_URL}/purchase-orders/store/${storeId}`);
      if (res.ok) {
        setPos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPOs();
  }, []);

  const sharePOLink = async (po: any) => {
    try {
      const shareUrl = `${API_URL}/supplier-portal/po/${po.shareToken}`;
      await Share.share({
        message: `Purchase Order from Kwick Local Store.\n\nPlease review and fulfill PO #${po.id.substring(0,8).toUpperCase()}.\n\nSecure Link: ${shareUrl}`,
        title: `Purchase Order ${po.id.substring(0,8).toUpperCase()}`
      });
      
      // Update status to SENT if it was CREATED
      if (po.status === 'CREATED') {
        await fetch(`${API_BASE_URL}/purchase-orders/${po.id}/send`, { method: 'PATCH' });
        fetchPOs();
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Share Failed' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return Colors.textMuted;
      case 'SENT': return Colors.primary;
      case 'ACCEPTED': return Colors.success;
      case 'PARTIAL_RECEIVED': return Colors.warning;
      case 'COMPLETED': return Colors.successDark;
      case 'CANCELLED': return Colors.danger;
      default: return Colors.textSecondary;
    }
  };

  const renderPO = ({ item, index }: { item: any; index: number }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity 
          style={styles.poCard} 
          activeOpacity={0.9}
          onPress={() => router.push(`/po/${item.id}` as any)} // Detail view + GRN
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.poId}>PO #{item.id.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          
          <View style={styles.supplierRow}>
            <Ionicons name="business" size={16} color={Colors.textMuted} />
            <Text style={styles.supplierName}>{item.supplier.name}</Text>
          </View>
          
          <View style={styles.cardBody}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Items</Text>
              <Text style={styles.infoValue}>{item.items.length}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Total Value</Text>
              <Text style={styles.infoValue}>₹{item.totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Expected By</Text>
              <Text style={styles.infoValue}>
                {item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.actionBtnOutline} onPress={() => {/* View PDF logic */}}>
              <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionBtnTextOutline}>View PDF</Text>
            </TouchableOpacity>
            
            {['CREATED', 'SENT'].includes(item.status) && (
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => sharePOLink(item)}>
                <Ionicons name="share-social-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnTextPrimary}>{item.status === 'CREATED' ? 'Send to Supplier' : 'Resend'}</Text>
              </TouchableOpacity>
            )}

            {['ACCEPTED', 'PARTIAL_RECEIVED'].includes(item.status) && (
              <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: Colors.success }]} onPress={() => router.push(`/po/${item.id}/grn` as any)}>
                <Ionicons name="cube-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnTextPrimary}>Receive Goods</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Orders</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-po')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>New PO</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : pos.length === 0 ? (
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>No Purchase Orders</Text>
          <Text style={styles.emptyText}>Create a new purchase order to restock inventory from your suppliers.</Text>
          <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/create-po')}>
            <Text style={styles.emptyActionText}>Create First PO</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={pos}
          renderItem={renderPO}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
  createBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyActionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },
  emptyActionText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  
  list: { padding: 20, gap: 16, paddingBottom: 40 },
  poCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  poId: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 2 },
  dateText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  supplierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  supplierName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surfaceAlt, padding: 12, borderRadius: Radius.md, marginBottom: 16 },
  infoCol: {},
  infoLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  actionBtnTextOutline: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  actionBtnTextPrimary: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
