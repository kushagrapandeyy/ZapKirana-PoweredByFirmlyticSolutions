import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Keyboard, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadStoreAndHistory();
  }, []);

  const loadStoreAndHistory = async () => {
    try {
      const savedStoreId = await AsyncStorage.getItem('@selected_store_id');
      setStoreId(savedStoreId || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f');
      
      const history = await AsyncStorage.getItem('@recent_searches');
      if (history) setRecentSearches(JSON.parse(history));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (text.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 500); // 500ms debounce
  };

  const performSearch = async (searchTerm: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${storeId}&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        // The backend might not have a full text search endpoint perfectly implemented yet, 
        // so we'll filter locally if the backend returns all or un-filtered results
        const filtered = data.filter((p: any) => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setResults(filtered);
        saveRecentSearch(searchTerm);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = async (term: string) => {
    const termClean = term.trim().toLowerCase();
    if (termClean.length < 3) return;
    
    const newHistory = [termClean, ...recentSearches.filter(s => s !== termClean)].slice(0, 5);
    setRecentSearches(newHistory);
    await AsyncStorage.setItem('@recent_searches', JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem('@recent_searches');
  };

  const renderResult = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={styles.resultItem} 
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultCategory}>{item.category || 'Grocery'}</Text>
        </View>
        <Text style={styles.resultPrice}>₹{item.sellingPrice}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries, essentials..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoFocus
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

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : query.length > 0 ? (
          results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={64} color={Colors.border} />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>We couldn't find any items matching "{query}"</Text>
            </View>
          )
        ) : (
          <Animated.View entering={FadeIn.delay(200)} style={styles.recentSection}>
            {recentSearches.length > 0 ? (
              <>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentTags}>
                  {recentSearches.map((term, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.recentTag}
                      onPress={() => handleSearch(term)}
                    >
                      <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.recentTagText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.exploreSection}>
                <Text style={styles.exploreTitle}>Explore Categories</Text>
                <View style={styles.exploreGrid}>
                  {['Dairy & Eggs', 'Bakery', 'Snacks', 'Beverages'].map((cat, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.exploreCard}
                      onPress={() => router.push('/')}
                    >
                      <Text style={styles.exploreCardText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, paddingHorizontal: 16, height: 48, borderRadius: Radius.lg, gap: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  
  content: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 12, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  resultsList: { padding: 20 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 14 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  resultCategory: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  resultPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  noResultsTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  noResultsText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
  
  recentSection: { padding: 20 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  recentTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  clearText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.primary },
  recentTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recentTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  recentTagText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  
  exploreSection: { marginTop: 10 },
  exploreTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 16 },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  exploreCard: { width: '47%', backgroundColor: Colors.surface, padding: 20, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  exploreCardText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, textAlign: 'center' },
});
