import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withSequence, Easing, withTiming } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../constants/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { width } = Dimensions.get('window');

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};


const normalizeProduct = (p: any) => {
  let finalImage = p.imageUrl || p.image;
  // Fallback for missing or invalid (html) image URLs
  if (!finalImage || finalImage.includes('bigbasket.com/pd/')) {
    finalImage = `https://placehold.co/300x300/f1f5f9/64748b?text=${encodeURIComponent(p.name?.substring(0, 6) || 'Item')}`;
  }

  return {
    id: p.id,
    name: p.name,
    price: p.sellingPrice || p.price,
    originalPrice: p.mrp || p.originalPrice,
    category: p.category || 'General',
    image: finalImage,
    description: p.description,
    subscriptionDiscount: p.subscriptionDiscount || 0,
    clearanceReason: p.clearanceReason,
    stockStatus: p.stockStatus
  };
};

const BANNERS = [
  { id: '1', title: 'Get 20% OFF', subtitle: 'On your first order up to ₹100!', bg: Colors.gradientPrimary, icon: 'gift-outline' },
  { id: '2', title: 'Free Delivery', subtitle: 'Priority Express within 1km', bg: Colors.gradientSuccess, icon: 'bicycle-outline' },
  { id: '3', title: 'Daily Essentials', subtitle: 'Subscribe & save 15%', bg: Colors.gradientSunrise, icon: 'repeat-outline' },
];

