import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { CartProvider } from '../context/CartContext';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { StatusBar, View, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import Animated, { FadeIn, ZoomIn, SlideInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, Easing, withDelay, withSequence } from 'react-native-reanimated';
import { Text } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';


import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const basketX = useSharedValue(-200);
  const cloudOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Basket runs in quickly
    basketX.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.5)) });

    // 2. Screeching cloud appears
    setTimeout(() => {
      cloudOpacity.value = withTiming(1, { duration: 200 });
      basketX.value = withTiming(20, { duration: 200, easing: Easing.out(Easing.ease) }); // slight bump
    }, 600);

    // 3. Transform into ZipKirana
    setTimeout(() => {
      cloudOpacity.value = withTiming(0, { duration: 300 });
      logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.exp) });
      logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    }, 1100);

    // 4. Smooth blend into UI/UX
    setTimeout(() => {
      logoScale.value = withTiming(1.1, { duration: 400, easing: Easing.in(Easing.ease) });
      logoOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) });
      overlayOpacity.value = withDelay(150, withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }, (isFinished) => {
        if (isFinished) runOnJS(onFinish)();
      }));
    }, 2500);
  }, []);

  const basketStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: basketX.value }],
    opacity: 1 - logoOpacity.value
  }));

  const cloudStyle = useAnimatedStyle(() => ({
    opacity: cloudOpacity.value,
    transform: [{ translateX: basketX.value - 20 }]
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
    position: 'absolute'
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }, overlayStyle]}>
      
      {/* Basket Running */}
      <Animated.View style={[{ position: 'absolute', flexDirection: 'row', alignItems: 'center' }, basketStyle]}>
        <Animated.View style={[cloudStyle, { marginRight: 10 }]}>
          <Text style={{ fontSize: 32 }}>💨</Text>
        </Animated.View>
        <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }}>
          <Text style={{ fontSize: 42 }}>🛒</Text>
        </View>
      </Animated.View>

      {/* ZipKirana Final Reveal */}
      <Animated.View style={[{ alignItems: 'center' }, logoStyle]}>
        <Text style={{ fontSize: 52, fontFamily: 'PlayfairDisplay_700Bold', color: '#fff', letterSpacing: 1.5 }}>ZipKirana</Text>
        <Text style={{ fontSize: 16, fontFamily: 'Inter_500Medium', color: '#10B981', marginTop: 8, letterSpacing: 3, textTransform: 'uppercase' }}>Superfast OS</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. Check local onboarding flag
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('@has_onboarded');
        setHasOnboarded(value === 'true');
      } catch (e) {
        setHasOnboarded(false);
      }
    };
    checkOnboarding();

    // 2. Initialize Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const checkRedirect = async () => {
      if (!fontsLoaded || hasOnboarded === null) return;
      
      // Re-read from AsyncStorage because the state might be stale if updated from a child screen
      const onboardedValue = await AsyncStorage.getItem('@has_onboarded');
      const isActuallyOnboarded = onboardedValue === 'true' || hasOnboarded;

      // Redirect logic
      const onboardingGroup = ['onboarding', 'location-permission', 'manual-location', 'store-selector'];
      const inOnboarding = segments[0] ? onboardingGroup.includes(segments[0]) : false;

      if (!isActuallyOnboarded && !inOnboarding) {
        router.replace('/onboarding');
      }
    };
    checkRedirect();
  }, [hasOnboarded, fontsLoaded, segments]);

  if (!fontsLoaded || hasOnboarded === null) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {splashVisible && <AnimatedSplashScreen onFinish={() => setSplashVisible(false)} />}
      <StatusBar barStyle="dark-content" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(800)}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF9F6' } }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="location-permission" />
            <Stack.Screen name="manual-location" />
            <Stack.Screen name="store-selector" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="store/[id]" />
            <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
            <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
            <Stack.Screen name="order-confirmation" options={{ gestureEnabled: false }} />
            <Stack.Screen name="delivery-tracking" />
            <Stack.Screen name="subscriptions" />
            <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
          </Stack>
        </Animated.View>
        <Toast />
      </GestureHandlerRootView>
    </CartProvider>
    </QueryClientProvider>
  );
}
