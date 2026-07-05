import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Keyboard, ActivityIndicator, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

// Helper to bold matching text
const HighlightedText = ({ text, highlight, style, highlightStyle }: any) => {
  if (!highlight.trim()) {
    return <Text style={style}>{text}</Text>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <Text style={style}>
      {parts.filter(String).map((part: string, i: number) => {
        return regex.test(part) ? (
          <Text key={i} style={highlightStyle}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        );
      })}
    </Text>
  );
};

const getIconForCategory = (catName: string) => {
  const name = catName.toLowerCase();
  if (name.includes('dairy') || name.includes('milk')) return 'water';
  if (name.includes('snack') || name.includes('food')) return 'fast-food';
  if (name.includes('beverage') || name.includes('drink')) return 'beer';
  if (name.includes('clean') || name.includes('hygiene')) return 'sparkles';
  if (name.includes('care') || name.includes('health')) return 'body';
  if (name.includes('staple') || name.includes('grocery')) return 'basket';
  if (name.includes('bakery')) return 'cafe';
  return 'pricetag';
};

export default function SearchScreen() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart } = useCart();
  
  const [query, setQuery] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);
  
  // Data State
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Results State
  const [exactMatches, setExactMatches] = useState<any[]>([]);
  const [alternativeMatches, setAlternativeMatches] = useState<any[]>([]);
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const savedStoreId = await AsyncStorage.getItem('@selected_store_id');
      const activeStoreId = savedStoreId || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f';
      setStoreId(activeStoreId);
      
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${activeStoreId}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        
        const uniqueCats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
        setCategories(uniqueCats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (text.length < 2) {
      setExactMatches([]);
      setAlternativeMatches([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      performIntelligentSearch(text);
    }, 150); // fast local debounce
  };

  const performIntelligentSearch = (searchTerm: string) => {
    const term = searchTerm.toLowerCase().trim();
    
    // 1. Exact Name Matches (Highly relevant)
    const exact = inventory.filter(p => p.name.toLowerCase().includes(term));
    setExactMatches(exact);

    // 2. Recommendation Engine (Adjacent brands / generic alternatives)
    if (exact.length > 0) {
      // Find what category these exact matches belong to
      const topCategory = exact[0].category;
      
      // Extract a generic noun from the search term (rudimentary logic: just use the term if it's long enough)
      const genericKeywords = term.split(' ').filter(k => k.length > 3);
      
      const alternatives = inventory.filter(p => {
        // Exclude exact matches
        if (exact.some(e => e.id === p.id)) return false;
        
        const nameLower = p.name.toLowerCase();
        
        // Match if it shares a generic keyword (e.g. "Atta", "Milk")
        const sharesKeyword = genericKeywords.some(kw => nameLower.includes(kw));
        
        // Or if it is in the exact same category but not an exact match
        const sameCategory = p.category === topCategory;
        
        return sharesKeyword || sameCategory;
      });
      
      // Randomize and limit alternatives to 5 items to show variety
      const shuffled = alternatives.sort(() => 0.5 - Math.random()).slice(0, 5);
      setAlternativeMatches(shuffled);
    } else {
      // If no exact name matches, search within categories deeply
      const catMatches = inventory.filter(p => p.category && p.category.toLowerCase().includes(term));
      setExactMatches(catMatches);
      setAlternativeMatches([]);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setQuery(cat);
    performIntelligentSearch(cat);
  };

  const handleAddToCart = (product: any) => {
    const productWithStore = {
      ...product,
      storeId: storeId || 'unknown',
      storeName: 'Local Store',
      price: product.sellingPrice,
      image: product.imageUrl
    };
    addToCart(productWithStore);
  };

  const renderResultCard = ({ item, index }: { item: any, index: number }) => {
    const cartItem = cart.find(c => c.product.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <TouchableOpacity 
          style={styles.resultCard} 
          onPress={() => router.push(`/product/${item.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.resultImageContainer}>
            <Image source={{ uri: item.imageUrl || 'https://placehold.co/100' }} style={styles.resultImage} />
          </View>
          
          <View style={styles.resultInfo}>
            <HighlightedText 
              text={toTitleCase(item.name)} 
              highlight={query} 
              style={styles.resultName} 
              highlightStyle={styles.resultNameBold} 
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.resultContext}>
                in <Text style={styles.resultContextBold}>{toTitleCase(item.category || 'General')}</Text>
              </Text>
              {item.gstClass && item.gstClass !== 'EXEMPT' && (
                <View style={styles.gstBadge}>
                  <Text style={styles.gstBadgeText}>
                    {item.gstClass.replace('GST_', '')}% GST
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.resultFooter}>
              <Text style={styles.resultPrice}>₹{item.sellingPrice}</Text>
              
              {qty > 0 ? (
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                    <Ionicons name="remove" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
                    <Ionicons name="add" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addBtn} 
                  onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                >
                  <Text style={styles.addBtnText}>ADD</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for Atta, Milk, Biscuits..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : query.length < 2 ? (
          /* PRE-FILTERED MENU (BEFORE SEARCH) */
          <Animated.ScrollView entering={FadeIn} contentContainerStyle={styles.preFilterContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.preFilterTitle}>Shop by Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.categoryTile}
                  onPress={() => handleCategoryClick(cat)}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryIconCircle}>
                    <Ionicons name={getIconForCategory(cat) as any} size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.categoryTileText}>{toTitleCase(cat)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.ScrollView>
        ) : (
          /* SEARCH RESULTS & ALTERNATIVES */
          <FlatList
            data={exactMatches}
            renderItem={renderResultCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Ionicons name="search-outline" size={64} color={Colors.border} />
                <Text style={styles.noResultsTitle}>No exact matches</Text>
                <Text style={styles.noResultsText}>We couldn't find anything for "{query}"</Text>
              </View>
            }
            ListFooterComponent={
              alternativeMatches.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.alternativesSection}>
                  <Text style={styles.alternativesTitle}>You Might Also Like</Text>
                  <Text style={styles.alternativesSubtitle}>Similar products & alternative brands</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alternativesScroll}>
                    {alternativeMatches.map((alt, i) => (
                      <TouchableOpacity 
                        key={i} 
                        style={styles.alternativeCard}
                        onPress={() => router.push(`/product/${alt.id}`)}
                      >
                        <Image source={{ uri: alt.imageUrl || 'https://placehold.co/100' }} style={styles.alternativeImage} />
                        <Text style={styles.alternativeName} numberOfLines={2}>{toTitleCase(alt.name)}</Text>
                        <Text style={styles.alternativePrice}>₹{alt.sellingPrice}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface, ...Shadows.sm, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, paddingHorizontal: 16, height: 50, borderRadius: Radius.lg, gap: 10, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  
  content: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 40 },
  
  /* PRE-FILTERED MENU */
  preFilterContainer: { padding: 20, paddingBottom: 150 },
  preFilterTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  categoryTile: { width: (width - 56) / 2, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 20, alignItems: 'center', ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
  categoryIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryTileText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, textAlign: 'center' },

  /* EXACT MATCHES RESULTS */
  resultsList: { padding: 16, paddingBottom: 150 },
  resultCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 12, marginBottom: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  resultImageContainer: { width: 80, height: 80, borderRadius: Radius.lg, backgroundColor: Colors.surfaceAlt, marginRight: 16, overflow: 'hidden' },
  resultImage: { width: '100%', height: '100%' },
  resultInfo: { flex: 1, justifyContent: 'center' },
  
  resultName: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, marginBottom: 2, lineHeight: 20 },
  resultNameBold: { fontFamily: 'Inter_700Bold', color: Colors.primaryDark },
  
  resultContext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 10 },
  resultContextBold: { fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  
  gstBadge: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  gstBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textMuted },
  
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultPrice: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  addBtn: { backgroundColor: Colors.primaryGhost, paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  addBtnText: { color: Colors.primary, fontSize: 12, fontFamily: 'Inter_700Bold' },
  
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(6, 78, 59, 0.1)' },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: Colors.primary },
  qtyText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primaryDark, paddingHorizontal: 8 },
  
  /* ALTERNATIVES CAROUSEL */
  alternativesSection: { marginTop: 16, paddingTop: 24, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  alternativesTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  alternativesSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 16 },
  alternativesScroll: { paddingRight: 16, gap: 12 },
  alternativeCard: { width: 130, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 10, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  alternativeImage: { width: '100%', height: 100, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, marginBottom: 8 },
  alternativeName: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, marginBottom: 4, height: 36, lineHeight: 18 },
  alternativePrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary },
  
  noResultsTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  noResultsText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
});
