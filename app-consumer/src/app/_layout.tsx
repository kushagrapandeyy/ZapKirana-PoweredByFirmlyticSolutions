import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { CartProvider } from '../context/CartContext';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
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
      <StatusBar barStyle="dark-content" />
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
      <Toast />
    </CartProvider>
  );
}
