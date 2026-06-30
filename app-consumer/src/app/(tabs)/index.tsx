import { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, SafeAreaView, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

const CATEGORIES = ['Offers', 'Dairy & Eggs', 'Bakery', 'Snacks', 'Beverages', 'Cleaning'];

export const MOCK_PRODUCTS = [
  { id: '1', name: 'Amul Taaza Milk 1L', price: 68, time: '10 MINS', image: 'https://via.placeholder.com/300/e0f2fe/0369a1?text=Milk', description: 'Fresh standardized milk, fortified with Vitamin A & D. Ideal for daily consumption.' },
  { id: '2', name: 'Britannia Whole Wheat Bread', price: 45, time: '10 MINS', image: 'https://via.placeholder.com/300/fef3c7/b45309?text=Bread', description: '100% whole wheat bread, baked to perfection for a healthy sandwich.' },
  { id: '3', name: 'Tata Salt 1kg', price: 28, time: '10 MINS', image: 'https://via.placeholder.com/300/f3f4f6/374151?text=Salt', description: 'Vacuum evaporated iodised salt. Essential for a healthy diet.' },
  { id: '4', name: 'Surf Excel Matic 1kg', price: 215, time: '10 MINS', image: 'https://via.placeholder.com/300/e0e7ff/4338ca?text=Detergent', description: 'Front load liquid detergent for tough stain removal.' },
  { id: '5', name: 'Maggi 2-Minute Noodles', price: 14, time: '10 MINS', image: 'https://via.placeholder.com/300/fef08a/854d0e?text=Maggi', description: 'The classic 2-minute instant noodles, a favourite snack for all ages.' },
  { id: '6', name: 'Tropicana Orange Juice', price: 110, time: '10 MINS', image: 'https://via.placeholder.com/300/fed7aa/c2410c?text=Juice', description: '100% juice, no added sugar. A refreshing and healthy start to your day.' },
];

export default function HomeFeed() {
  const router = useRouter();
  const { addToCart, cartItemsCount } = useCart();
  
  // Animation value for the cart badge bounce
  const cartScale = useRef(new Animated.Value(1)).current;

  const handleAddToCart = (product: any) => {
    addToCart(product);
    
    // Bounce Animation
    Animated.sequence([
      Animated.timing(cartScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productTime}>{item.time}</Text>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.deliveryTo}>Delivery to Tower A</Text>
          <Text style={styles.deliveryTime}>Arrives in 10-15 min</Text>
        </View>
        <TouchableOpacity style={styles.cartIconContainer} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={28} color="#111827" />
          {cartItemsCount > 0 && (
            <Animated.View style={[styles.cartBadge, { transform: [{ scale: cartScale }] }]}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>Basko Store</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat, idx) => (
          <TouchableOpacity key={idx} style={[styles.categoryBadge, idx === 0 && styles.categoryBadgeActive]}>
            <Text style={[styles.categoryText, idx === 0 && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Featured Items</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_PRODUCTS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  listContent: { paddingBottom: 120 }, // Extra padding for the floating tab bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  deliveryTo: { fontSize: 16, color: ROYAL_BLUE, fontFamily: 'Inter_700Bold' },
  deliveryTime: { fontSize: 13, color: '#6b7280', marginTop: 2, fontFamily: 'Inter_400Regular' },
  cartIconContainer: { position: 'relative', padding: 5 },
  cartBadge: { position: 'absolute', top: -2, right: -5, backgroundColor: ROYAL_BLUE, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: WHITE },
  cartBadgeText: { color: WHITE, fontSize: 10, fontFamily: 'Inter_700Bold' },
  mainTitle: { fontSize: 36, paddingHorizontal: 20, color: '#111827', marginBottom: 20, fontFamily: 'PlayfairDisplay_700Bold' },
  categoryScroll: { paddingHorizontal: 20, marginBottom: 30 },
  categoryBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 10 },
  categoryBadgeActive: { backgroundColor: ROYAL_BLUE },
  categoryText: { color: '#4b5563', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  categoryTextActive: { color: WHITE },
  sectionTitle: { fontSize: 20, paddingHorizontal: 20, marginBottom: 15, color: '#111827', fontFamily: 'Inter_700Bold' },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 15 },
  productCard: { width: '47%', marginBottom: 25 },
  productImage: { width: '100%', height: 160, borderRadius: 16, marginBottom: 12, backgroundColor: '#f3f4f6' },
  productTime: { fontSize: 11, color: ROYAL_BLUE, marginBottom: 4, fontFamily: 'Inter_700Bold' },
  productName: { fontSize: 14, color: '#111827', height: 40, marginBottom: 8, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, color: '#111827', fontFamily: 'Inter_700Bold' },
  addBtn: { backgroundColor: '#f3f4f6', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: ROYAL_BLUE, fontSize: 20, marginTop: -2, fontFamily: 'Inter_700Bold' },
});