export default function HomeFeed() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartItemsCount } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [categories, setCategories] = useState([{ name: 'All', icon: 'grid-outline', original: 'All' }]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  const [clearanceProducts, setClearanceProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  // Cart badge animation
  const cartScale = useSharedValue(1);
  const cartBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  useEffect(() => {
    loadStoreAndProducts();
  }, []);

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadStoreAndProducts = async () => {
    try {
      const savedStoreId = await AsyncStorage.getItem('@selected_store_id');
      const currentStoreId = savedStoreId || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f';
      setStoreId(currentStoreId);

      const [productsRes, storeRes, clearanceRes, newRes, popularRes, campaignRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory/products?storeId=${currentStoreId}`),
        fetch(`${API_BASE_URL}/stores/${currentStoreId}`),
        fetch(`${API_BASE_URL}/inventory/clearance?storeId=${currentStoreId}`),
        fetch(`${API_BASE_URL}/inventory/new?storeId=${currentStoreId}`),
        fetch(`${API_BASE_URL}/catalog/personalized?storeId=${currentStoreId}`),
        fetch(`${API_BASE_URL}/campaigns?storeId=${currentStoreId}`)
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const mapped = data.map(normalizeProduct);
        setProducts(mapped);
        
        const uniqueCats = Array.from(new Set(mapped.map((p: any) => p.category))) as string[];
        const dynamicCats = [
          { name: 'All', icon: 'grid-outline', original: 'All' },
          ...uniqueCats.map(c => ({ name: toTitleCase(c), icon: 'pricetag-outline', original: c }))
        ];
        setCategories(dynamicCats);
      }

      if (clearanceRes.ok) {
        const data = await clearanceRes.json();
        setClearanceProducts(data.map(normalizeProduct));
      }

      if (popularRes.ok) {
        const popData = await popularRes.json(); setPopularProducts(popData.map(normalizeProduct));
      }

      if (newRes.ok) {
        const newData = await newRes.json(); setNewProducts(newData.map(normalizeProduct));
      }

      if (campaignRes.ok) {
        const campaigns = await campaignRes.json();
        if (campaigns.length > 0) setActiveCampaign(campaigns[0]);
      }

      if (storeRes.ok) {
        setStore(await storeRes.json());
      } else {
        await AsyncStorage.removeItem('@selected_store_id');
        router.push('/store-selector');
      }
    } catch (e) {
      console.error('Error fetching store data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStoreAndProducts();
  }, []);

  
  useEffect(() => {
    if (!storeId) return;
    
    const channel = supabase.channel(`store:${storeId}:inventory`)
      .on('broadcast', { event: 'inventory_update' }, (payload) => {
        const { productId, onHandQty, availableQty } = payload.payload;
        
        // Update products array
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, stockStatus: availableQty <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK' };
          }
          return p;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);


  const handleAddToCart = (product: any) => {
    const productWithStore = {
      ...product,
      storeId: storeId || 'unknown',
      storeName: store?.name || 'Local Store',
    };
    addToCart(productWithStore);
    cartScale.value = withSequence(
      withTiming(1.3, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) })
    );
  };

  const renderProductCard = (item: any, index: number, widthScale: number = 0.45) => {
    const cartItem = cart.find(c => c.product.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;

    return (
      <Animated.View 
        key={item.id} 
        entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(400).easing(Easing.out(Easing.cubic))}
        style={{ width: widthScale === 0.44 ? '48%' : width * widthScale, marginRight: widthScale === 0.44 ? 0 : 16, marginBottom: widthScale === 0.44 ? 16 : 0 }}
      >
        <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
          <View style={styles.productImageContainer}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            
            
            {item.stockStatus === 'OUT_OF_STOCK' && (
              <View style={[styles.subBadge, { backgroundColor: '#fee2e2', bottom: 30 }]}>
                <Text style={[styles.subBadgeText, { color: '#b91c1c' }]}>Out of Stock</Text>
              </View>
            )}

            {item.subscriptionDiscount > 0 && (
              <View style={styles.subBadge}>
                <Ionicons name="repeat" size={10} color="#1e40af" />
                <Text style={styles.subBadgeText}>Save {item.subscriptionDiscount}%</Text>
              </View>
            )}
          </View>

          <Text style={styles.productCategory}>{toTitleCase(item.category)}</Text>
          <Text style={styles.productName} numberOfLines={2}>{toTitleCase(item.name)}</Text>
          
          <View style={styles.productFooter}>
            <View>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={{ fontSize: 11, textDecorationLine: 'line-through', color: Colors.textMuted }}>₹{item.originalPrice}</Text>
              )}
            </View>
            {qty > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                  <Ionicons name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={(e) => { e.stopPropagation(); if (item.stockStatus !== 'OUT_OF_STOCK') handleAddToCart(item); }}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addBtn} 
                activeOpacity={0.7}
                onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const StickyHeader = () => (
    <View style={styles.stickyHeaderContainer}>
      {/* Top row: Location & Cart */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.locationRow} onPress={() => router.push('/address-manager')} activeOpacity={0.8}>
          <View style={styles.locationDot}>
            <Ionicons name="location" size={16} color={Colors.danger} />
          </View>
          <View>
            <Text style={styles.deliveryLabel}>Delivering to <Ionicons name="chevron-down" size={12} /></Text>
            <Text style={styles.storeName} numberOfLines={1}>{store?.name || 'Loading...'}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="bag-outline" size={24} color={Colors.textPrimary} />
          {cartItemsCount > 0 && (
            <Animated.View style={[styles.cartBadge, cartBadgeStyle]}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.9}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Search groceries, essentials...</Text>
      </TouchableOpacity>

      {/* Filters Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
        {categories.map((cat, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.categoryChip, idx === activeCategory && styles.categoryChipActive]}
            onPress={() => setActiveCategory(idx)}
          >
            <Ionicons name={cat.icon as any} size={16} color={idx === activeCategory ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.categoryText, idx === activeCategory && styles.categoryTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        stickyHeaderIndices={[0]} // STICKY MAGIC
      >
        <StickyHeader />

        {/* Dynamic Content */}
        {!loading && (
          <View style={styles.pageContent}>
            
            {/* Store Campaign Native Banner (Replaces static Banners if active) */}
            {activeCampaign ? (
              <Animated.View 
                entering={FadeInDown.springify().mass(1).damping(12).stiffness(100)} 
                style={styles.bannerContainer}
              >
                <View style={[styles.banner, { backgroundColor: activeCampaign.animationType === 'FLASH_SALE' ? Colors.danger : Colors.primary }]}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{activeCampaign.title}</Text>
                    <Text style={styles.bannerSubtitle}>Store Specific Deal! Get {activeCampaign.discountPercentage}% OFF on selected items.</Text>
                    <TouchableOpacity style={styles.bannerBtn}>
                      <Text style={styles.bannerBtnText}>Shop Now</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bannerIconCircle}>
                    <Ionicons name={activeCampaign.animationType === 'FLASH_SALE' ? 'flash' : 'megaphone'} size={40} color="rgba(255,255,255,0.9)" />
                  </View>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.delay(100).springify().damping(15)} style={styles.bannerContainer}>
                <View style={[styles.banner, { backgroundColor: BANNERS[bannerIndex].bg[0] }]}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{BANNERS[bannerIndex].title}</Text>
                    <Text style={styles.bannerSubtitle}>{BANNERS[bannerIndex].subtitle}</Text>
                    <TouchableOpacity style={styles.bannerBtn}>
                      <Text style={styles.bannerBtnText}>Shop Now</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bannerIconCircle}>
                    <Ionicons name={BANNERS[bannerIndex].icon as any} size={40} color="rgba(255,255,255,0.9)" />
                  </View>
                </View>
                <View style={styles.bannerDots}>
                  {BANNERS.map((_, i) => (
                    <View key={i} style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]} />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* If a category is selected, just show a grid for that category */}
            {activeCategory !== 0 ? (
              products.filter(p => p.category === categories[activeCategory].original).length > 0 ? (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.categoryGrid}>
                  <Text style={styles.sectionTitle}>{categories[activeCategory].name}</Text>
                  <View style={styles.gridWrapper}>
                    {products.filter(p => p.category === categories[activeCategory].original).map((p, i) => (
                      renderProductCard(p, i, 0.44) 
                    ))}
                  </View>
                </Animated.View>
              ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="basket-outline" size={48} color={Colors.textMuted} />
                  <Text style={{ marginTop: 16, fontFamily: 'Inter_500Medium', color: Colors.textSecondary }}>No products in this category.</Text>
                </View>
              )
            ) : (
              /* If 'All', show beautiful thematic carousels and Organic Zone */
              <Animated.View entering={FadeInDown.delay(150).springify().damping(15)}>
                
                {/* Expiring Soon / Clearance Zone */}
                {clearanceProducts.length > 0 && (
                  <View style={[styles.carouselSection, { backgroundColor: '#fef2f2', paddingVertical: 16, marginHorizontal: -20, paddingHorizontal: 20 }]}>
                    <View style={styles.carouselHeader}>
                      <View>
                        <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Clearance Sale 🚨</Text>
                        <Text style={{ fontSize: 12, color: Colors.danger, fontFamily: 'Inter_500Medium' }}>Expiring in 2-3 days. Big Discounts!</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.carouselContent, { paddingHorizontal: 0 }]}>
                      {clearanceProducts.map((p, i) => renderProductCard(p, i, 0.40))}
                    </ScrollView>
                  </View>
                )}

                {/* Thematic Carousel 1: Subscribe & Save */}
                {products.some(p => p.subscriptionDiscount > 0) && (
                  <View style={[styles.carouselSection, clearanceProducts.length > 0 && { marginTop: 16 }]}>
                    <View style={styles.carouselHeader}>
                      <Text style={styles.sectionTitle}>Subscribe & Save 🔁</Text>
                      <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                      {products.filter(p => p.subscriptionDiscount > 0).slice(0, 5).map((p, i) => renderProductCard(p, i, 0.40))}
                    </ScrollView>
                  </View>
                )}

                {/* New Arrivals */}
                {newProducts.length > 0 && (
                  <View style={styles.carouselSection}>
                    <View style={styles.carouselHeader}>
                      <Text style={styles.sectionTitle}>New Arrivals ✨</Text>
                      <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                      {newProducts.slice(0, 8).map((p, i) => renderProductCard(p, i, 0.40))}
                    </ScrollView>
                  </View>
                )}

                {/* Thematic Carousel 2: Bestsellers */}
                {popularProducts.length > 0 && (
                <View style={styles.carouselSection}>
                  <View style={styles.carouselHeader}>
                    <Text style={styles.sectionTitle}>Recommended For You 🎯</Text>
                    <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                    {popularProducts.map((p, i) => renderProductCard(p, i, 0.40))}
                  </ScrollView>
                </View>
                )}

                {/* SPECIAL ZONE: The Organic Zone */}
                <View style={styles.organicZone}>
                  <View style={styles.organicZoneHeader}>
                    <View>
                      <Text style={styles.organicTitle}>The Organic Zone 🌿</Text>
                      <Text style={styles.organicSubtitle}>Farm-fresh & pesticide-free</Text>
                    </View>
                    <TouchableOpacity style={styles.organicBtn}>
                      <Text style={styles.organicBtnText}>Explore</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.organicScroll}>
                    {/* Filter for organic or fallback to random 4 */}
                    {products.filter(p => p.name.toLowerCase().includes('organic') || p.category.toLowerCase().includes('fresh')).slice(0, 6).map((p, i) => 
                      renderProductCard(p, i, 0.40)
                    )}
                    {/* Fallback if no organic items */}
                    {products.filter(p => p.name.toLowerCase().includes('organic') || p.category.toLowerCase().includes('fresh')).length === 0 && 
                      products.slice(0, 4).map((p, i) => renderProductCard(p, i, 0.40))
                    }
                  </ScrollView>
                </View>

                {/* Thematic Carousel 3: Breakfast Essentials */}
                <View style={styles.carouselSection}>
                  <View style={styles.carouselHeader}>
                    <Text style={styles.sectionTitle}>Breakfast Essentials 🥞</Text>
                    <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                    {products.filter(p => p.category.toLowerCase().includes('dairy') || p.category.toLowerCase().includes('bakery')).slice(0, 5).map((p, i) => renderProductCard(p, i, 0.40))}
                    {products.filter(p => p.category.toLowerCase().includes('dairy') || p.category.toLowerCase().includes('bakery')).length === 0 && 
                      products.slice(4, 8).map((p, i) => renderProductCard(p, i, 0.40))
                    }
                  </ScrollView>
                </View>

                {/* All Products Grid */}
                <View style={[styles.categoryGrid, { marginTop: 20 }]}>
                  <Text style={styles.sectionTitle}>All Products</Text>
                  <View style={styles.gridWrapper}>
                    {products.map((p, i) => (
                      renderProductCard(p, i, 0.44) 
                    ))}
                  </View>
                </View>

              </Animated.View>
            )}
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  
  // Sticky Header
  stickyHeaderContainer: { backgroundColor: Colors.bg, paddingBottom: 8, zIndex: 100, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 16 },
  locationDot: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  deliveryLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: 'Inter_500Medium' },
  storeName: { fontSize: 16, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  cartBtn: { position: 'relative', width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.bg },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 14, borderRadius: Radius.lg, gap: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  searchPlaceholder: { fontSize: 15, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  
  // Filters Strip
  categoryScroll: { maxHeight: 44 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  categoryTextActive: { color: '#fff' },

  pageContent: { paddingTop: 16 },

  // Banner
  bannerContainer: { paddingHorizontal: 20, marginBottom: 24 },
  banner: { borderRadius: Radius['2xl'], padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...Shadows.md },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#fff', marginBottom: 4 },
  bannerSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.9)', marginBottom: 14 },
  bannerBtn: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  bannerBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bannerIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  bannerDotActive: { width: 20, backgroundColor: Colors.primary },

  // Carousels
  carouselSection: { marginBottom: 30 },
  carouselHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  seeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  carouselContent: { paddingHorizontal: 20 },

  categoryGrid: { paddingHorizontal: 20 },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },

  productCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 10, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  productImageContainer: { position: 'relative', marginBottom: 12 },
  productImage: { width: '100%', height: 130, borderRadius: Radius.lg, backgroundColor: Colors.surfaceAlt },
  gstBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gstBadgeText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  subBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, ...Shadows.sm },
  subBadgeText: { fontSize: 10, color: '#1e40af', fontFamily: 'Inter_700Bold' },
  productCategory: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  productName: { fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', marginBottom: 8, lineHeight: 18, height: 36 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  addBtnText: { color: Colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: Colors.primary },
  qtyText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primaryDark, paddingHorizontal: 8 },

  // Organic Zone
  organicZone: { backgroundColor: '#F0FDF4', marginHorizontal: 0, paddingVertical: 24, marginBottom: 30, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DCFCE7' },
  organicZoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  organicTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.successDark, marginBottom: 4 },
  organicSubtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.success },
  organicBtn: { backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  organicBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  organicScroll: { paddingHorizontal: 20 },
});
