import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers`); // Using global suppliers for now
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
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View style={styles.supplierCard}>
        <View style={styles.cardHeader}>
          <View style={styles.logoContainer}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <Ionicons name="business" size={24} color={Colors.primary} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.supplierName}>{item.name}</Text>
            <Text style={styles.supplierCategories}>{item.categories || 'General Supplies'}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={20} color={Colors.success} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>{item.contactEmail || 'No email provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.address || 'Address not listed'}</Text>
          </View>
          {item.paymentTerms && (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.infoText}>Terms: {item.paymentTerms}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item._count?.purchaseOrders || 0}</Text>
            <Text style={styles.metricLabel}>Total POs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item._count?.supplierProducts || 0}</Text>
            <Text style={styles.metricLabel}>Products</Text>
          </View>
          <TouchableOpacity style={styles.catalogBtn}>
            <Text style={styles.catalogBtnText}>View Catalog</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Suppliers</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={suppliers}
          renderItem={renderSupplier}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  headerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  list: { padding: 20, gap: 16, paddingBottom: 40 },
  supplierCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logo: { width: '100%', height: '100%', borderRadius: 24 },
  headerInfo: { flex: 1 },
  supplierName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 2 },
  supplierCategories: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, justifyContent: 'center', alignItems: 'center' },
  
  cardBody: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  metricLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  divider: { width: 1, height: 24, backgroundColor: Colors.borderLight },
  catalogBtn: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 8, backgroundColor: Colors.primaryGhost, borderRadius: Radius.full, marginLeft: 16 },
  catalogBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
