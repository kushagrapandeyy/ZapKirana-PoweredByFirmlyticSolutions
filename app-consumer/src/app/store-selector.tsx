import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius, Spacing } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

// Mock location for development — ready to swap with expo-location
const MOCK_USER_LOCATION = { latitude: 12.9716, longitude: 77.5946 }; // Bangalore

export default function StoreSelector() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  useEffect(() => {
    findNearbyStores();
  }, []);

  const findNearbyStores = async () => {
    setLoading(true);
    try {
      // TODO: Replace with expo-location when ready
      // import * as Location from 'expo-location';
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // const location = await Location.getCurrentPositionAsync({});
      
      const { latitude, longitude } = MOCK_USER_LOCATION;
      
      const res = await fetch(
        `${API_BASE_URL}/stores/nearby/search?lat=${latitude}&lng=${longitude}&radiusKm=3`
      );
      
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to find nearby stores:', err);
      // Fallback: fetch all stores
      try {
        const res = await fetch(`${API_BASE_URL}/stores/nearby/search?lat=12.9716&lng=77.5946&radiusKm=50`);
        if (res.ok) {
          const data = await res.json();
          setStores(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (storeId: string) => {
    setSelectedStore(storeId);
    await AsyncStorage.setItem('@selected_store_id', storeId);
    
    // Small delay for selection animation
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 300);
  };

  const renderStore = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedStore === item.id;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <TouchableOpacity
          style={[
            styles.storeCard,
            isSelected && styles.storeCardSelected,
          ]}
          activeOpacity={0.85}
          onPress={() => selectStore(item.id)}
        >
          {/* Store Avatar */}
          <View style={[styles.storeAvatar, isSelected && styles.storeAvatarSelected]}>
            <Ionicons 
              name="storefront" 
              size={28} 
              color={isSelected ? '#fff' : Colors.primary} 
            />
          </View>

          {/* Store Info */}
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{item.name}</Text>
            <Text style={styles.storeAddress} numberOfLines={1}>{item.location || 'Local Store'}</Text>
            
            <View style={styles.storeMetaRow}>
              {item.distanceKm !== undefined && (
                <View style={styles.metaBadge}>
                  <Ionicons name="navigate-outline" size={12} color={Colors.primary} />
                  <Text style={styles.metaText}>{item.distanceKm} km</Text>
                </View>
              )}
              <View style={styles.metaBadge}>
                <Ionicons name="star" size={12} color={Colors.accent} />
                <Text style={styles.metaText}>{item.rating || 4.5}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: Colors.successLight }]}>
                <View style={styles.liveDot} />
                <Text style={[styles.metaText, { color: Colors.successDark }]}>Open</Text>
              </View>
            </View>
          </View>

          {/* Selection indicator */}
          <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={24} color={Colors.danger} />
        </View>
        <Text style={styles.title}>Stores near you</Text>
        <Text style={styles.subtitle}>
          Showing stores within 3 km that deliver to your location
        </Text>
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  storeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGhost,
    ...Shadows.glow,
  },
  storeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  storeAvatarSelected: {
    backgroundColor: Colors.primary,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  storeMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
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
