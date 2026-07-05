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


import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Zoom in and fade in
    scale.value = withSpring(1, { damping: 10, stiffness: 80 });
    opacity.value = withTiming(1, { duration: 800 });

    // 2. Wait and fade out whole overlay
    setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 600 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onFinish)();
        }
      });
    }, 2000);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }, overlayStyle]}>
      <Animated.View style={[{ alignItems: 'center' }, logoStyle]}>
        <View style={{ width: 100, height: 100, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 48 }}>🛒</Text>
        </View>
        <Text style={{ fontSize: 42, fontFamily: 'PlayfairDisplay_700Bold', color: '#fff' }}>ZapKirana</Text>
        <Text style={{ fontSize: 16, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>Groceries in 10 Minutes</Text>
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
  );
}
