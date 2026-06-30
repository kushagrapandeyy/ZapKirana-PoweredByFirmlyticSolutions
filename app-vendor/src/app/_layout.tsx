import { Stack } from 'expo-router';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider } from '@/context/AuthContext';
import { LedgerProvider } from '@/context/LedgerContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <LedgerProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </LedgerProvider>
    </AuthProvider>
  );
}
