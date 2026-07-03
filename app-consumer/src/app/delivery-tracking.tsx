import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import MapplsGL from 'mappls-map-react-native';
import { Colors, Radius, Shadows } from '../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

// -------------------------------------------------------------------------
// INITIALIZE MAPPLS SDK (Mocked out for Expo Go testing)
// -------------------------------------------------------------------------
/* 
MapplsGL.setMapmyIndiaInfo(
  process.env.EXPO_PUBLIC_MAPPLS_ATLAS_CLIENT_ID || '',
  process.env.EXPO_PUBLIC_MAPPLS_ATLAS_CLIENT_SECRET || '',
  process.env.EXPO_PUBLIC_MAPPLS_REST_API_KEY || '',
  process.env.EXPO_PUBLIC_MAPPLS_ATLAS_GRANT_TYPE || ''
);
*/

const { width } = Dimensions.get('window');

// Mock Data
const STORE_LOCATION = [77.5946, 12.9716]; // [longitude, latitude]
const CUSTOMER_LOCATION = [77.6046, 12.9816];

export default function DeliveryTrackingScreen() {
  const router = useRouter();
  
  // This state will eventually be updated by Supabase Realtime / WebSockets
  const [deliveryRiderLocation, setDeliveryRiderLocation] = useState(STORE_LOCATION);

  useEffect(() => {
    // Mocking real-time updates for demonstration
    let timer = setInterval(() => {
      setDeliveryRiderLocation(prev => [
        prev[0] + 0.0001,
        prev[1] + 0.0001
      ]);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Layer Mock */}
      <View style={[styles.map, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="map" size={64} color="#94a3b8" />
        <Text style={{ marginTop: 16, color: '#64748b', fontFamily: 'Inter_500Medium' }}>
          Map View Disabled (Native Build Required)
        </Text>
      </View>

      {/* Floating UI Elements */}
      <SafeAreaView style={styles.floatingSafeArea} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} pointerEvents="none" />

        <Animated.View entering={FadeInDown.springify()} style={styles.infoCard}>
          <View style={styles.riderHeader}>
            <View style={styles.riderAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderTitle}>Arriving in 12 min</Text>
              <Text style={styles.riderSubtitle}>Raju is on the way with your order</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={20} color={Colors.surface} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  map: {
    flex: 1,
  },
  floatingSafeArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: Colors.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 24,
    marginTop: 16,
    ...Shadows.sm,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: Radius.xl,
    padding: 20,
    ...Shadows.lg,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  riderInfo: {
    flex: 1,
  },
  riderTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  riderSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerStore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerCustomer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerRider: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Shadows.md,
  },
});
