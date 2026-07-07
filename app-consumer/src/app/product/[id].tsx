import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useRef, useEffect, useState } from 'react';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { cart, addToCart, removeFromCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [product, setProduct] = useState<any>(null);
  const [similarItems, setSimilarItems] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.sellingPrice,
          time: '10 MINS',
          image: p.imageUrl || 'https://via.placeholder.com/300/f3f4f6/374151?text=Product',
          description: p.description,
          subscriptionDiscount: p.subscriptionDiscount || 0,
        }));
        const current = mapped.find((p: any) => p.id === id) || mapped[0];
        setProduct(current);
        setSimilarItems(mapped.filter((p: any) => p.id !== current.id).slice(0, 4));
      })
      .catch(console.error);
  }, [id]);

  const cartScale = useRef(new Animated.Value(1)).current;

  const cartItem = product ? cart.find((c: any) => c.product.id === product.id) : null;
  const qty = cartItem ? cartItem.qty : 0;

  const handleAddToCart = (item: any) => {
    if (isProcessing) return;
    setIsProcessing(true);
    addToCart(item);
    Animated.sequence([
      Animated.timing(cartScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
    setTimeout(() => setIsProcessing(false), 200);
  };

  const handleRemoveFromCart = (id: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    removeFromCart(id);
    setTimeout(() => setIsProcessing(false), 200);
  };

  const renderSimilarItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.similarCard} activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
      <Image source={{ uri: item.image }} style={styles.similarImage} />
      <Text style={styles.similarName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.similarFooter}>
        <Text style={styles.similarPrice}>₹{item.price}</Text>
        <TouchableOpacity style={styles.smallAddBtn} onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
          <Text style={styles.smallAddBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!product) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Header Image & Back Button */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.mainImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.deliveryTime}>DELIVERY IN {product.time}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>
          
          <View style={styles.subscribeBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="repeat" size={20} color={ROYAL_BLUE} />
                <View>
                  <Text style={styles.subscribeTitle}>
                    {product.subscriptionDiscount > 0 
                      ? `Subscribe & Save ${product.subscriptionDiscount}%` 
                      : 'Subscribe for recurring delivery'}
                  </Text>
                  <Text style={styles.subscribeDesc}>Get this delivered daily or weekly.</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.subscribeBtn} onPress={() => router.push(`/subscribe/${product.id}`)}>
                <Text style={styles.subscribeBtnText}>Setup</Text>
              </TouchableOpacity>
            </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Similar Items</Text>
        </View>

        {/* Similar Items List */}
        <FlatList
          data={similarItems}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderSimilarItem}
          contentContainerStyle={styles.similarList}
        />
      </ScrollView>

      {/* Sticky Bottom Add to Cart */}
      <View style={styles.bottomBar}>
        {qty === 0 ? (
          <Animated.View style={{ transform: [{ scale: cartScale }], flex: 1 }}>
            <TouchableOpacity 
              style={[styles.addToCartBtn, isProcessing && { opacity: 0.7 }]} 
              onPress={() => handleAddToCart(product)}
              disabled={isProcessing}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.splitBottomBar}>
            <Animated.View style={[styles.premiumCounter, { transform: [{ scale: cartScale }] }]}>
              <TouchableOpacity style={styles.premiumCounterBtn} onPress={() => handleRemoveFromCart(product.id)} disabled={isProcessing}>
                <Ionicons name="remove" size={20} color={ROYAL_BLUE} />
              </TouchableOpacity>
              <Text style={styles.premiumCounterText}>{qty}</Text>
              <TouchableOpacity style={styles.premiumCounterBtn} onPress={() => handleAddToCart(product)} disabled={isProcessing}>
                <Ionicons name="add" size={20} color={ROYAL_BLUE} />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push('/cart')}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#f3f4f6',
    position: 'relative'
  },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoContainer: { padding: 20 },
  deliveryTime: { fontSize: 12, color: ROYAL_BLUE, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 28, color: '#111827', fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 8 },
  price: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 8, marginTop: 10 },
  description: { fontSize: 15, color: '#4b5563', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  subscribeBanner: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  subscribeTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1e40af' },
  subscribeDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#3b82f6', marginTop: 2 },
  subscribeBtn: { backgroundColor: ROYAL_BLUE, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribeBtnText: { color: WHITE, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 20 },
  similarList: { paddingHorizontal: 20, paddingBottom: 100 }, // space for bottom bar
  similarCard: { width: 140, marginRight: 15 },
  similarImage: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#f3f4f6', marginBottom: 8 },
  similarName: { fontSize: 13, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  similarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  similarPrice: { fontSize: 14, color: '#111827', fontFamily: 'Inter_700Bold' },
  smallAddBtn: { backgroundColor: '#f3f4f6', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  smallAddBtnText: { color: ROYAL_BLUE, fontSize: 16, marginTop: -2, fontFamily: 'Inter_700Bold' },
  bottomBar: {
    position: 'absolute',
    bottom: 70, // To stay above the tab bar
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 20,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addToCartBtn: {
    backgroundColor: ROYAL_BLUE,
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    width: '100%'
  },
  addToCartText: {
    color: WHITE,
    fontSize: 17,
    fontFamily: 'Inter_700Bold'
  },
  splitBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 16,
  },
  premiumCounterBtn: {
    padding: 4,
    backgroundColor: WHITE,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  premiumCounterText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: ROYAL_BLUE,
    minWidth: 14,
    textAlign: 'center',
  },
  viewCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: ROYAL_BLUE,
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ROYAL_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewCartText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  }
});
