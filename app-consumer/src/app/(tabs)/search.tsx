import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const MINT_GREEN = '#10b981';
const WHITE = '#FFFFFF';
const DARK_BG = '#0f172a';

const CATEGORIES = [
  { id: '1', name: 'Fresh Fruits', icon: '🍎' },
  { id: '2', name: 'Vegetables', icon: '🥬' },
  { id: '3', name: 'Dairy & Eggs', icon: '🥛' },
  { id: '4', name: 'Snacks', icon: '🥨' },
  { id: '5', name: 'Beverages', icon: '🥤' },
  { id: '6', name: 'Meat & Seafood', icon: '🥩' },
];

const RECENT_SEARCHES = ['Milk', 'Bread', 'Eggs', 'Banana'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    Toast.show({
      type: 'info',
      text1: `Searching for "${query}"`,
      position: 'top',
      visibilityTime: 1500,
    });
    // For demo purposes, we just clear and show a toast.
    // Real implementation would hit the backend API.
  };

  const handleCategoryPress = (name: string) => {
    setQuery(name);
    Toast.show({
      type: 'info',
      text1: `Browsing ${name}`,
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!query ? (
          <>
            {/* Recent Searches */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
              </View>
              <View style={styles.chipContainer}>
                {RECENT_SEARCHES.map(item => (
                  <TouchableOpacity key={item} style={styles.chip} onPress={() => setQuery(item)}>
                    <Ionicons name="time-outline" size={16} color="#64748b" />
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.grid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => handleCategoryPress(cat.name)}>
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={styles.catName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Search Results</Text>
            <Text style={styles.emptyDesc}>Press return to search for "{query}"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, fontFamily: 'Inter_400Regular', color: '#0f172a' },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  clearText: { color: MINT_GREEN, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#475569' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  catCard: { width: '30%', aspectRatio: 1, backgroundColor: '#f8fafc', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  catIcon: { fontSize: 32, marginBottom: 8 },
  catName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#475569', textAlign: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#1e293b', marginTop: 20 },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b', marginTop: 10 },
});
