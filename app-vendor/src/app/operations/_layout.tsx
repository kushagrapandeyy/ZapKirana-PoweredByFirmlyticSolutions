import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEEP_GREEN = '#064e3b';

export default function OperationsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: DEEP_GREEN,
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerBackground: () => (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ),
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8, padding: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={DEEP_GREEN} />
            <Text style={{ color: DEEP_GREEN, fontSize: 17, marginLeft: 4 }}>Hub</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
      <Stack.Screen name="approvals" options={{ title: 'Scanner Approvals' }} />
      <Stack.Screen name="suppliers" options={{ title: 'Suppliers' }} />
    </Stack>
  );
}
