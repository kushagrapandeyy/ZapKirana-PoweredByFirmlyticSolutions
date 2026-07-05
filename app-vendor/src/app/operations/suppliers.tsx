import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SuppliersScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers`);
      if (res.ok) {
        setSuppliers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderSupplier = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(15)}>
      <View style={styles.supplierCard}>
        <View style={styles.cardHeader}>
          <View style={styles.logoContainer}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <Ionicons name="business" size={28} color={Colors.primary} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.supplierName}>{item.name}</Text>
            <Text style={styles.supplierCategories}>{item.categories || 'General Supplies'}</Text>
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="call" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.address || 'Address not provided'}</Text>
          </View>
          
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Credit Terms</Text>
              <Text style={styles.metricValue}>{item.creditTerms || '0 Days'}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Rating</Text>
              <Text style={styles.metricValue}>{item.rating || '4.5'} <Ionicons name="star" size={12} color="#D97706" /></Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Active POs</Text>
              <Text style={[styles.metricValue, { color: Colors.primary }]}>{item.activePos || 0}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.cardFooter} activeOpacity={0.8} onPress={() => router.push(`/operations/supplier/${item.id}`)}>
          <Text style={styles.footerBtnText}>View Catalog</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={item => item.id}
          renderItem={renderSupplier}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No Suppliers Found</Text>
              <Text style={styles.emptySub}>Add your first supplier to start creating Purchase Orders.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  supplierCard: { backgroundColor: '#fff', borderRadius: Radius.xl, marginBottom: 20, ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  logo: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' },
  headerInfo: { flex: 1 },
  supplierName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  supplierCategories: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  contactBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  infoText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 8 },
  metricItem: { alignItems: 'center' },
  metricLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  cardFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 6 },
  footerBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
