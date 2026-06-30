import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { useEffect } from 'react';

// Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { cartItemsCount, cartTotal } = useCart();
  const router = useRouter();
  const cartBounce = useSharedValue(1);

  useEffect(() => {
    if (cartItemsCount > 0) {
      cartBounce.value = withSpring(1.15, { damping: 4 }, () => {
        cartBounce.value = withSpring(1);
      });
    }
  }, [cartItemsCount]);

  const cartBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBounce.value }],
  }));

  const tabs = [
    { name: 'index', label: 'Home', icon: 'home' },
    { name: 'search', label: 'Search', icon: 'search' },
    { name: 'orders', label: 'Orders', icon: 'receipt' },
    { name: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <View style={styles.tabBarWrapper}>
      {/* Floating Cart Banner */}
      {cartItemsCount > 0 && (
        <Animated.View entering={FadeIn} style={cartBarStyle}>
          <TouchableOpacity 
            style={styles.floatingCart} 
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartLeftSection}>
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{cartItemsCount}</Text>
              </View>
              <Text style={styles.cartLabel}>
                {cartItemsCount} item{cartItemsCount > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.cartRightSection}>
              <Text style={styles.cartTotalText}>₹{cartTotal}</Text>
              <View style={styles.viewCartBtn}>
                <Text style={styles.viewCartText}>View Cart</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: state.routes[routeIndex]?.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TouchableOpacity key={tab.name} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
              <View style={[styles.tabIconWrapper, isFocused && styles.tabIconWrapperActive]}>
                <Ionicons
                  name={(isFocused ? tab.icon : `${tab.icon}-outline`) as any}
                  size={22}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: 'transparent',
  },
  
  // Floating Cart
  floatingCart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    ...Shadows.lg,
  },
  cartLeftSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartCountBadge: { backgroundColor: Colors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cartCountText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  cartLabel: { color: '#fff', fontSize: 14, fontFamily: 'Inter_500Medium' },
  cartRightSection: { alignItems: 'flex-end' },
  cartTotalText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  viewCartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewCartText: { color: Colors.primaryLight, fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconWrapper: {
    width: 40,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: Colors.primaryGhost,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
