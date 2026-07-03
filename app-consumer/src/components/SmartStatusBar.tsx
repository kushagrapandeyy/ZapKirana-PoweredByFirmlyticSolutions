import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useCart } from '../context/CartContext';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

export default function SmartStatusBar() {
  const { cartItemsCount, cartTotal } = useCart();
  const router = useRouter();
  const segments = useSegments();
  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    if (cartItemsCount === 0) {
      checkActiveOrders();
    } else {
      setActiveOrder(null);
    }
  }, [cartItemsCount]);

  const checkActiveOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/customer/test-user-id`);
      if (res.ok) {
        const data = await res.json();
        const active = data.find((o: any) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
        setActiveOrder(active || null);
      }
    } catch (e) {
      // silent fail
    }
  };

  const scale = useSharedValue(1);

  useEffect(() => {
    if (cartItemsCount > 0) {
      scale.value = withSequence(
        withSpring(1.05, { damping: 6 }),
        withSpring(1)
      );
    }
  }, [cartItemsCount, activeOrder]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isHiddenRoute = segments.includes('cart') || segments.includes('checkout');

  if (isHiddenRoute || (cartItemsCount === 0 && !activeOrder)) {
    return null;
  }

  return (
    <Animated.View 
      entering={FadeInDown.springify().damping(12)} 
      exiting={FadeOutDown}
      style={styles.container}
    >
      <Animated.View style={animatedStyle}>
      {cartItemsCount > 0 ? (
        <TouchableOpacity 
          style={styles.pillCart} 
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.leftSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItemsCount}</Text>
            </View>
            <View>
              <Text style={styles.label}>View Cart</Text>
              <Text style={styles.subLabel}>{cartItemsCount} item{cartItemsCount > 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.totalText}>₹{cartTotal}</Text>
            <View style={styles.actionCircle}>
              <Ionicons name="arrow-forward" size={16} color={Colors.surface} />
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.pillOrder} 
          onPress={() => router.push('/orders')}
          activeOpacity={0.9}
        >
          <View style={styles.leftSection}>
            <View style={[styles.badge, { backgroundColor: Colors.accent }]}>
              <Ionicons name="bicycle" size={16} color={Colors.textPrimary} />
            </View>
            <View>
              <Text style={styles.label}>Order in progress</Text>
              <Text style={styles.subLabel}>Status: {activeOrder.status}</Text>
            </View>
          </View>
          <View style={styles.actionCircleAlt}>
            <Ionicons name="location" size={16} color={Colors.surface} />
          </View>
        </TouchableOpacity>
      )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 80, 
    left: 20,
    right: 20,
    zIndex: 9999, 
    elevation: 10,
  },
  pillCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.textPrimary,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Shadows.lg,
  },
  pillOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Shadows.lg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCircleAlt: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
