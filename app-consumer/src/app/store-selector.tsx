import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Dimensions, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

const MOCK_USER_LOCATION = { latitude: 12.9716, longitude: 77.5946 };

export default function StoreSelector() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    findNearbyStores();
  }, []);

  const findNearbyStores = async () => {
    setLoading(true);
    try {
      const { latitude, longitude } = MOCK_USER_LOCATION;
      const res = await fetch(`${API_BASE_URL}/stores/nearby/search?lat=${latitude}&lng=${longitude}&radiusKm=3`);
      
      if (res.ok) {
        const data = await res.json();
        const apiStores = Array.isArray(data) ? data : [];
        setStores(apiStores);
        
        // Auto-select if there is exactly 1 store
        if (apiStores.length === 1) {
          selectStore(apiStores[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to find nearby stores:', err);
      // Fallback: mock a store if backend is unreachable
      setStores([{
        id: 'mock-kwick-1',
        name: 'Kwick Society Store',
        distanceKm: 0.8,
        categories: ['Fresh produce', 'Dairy', 'Snacks', 'Daily essentials'],
        rating: 4.8,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (storeId: string) => {
    await AsyncStorage.setItem('@selected_store_id', storeId);
    await AsyncStorage.setItem('@has_onboarded', 'true');
    router.replace('/(tabs)');
  };

  const renderStore = ({ item, index }: { item: any; index: number }) => {
    const isSelected = item.id === selectedStoreId;
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 150).springify().damping(14)}
        style={styles.storeCardWrapper}
      >
        <View style={[styles.storeCard, isSelected && styles.storeCardSelected]}>
          <View style={styles.cardHeader}>
            <View style={styles.storeIconBg}>
              <Ionicons name="storefront" size={24} color={Colors.primary} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeEta}>
                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} /> {item.distanceKm} km away  ·  <Ionicons name="time-outline" size={12} color={Colors.textSecondary} /> 25 min
              </Text>
            </View>
          </View>

          {/* Categories */}
          <Text style={styles.categoriesText}>
            {(item.categories || ['Fresh produce', 'Dairy', 'Snacks', 'Daily essentials']).join(' · ')}
          </Text>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>Currently serving your address</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity 
            style={styles.shopBtn}
            activeOpacity={0.85}
            onPress={() => selectStore(item.id)}
          >
            <Text style={styles.shopBtnText}>Enter Store</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Stores serving your location</Text>
      </Animated.View>

      {/* Store List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding stores near you...</Text>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>No stores nearby</Text>
          <Text style={styles.emptyText}>
            We couldn't find any stores delivering to your area yet. Check back soon!
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={findNearbyStores}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stores}
          renderItem={renderStore}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            <Animated.View entering={FadeIn.delay(500)} style={styles.footerPlaceholder}>
              <Text style={styles.footerTitle}>Your active grocery store</Text>
              <Text style={styles.footerText}>
                {stores[0]?.name || 'Kwick Society Store'} is currently the only verified store serving this location. 
                Multi-store ordering is coming soon.
              </Text>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  storeCardWrapper: {
    marginBottom: 20,
  },
  storeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  storeCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowOpacity: 0.08,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  storeIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  storeEta: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  categoriesText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.successDark,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.successDark,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.full,
    gap: 8,
  },
  shopBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.surface,
  },
  footerPlaceholder: {
    marginTop: 24,
    padding: 20,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  footerTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
