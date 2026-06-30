import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { CartProvider } from '../context/CartContext';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('@has_onboarded');
        setHasOnboarded(value === 'true');
      } catch (e) {
        setHasOnboarded(false);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || hasOnboarded === null) return;
    
    // Redirect logic
    if (!hasOnboarded && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
    }
  }, [hasOnboarded, fontsLoaded, segments]);

  if (!fontsLoaded || hasOnboarded === null) return null;

  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8fafc' } }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
        <Stack.Screen name="order-confirmation" options={{ gestureEnabled: false }} />
        <Stack.Screen name="delivery-tracking" />
      </Stack>
      <Toast />
    </CartProvider>
  );
}
