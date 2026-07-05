import { Tabs } from 'expo-router';
import { Home, Scan, Settings, MapPin } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function TabsLayout() {
  const { role } = useAuthStore();
  const isDelivery = role === 'DELIVERY';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0EA5E9',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          href: isDelivery ? null : '/(tabs)',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan Barcode',
          href: isDelivery ? null : '/(tabs)/scanner',
          tabBarIcon: ({ color }) => <Scan color={color} size={24} />,
        }}
      />
      {/* If delivery, show something else or keep settings open so they can logout */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          href: null,
          title: 'Action',
        }}
      />
    </Tabs>
  );
}
