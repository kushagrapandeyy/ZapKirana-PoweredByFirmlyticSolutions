import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, StatusBar, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

const { width } = Dimensions.get('window');
const MOCK_USER_LOCATION = { latitude: 12.9716, longitude: 77.5946 };

const FILTERS = ['Fastest Delivery', 'Top Rated', 'Offers', 'Groceries', 'Snacks', 'Fresh'];
const STORE_COVERS = [
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1604719312566-8fa20f1882ce?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1584308666744-24d5e4a77918?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=600'
];

export default function ExploreScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  useEffect(() => {
    findNearbyStores();
  }, []);

  const findNearbyStores = async () => {
    setLoading(true);
    try {
      const { latitude, longitude } = MOCK_USER_LOCATION;
      const res = await fetch(`${API_BASE_URL}/stores/nearby/search?lat=${latitude}&lng=${longitude}&radiusKm=10`);
      
      if (res.ok) {
        const data = await res.json();
        const apiStores = Array.isArray(data) ? data : [];
        setStores(apiStores);
        
        // Fetch top products for the first 5 stores to populate the UI (Zomato style)
        const topStores = apiStores.slice(0, 5);
        const productsMap: Record<string, any[]> = {};
        
        await Promise.all(topStores.map(async (store, index) => {
          try {
            const prodRes = await fetch(`${API_BASE_URL}/inventory/products?storeId=${store.id}`);
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              productsMap[store.id] = prodData.slice(0, 4); // Keep top 4
            }
          } catch (e) {
            // silent fail
          }
        }));
        setStoreProducts(productsMap);
      }
    } catch (err) {
      console.error('Failed to find nearby stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToStore = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const navigateToProduct = (productId: string, storeId: string) => {
    // We can just navigate to the store or if there's a product modal we can open it.
    // For now, navigating to the store is standard.
    router.push(`/store/${storeId}`);
  };

  const renderProductCard = (product: any, storeId: string) => (
    <TouchableOpacity 
      key={product.id} 
      style={styles.miniProductCard}
      onPress={() => navigateToProduct(product.id, storeId)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/150' }} style={styles.miniProductImage} />
      <View style={styles.miniProductInfo}>
        <Text style={styles.miniProductName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.miniProductPrice}>₹{product.sellingPrice}</Text>
      </View>
      <View style={styles.miniAddBtn}>
        <Ionicons name="add" size={14} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Dynamic Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.locationTitle}>Delivering to</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textPrimary} style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.locationSubtitle} numberOfLines={1}>Indiranagar, Bangalore</Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar}>
          <Ionicons name="person" size={20} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Zomato-style Welcome Banner */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Explore local kiranas.</Text>
          <Text style={styles.heroSubtitle}>Fresh groceries from your neighbors, delivered in minutes.</Text>
        </Animated.View>

        {/* Quick Filters */}
        <Animated.View entering={FadeIn.delay(200)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {FILTERS.map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Curating stores near you...</Text>
          </View>
        ) : (
          <View style={styles.storeList}>
            {stores.map((store, index) => {
              const coverImage = STORE_COVERS[index % STORE_COVERS.length];
              
              // Filter products based on active filter if it's not the default
              const allItems = storeProducts[store.id] || [];
              const featuredItems = activeFilter === FILTERS[0] || activeFilter === 'Fastest Delivery' 
                ? allItems
                : allItems.filter((p: any) => p.category === activeFilter);

              // If there's a filter selected and no products match, we can either hide the store 
              // or just not show products. For a feed, hiding the store makes sense if it doesn't match the filter category
              if (activeFilter !== 'Fastest Delivery' && activeFilter !== 'Top Rated' && activeFilter !== 'Offers' && featuredItems.length === 0) {
                return null;
              }

              return (
                <Animated.View key={store.id} entering={FadeInDown.delay(index * 150).springify()}>
                  <View style={styles.storeCard}>
                    {/* Store Cover Image */}
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigateToStore(store.id)}>
                      <Image source={{ uri: coverImage }} style={styles.storeCoverImage} />
                      <View style={styles.storeOverlay}>
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingText}>4.{Math.floor(Math.random() * 5) + 5}</Text>
                          <Ionicons name="star" size={10} color="#fff" />
                        </View>
                        <View style={styles.etaBadge}>
                          <Text style={styles.etaText}>{Math.floor(store.distanceKm * 5) + 10} min</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Store Info */}
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigateToStore(store.id)} style={styles.storeInfo}>
                      <View style={styles.storeHeaderRow}>
                        <Text style={styles.storeName}>{store.name}</Text>
                        <Ionicons name="arrow-forward-circle" size={24} color={Colors.primaryGhost} />
                      </View>
                      <Text style={styles.storeMetaText}>{store.distanceKm.toFixed(1)} km · Free Delivery</Text>
                    </TouchableOpacity>

                    {/* Featured Products Scroll (Zomato Style) */}
                    {featuredItems.length > 0 && (
                      <View style={styles.featuredSection}>
                        <Text style={styles.featuredTitle}>Top Sellers here</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
                          {featuredItems.map(p => renderProductCard(p, store.id))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
            
            <Animated.View entering={FadeIn.delay(500)} style={styles.expandingMessage}>
              <Ionicons name="rocket-outline" size={32} color={Colors.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.expandingTitle}>We are expanding rapidly!</Text>
              <Text style={styles.expandingText}>
                We're onboarding new local partners every day. Check back soon for more stores in your neighborhood.
              </Text>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20, 
    paddingBottom: 16,
    backgroundColor: Colors.bg
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  locationTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  locationSubtitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  
  scrollContent: { paddingBottom: 160 },
  
  heroSection: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  heroTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  heroSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  
  filtersScroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  filterTextActive: { color: Colors.surface },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  loadingText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  
  storeList: { paddingHorizontal: 16 },
  storeCard: { 
    backgroundColor: Colors.surface, 
    borderRadius: Radius.xl, 
    marginBottom: 24, 
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1, 
    borderColor: Colors.borderLight 
  },
  storeCoverImage: { width: '100%', height: 180, backgroundColor: Colors.surfaceAlt },
  storeOverlay: { 
    position: 'absolute', 
    top: 12, left: 12, right: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  ratingText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  etaBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  etaText: { color: Colors.textPrimary, fontSize: 12, fontFamily: 'Inter_700Bold' },
  
  storeInfo: { padding: 16 },
  storeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  storeName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, flex: 1 },
  storeMetaText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  featuredSection: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 16, paddingBottom: 20 },
  featuredTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  featuredScroll: { paddingHorizontal: 16, gap: 12 },
  
  miniProductCard: { width: 110, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  miniProductImage: { width: '100%', height: 90, backgroundColor: Colors.surfaceAlt },
  miniProductInfo: { padding: 8 },
  miniProductName: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, marginBottom: 4 },
  miniProductPrice: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  miniAddBtn: { position: 'absolute', bottom: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },

  expandingMessage: { alignItems: 'center', marginVertical: 32, padding: 32, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.xl, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border },
  expandingTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  expandingText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
