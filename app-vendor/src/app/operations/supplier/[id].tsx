import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { API_BASE_URL } from '../../../constants/api';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function SupplierDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`);
      if (res.ok) {
        setSupplier(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontFamily: 'Inter_500Medium', color: Colors.textSecondary }}>Supplier not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {supplier.logoUrl ? (
              <Image source={{ uri: supplier.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="business" size={32} color={Colors.primary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.supplierName}>{supplier.name}</Text>
              <Text style={styles.supplierCategories}>{supplier.categories || 'General Supplies'}</Text>
              
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#D97706" />
                <Text style={styles.ratingText}>{supplier.rating || '4.5'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.contactText}>{supplier.contactPhone || 'N/A'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.contactText}>{supplier.contactEmail || 'N/A'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.contactText}>{supplier.address || 'Address not provided'}</Text>
          </View>
        </Animated.View>

        {/* Action Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.actionCard}>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTitle}>Need more stock?</Text>
            <Text style={styles.actionSub}>Draft a new Purchase Order now.</Text>
          </View>
          <TouchableOpacity 
            style={styles.draftBtn}
            onPress={() => router.push(`/operations/po/draft?supplierId=${supplier.id}`)}
          >
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={styles.draftBtnText}>Draft PO</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Catalog Preview */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Supplier Catalog</Text>
          {supplier.supplierProducts && supplier.supplierProducts.length > 0 ? (
            <View style={styles.catalogList}>
              {supplier.supplierProducts.map((sp: any) => (
                <View key={sp.id} style={styles.catalogItem}>
                  <View style={styles.catalogItemInfo}>
                    <Text style={styles.productName}>{sp.product?.name}</Text>
                    <Text style={styles.productSku}>SKU: {sp.product?.internalSku}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{sp.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCatalog}>
              <Ionicons name="cube-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyCatalogText}>No products found in this catalog.</Text>
            </View>
          )}
        </Animated.View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#FAF9F6', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  scrollContent: { padding: 20 },
  
  profileCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 20, ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logo: { width: 72, height: 72, borderRadius: Radius.lg },
  logoPlaceholder: { width: 72, height: 72, borderRadius: Radius.lg, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.primaryLight },
  profileInfo: { flex: 1, marginLeft: 16 },
  supplierName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  supplierCategories: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 8 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  ratingText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#D97706' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  contactText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, borderRadius: Radius.xl, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.primaryLight },
  actionTextContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primaryDark, marginBottom: 2 },
  actionSub: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.primary },
  draftBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.lg, gap: 8, ...Shadows.sm },
  draftBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  catalogList: { backgroundColor: '#fff', borderRadius: Radius.xl, ...Shadows.sm, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  catalogItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  catalogItemInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  productSku: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  productPrice: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  emptyCatalog: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: Radius.xl, borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyCatalogText: { marginTop: 12, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
});
