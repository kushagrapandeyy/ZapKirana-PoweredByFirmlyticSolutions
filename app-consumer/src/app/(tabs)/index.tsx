import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, FlatList, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

const { width } = Dimensions.get('window');

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

const DEFAULT_CATEGORIES = [
  { name: 'All', icon: 'grid-outline' }
];

const getIconForCategory = (catName: string) => {
  const name = catName.toLowerCase();
  if (name.includes('dairy') || name.includes('milk')) return 'water-outline';
  if (name.includes('snack') || name.includes('food')) return 'fast-food-outline';
  if (name.includes('beverage') || name.includes('drink')) return 'beer-outline';
  if (name.includes('clean') || name.includes('hygiene')) return 'sparkles-outline';
  if (name.includes('care') || name.includes('health')) return 'body-outline';
  if (name.includes('staple') || name.includes('grocery')) return 'basket-outline';
  if (name.includes('bakery')) return 'cafe-outline';
  return 'pricetag-outline';
};

const BANNERS = [
  { id: '1', title: 'Get 30% OFF', subtitle: 'On your first order!', bg: Colors.gradientPrimary, icon: 'gift-outline' },
  { id: '2', title: 'Free Delivery', subtitle: 'Orders above ₹199', bg: Colors.gradientSuccess, icon: 'bicycle-outline' },
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
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

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

      const [productsRes, storeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory/products?storeId=${currentStoreId}`),
        fetch(`${API_BASE_URL}/stores/${currentStoreId}`),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.sellingPrice,
          category: p.category || 'General',
          image: p.imageUrl || `https://placehold.co/300x300/f1f5f9/64748b?text=${encodeURIComponent(p.name?.substring(0, 6) || 'Item')}`,
          description: p.description,
          gstClass: p.gstClass || 'EXEMPT',
          subscriptionDiscount: p.subscriptionDiscount || 0,
        }));
        setProducts(mapped);
        
        // Dynamically build categories from products
        const uniqueCats = Array.from(new Set(mapped.map((p: any) => p.category))) as string[];
        const dynamicCats = [
          { name: 'All', icon: 'grid-outline' },
          ...uniqueCats.map(c => ({ name: toTitleCase(c), icon: getIconForCategory(c) }))
        ];
        setCategories(dynamicCats);
      }

      if (storeRes.ok) {
        setStore(await storeRes.json());
      } else {
        // If the store was deleted or not found, force a re-selection
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

  const handleAddToCart = (product: any) => {
    const productWithStore = {
      ...product,
      storeId: storeId || 'unknown',
      storeName: store?.name || 'Kwick Store',
    };
    addToCart(productWithStore);
    // Trigger bounce animation
    cartScale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
      withSpring(1)
    );
  };

  const filteredProducts = activeCategory === 0 
    ? products 
    : products.filter(p => p.category === categories[activeCategory]?.name);

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const cartItem = cart.find(c => c.product.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14).mass(0.8)}>
        <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
          {/* Product Image */}
          <View style={styles.productImageContainer}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            {/* GST Badge */}
            {item.gstClass && item.gstClass !== 'EXEMPT' && (
              <View style={styles.gstBadge}>
                <Text style={styles.gstBadgeText}>
                  {item.gstClass.replace('GST_', '')}% GST
                </Text>
              </View>
            )}
            
            {/* Subscription Discount Badge */}
            {item.subscriptionDiscount > 0 && (
              <View style={styles.subBadge}>
                <Ionicons name="repeat" size={8} color="#1e40af" />
                <Text style={styles.subBadgeText}>Save {item.subscriptionDiscount}%</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <Text style={styles.productCategory}>{toTitleCase(item.category)}</Text>
          <Text style={styles.productName} numberOfLines={2}>{toTitleCase(item.name)}</Text>
          
          {/* Price + Add */}
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>₹{item.price}</Text>
            {qty > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                  <Ionicons name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View>
                <TouchableOpacity 
                  style={styles.addBtn} 
                  activeOpacity={0.7}
                  onPress={(e) => { 
                    e.stopPropagation(); 
                    handleAddToCart(item); 
                  }}
                >
                  <Ionicons name="add" size={18} color={Colors.primary} />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Skeleton loading
  const renderSkeleton = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
          <View style={[styles.skeletonLine, { width: '90%' }]} />
          <View style={[styles.skeletonLine, { width: '40%' }]} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={loading ? [] : filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderProduct}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* Top Bar */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.topBar}>
              <TouchableOpacity 
                style={styles.locationRow}
                onPress={() => router.push('/address-manager')}
                activeOpacity={0.8}
              >
                <View style={styles.locationDot}>
                  <Ionicons name="location" size={16} color={Colors.danger} />
                </View>
                <View>
                  <Text style={styles.deliveryLabel}>
                    Delivering to <Ionicons name="chevron-down" size={12} />
                  </Text>
                  <Text style={styles.storeName}>Tower A, Sunshine Resi...</Text>
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
            </Animated.View>

            {/* Search Bar */}
            <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search" size={20} color={Colors.textMuted} />
              <Text style={styles.searchPlaceholder}>Search groceries, essentials...</Text>
            </TouchableOpacity>

            {/* Promotional Banner */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.bannerContainer}>
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
              {/* Banner dots */}
              <View style={styles.bannerDots}>
                {BANNERS.map((_, i) => (
                  <View key={i} style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]} />
                ))}
              </View>
            </Animated.View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
              {categories.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.categoryChip, idx === activeCategory && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(idx)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={idx === activeCategory ? '#fff' : Colors.textSecondary} 
                  />
                  <Text style={[styles.categoryText, idx === activeCategory && styles.categoryTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeCategory === 0 ? 'All Products' : categories[activeCategory]?.name}
              </Text>
              <Text style={styles.sectionCount}>
                {filteredProducts.length} items
              </Text>
            </View>

            {loading && renderSkeleton()}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={60} color={Colors.border} />
              <Text style={styles.emptyText}>No products in this category</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  listContent: { paddingBottom: 180 },
  
  // Top Bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationDot: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  deliveryLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: 'Inter_500Medium' },
  storeName: { fontSize: 16, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  cartBtn: { position: 'relative', width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.bg },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 14, borderRadius: Radius.lg, gap: 10, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  searchPlaceholder: { fontSize: 15, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  
  // Banner
  bannerContainer: { paddingHorizontal: 20, marginBottom: 20 },
  banner: { borderRadius: Radius['2xl'], padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...Shadows.glow },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#fff', marginBottom: 4 },
  bannerSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  bannerBtn: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  bannerBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bannerIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  bannerDotActive: { width: 20, backgroundColor: Colors.primary },
  
  // Categories
  categoryScroll: { marginBottom: 16 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  categoryTextActive: { color: '#fff' },
  
  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  
  // Products
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  productCard: { width: (width - 48) / 2, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 10, ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
  productImageContainer: { position: 'relative', marginBottom: 12 },
  productImage: { width: '100%', height: 130, borderRadius: Radius.lg, backgroundColor: Colors.surfaceAlt },
  gstBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gstBadgeText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  subBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 2 },
  subBadgeText: { fontSize: 9, color: '#1e40af', fontFamily: 'Inter_700Bold' },
  productCategory: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  productName: { fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', marginBottom: 8, lineHeight: 18, height: 36 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  addBtnText: { color: Colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: Colors.primary },
  qtyText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primaryDark, paddingHorizontal: 8 },
  
  // Skeleton
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, justifyContent: 'space-between' },
  skeletonCard: { width: (width - 48) / 2, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 10, marginBottom: 12 },
  skeletonImage: { width: '100%', height: 130, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, marginBottom: 10 },
  skeletonLine: { height: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 6, marginBottom: 8 },
  
  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
