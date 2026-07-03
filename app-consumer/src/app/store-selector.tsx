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
        setStores(Array.isArray(data) ? data : []);
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
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <View style={styles.storeCard}>
          {/* Header row: Icon & Name */}
          <View style={styles.cardHeader}>
            <View style={styles.storeAvatar}>
              <Ionicons name="storefront" size={24} color={Colors.surface} />
            </View>
            <View style={styles.storeTitleContainer}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeEta}>
                {item.distanceKm} km away · Delivers in 25 min
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
            <Text style={styles.shopBtnText}>Shop this store</Text>
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
    backgroundColor: '#FAF9F6', // Warm off-white
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  storeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 20,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Shadows.sm,
  },
  storeTitleContainer: {
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
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: 20,
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
