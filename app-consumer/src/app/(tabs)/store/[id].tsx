import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, SafeAreaView, FlatList, Dimensions, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../constants/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { width } = Dimensions.get('window');

// Dynamic categories will be computed in the component based on products.

export default function StoreScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const storeId = Array.isArray(id) ? id[0] : id;
  const { cart, addToCart, removeFromCart, cartItemsCount } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  // Cart badge animation
  const cartScale = useSharedValue(1);
  const cartBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  useEffect(() => {
    if (storeId) loadStoreAndProducts();
  }, [storeId]);

  const loadStoreAndProducts = async () => {
    try {
      const [productsRes, storeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory/products?storeId=${storeId}`),
        fetch(`${API_BASE_URL}/stores/${storeId}`),
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
        }));
        setProducts(mapped);
      }

      if (storeRes.ok) {
        setStore(await storeRes.json());
      } else {
        // Fallback mock store if API fails
        setStore({ id: storeId, name: 'ZapKirana Partner Store', categories: ['General'] });
        setProducts([
          { id: 'p1', name: 'Fresh Milk 1L', price: 65, category: 'Dairy & Eggs', image: 'https://placehold.co/300x300/f1f5f9/64748b?text=Milk', gstClass: 'EXEMPT' },
          { id: 'p2', name: 'Whole Wheat Bread', price: 40, category: 'Bakery', image: 'https://placehold.co/300x300/f1f5f9/64748b?text=Bread', gstClass: 'EXEMPT' },
          { id: 'p3', name: 'Potato Chips', price: 20, category: 'Snacks', image: 'https://placehold.co/300x300/f1f5f9/64748b?text=Chips', gstClass: 'GST_12' },
        ]);
      }
    } catch (err) {
      console.error(err);
      setStore({ id: storeId, name: 'ZapKirana Partner Store (Offline)' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStoreAndProducts();
  }, [storeId]);

  
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
    if (isProcessing) return;
    setIsProcessing(true);
    const productWithStore = {
      ...product,
      storeId: storeId,
      storeName: store?.name || 'ZapKirana Store',
    };
    addToCart(productWithStore);
    cartScale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
      withSpring(1)
    );
    setTimeout(() => setIsProcessing(false), 200);
  };
  
  const handleRemoveFromCart = (productId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    removeFromCart(productId);
    setTimeout(() => setIsProcessing(false), 200);
  };

  const dynamicCategories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const getIcon = (catName: string) => {
      const l = catName.toLowerCase();
      if (l.includes('dairy') || l.includes('egg')) return 'water-outline';
      if (l.includes('offer')) return 'pricetag-outline';
      if (l.includes('bake')) return 'cafe-outline';
      if (l.includes('snack')) return 'fast-food-outline';
      if (l.includes('grocery')) return 'basket-outline';
      if (l.includes('fresh')) return 'leaf-outline';
      return 'grid-outline';
    };
    return [
      { name: 'All', icon: 'grid-outline' },
      ...uniqueCats.map(c => ({ name: c as string, icon: getIcon(c as string) }))
    ];
  }, [products]);

  const filteredProducts = activeCategory === 0 
    ? products 
    : products.filter(p => p.category === dynamicCategories[activeCategory]?.name);

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const cartItem = cart.find(c => c.product.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14).mass(0.8)}>
        <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
          <View style={styles.productImageContainer}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            
            {item.stockStatus === 'OUT_OF_STOCK' && (
              <View style={[styles.subBadge, { backgroundColor: '#fee2e2', bottom: 6, left: 6, right: 'auto', top: 'auto' }]}>
                <Text style={[styles.subBadgeText, { color: '#b91c1c' }]}>Out of Stock</Text>
              </View>
            )}

            {item.gstClass && item.gstClass !== 'EXEMPT' && (
              <View style={styles.gstBadge}>
                <Text style={styles.gstBadgeText}>
                  {item.gstClass.replace('GST_', '')}% GST
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.productFooter}>
            <View style={{ flexShrink: 1, marginRight: 8 }}>
              <Text style={styles.productPrice} adjustsFontSizeToFit numberOfLines={1}>₹{item.price}</Text>
            </View>
            {qty > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => handleRemoveFromCart(item.id)} disabled={isProcessing}>
                  <Ionicons name="remove" size={16} color="#1D4ED8" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => { if (item.stockStatus !== 'OUT_OF_STOCK') handleAddToCart(item); }} disabled={isProcessing}>
                  <Ionicons name="add" size={16} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => handleAddToCart(item)}>
                <Ionicons name="add" size={18} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store ? store.name : 'Loading...'}</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="bag-outline" size={24} color={Colors.textPrimary} />
          {cartItemsCount > 0 && (
            <Animated.View style={[styles.cartBadge, cartBadgeStyle]}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
              {dynamicCategories.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.categoryChip, idx === activeCategory && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(idx)}
                >
                  <Ionicons name={cat.icon as any} size={16} color={idx === activeCategory ? '#fff' : Colors.textSecondary} />
                  <Text style={[styles.categoryText, idx === activeCategory && styles.categoryTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeCategory === 0 ? 'All Products' : dynamicCategories[activeCategory]?.name}
              </Text>
              <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
            </View>

            {loading && (
              <View style={{ padding: 20, alignItems: 'center' }}><Text>Loading products...</Text></View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  listContent: { paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center', paddingHorizontal: 12 },
  cartBtn: { position: 'relative', width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.bg },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  
  categoryScroll: { marginVertical: 16 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  categoryTextActive: { color: '#fff' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  productCard: { width: (width - 48) / 2, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 10, ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
  productImageContainer: { position: 'relative', marginBottom: 12 },
  productImage: { width: '100%', height: 130, borderRadius: Radius.lg, backgroundColor: Colors.surfaceAlt },
  gstBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gstBadgeText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  subBadge: { position: 'absolute', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  subBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  productCategory: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: 2, textTransform: 'uppercase' },
  productName: { fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', marginBottom: 8, lineHeight: 18, height: 36 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  addBtn: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: '#bfdbfe' },
  addBtnText: { color: '#1D4ED8', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qtyControls: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: Radius.full, borderWidth: 1, borderColor: '#bfdbfe', gap: 6, paddingVertical: 4, paddingHorizontal: 6 },
  qtyBtn: { width: 26, height: 26, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.full, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  qtyBtnAdd: { }, // removed primary background
  qtyText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1D4ED8', paddingHorizontal: 4, minWidth: 16, textAlign: 'center' },
});
