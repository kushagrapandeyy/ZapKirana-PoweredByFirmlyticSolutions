import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';

export default function POManagementScreen() {
  const { tenantId } = useAuth();
  const router = useRouter();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPOs();
    }, [])
  );

  const fetchPOs = async () => {
    try {
      const storeId = await AsyncStorage.getItem('@selected_store_id') || CURRENT_STORE_ID;
      const res = await fetch(`${API_BASE_URL}/purchase-orders/store/${storeId}`);
      if (res.ok) {
        setPos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (poId: string) => {
    try {
      setPrintingId(poId);
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/pdf`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch PO HTML');
      }

      const htmlContent = await res.text();
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Toast.show({ type: 'info', text1: 'Saved', text2: 'PDF saved to your device' });
      }
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'PDF Error', text2: 'Could not generate document' });
    } finally {
      setPrintingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return Colors.info;
      case 'SENT': return Colors.warning;
      case 'ACCEPTED': return Colors.primary;
      case 'DELIVERED': return Colors.success;
      case 'REJECTED': return Colors.danger;
      default: return Colors.textMuted;
    }
  };

  const renderPO = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(15)}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/operations/po/${item.id}`)}>
        <View style={styles.poCard}>
        <View style={styles.poHeader}>
          <View>
            <Text style={styles.poIdText}>PO #{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.poDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.poBody}>
          <View style={styles.supplierBox}>
            <Ionicons name="business" size={16} color={Colors.textSecondary} />
            <Text style={styles.supplierName}>{item.supplier?.name || 'Unknown Supplier'}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Value</Text>
            <Text style={styles.amountValue}>₹{item.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.poFooter}>
          <Text style={styles.itemsCount}>{item.items?.length || 0} items ordered</Text>
          
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => generatePDF(item.id)}
            disabled={printingId === item.id}
          >
            {printingId === item.id ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="document-text" size={14} color={Colors.primary} />
                <Text style={styles.actionBtnText}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Orders</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.pipelineBanner}>
          <View style={styles.pipelineStep}>
            <View style={[styles.pipelineDot, { backgroundColor: Colors.info }]} />
            <Text style={styles.pipelineText}>Drafts</Text>
            <Text style={styles.pipelineCount}>{pos.filter(p => p.status === 'CREATED').length}</Text>
          </View>
          <View style={styles.pipelineDivider} />
          <View style={styles.pipelineStep}>
            <View style={[styles.pipelineDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.pipelineText}>Sent</Text>
            <Text style={styles.pipelineCount}>{pos.filter(p => p.status === 'SENT').length}</Text>
          </View>
          <View style={styles.pipelineDivider} />
          <View style={styles.pipelineStep}>
            <View style={[styles.pipelineDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.pipelineText}>Received</Text>
            <Text style={styles.pipelineCount}>{pos.filter(p => p.status === 'DELIVERED').length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pos}
          keyExtractor={item => item.id}
          renderItem={renderPO}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No Purchase Orders</Text>
              <Text style={styles.emptySub}>Connect with a supplier to draft your first PO.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/operations/suppliers')}>
                <Text style={styles.emptyBtnText}>Browse Suppliers</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  list: { padding: 20, paddingBottom: 100 },
  
  poCard: { backgroundColor: '#fff', borderRadius: Radius.xl, marginBottom: 16, ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9' },
  poHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, backgroundColor: '#F8FAFC', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  poIdText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  poDate: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  
  poBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  supplierBox: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  supplierName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  amountBox: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
  amountValue: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  poFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  itemsCount: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, gap: 6 },
  actionBtnText: { color: Colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: Radius.full, ...Shadows.sm },
  emptyBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pipelineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: '#F8FAFC', padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F1F5F9' },
  pipelineStep: { flex: 1, alignItems: 'center' },
  pipelineDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  pipelineText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  pipelineCount: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  pipelineDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
});
