import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useEffect, useRef } from 'react';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function TabLayout() {
  const { cartItemsCount, cartTotal } = useCart();
  const router = useRouter();
  
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (cartItemsCount > 0) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 5,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [cartItemsCount, slideAnim]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: ROYAL_BLUE,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarBackground: () => (
            <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: 25,
            left: 20,
            right: 20,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            borderRadius: 30,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Cart Banner */}
      <Animated.View style={[
        styles.cartBanner, 
        { 
          transform: [{ translateY: slideAnim }],
          opacity: slideAnim.interpolate({
            inputRange: [0, 100],
            outputRange: [1, 0]
          })
        }
      ]}
      pointerEvents={cartItemsCount > 0 ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.cartContent} activeOpacity={0.9} onPress={() => router.push('/cart')}>
          <View style={styles.cartInfo}>
            <Ionicons name="cart" size={24} color={WHITE} style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.cartItemsText}>{cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}</Text>
              <Text style={styles.cartTotalText}>₹{cartTotal}</Text>
            </View>
          </View>
          <View style={styles.viewCartBtn}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={18} color={WHITE} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartBanner: {
    position: 'absolute',
    bottom: 105, // Just above the tab bar
    left: 20,
    right: 20,
    backgroundColor: ROYAL_BLUE,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemsText: {
    color: '#dbeafe', // light blue
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  cartTotalText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCartText: {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
