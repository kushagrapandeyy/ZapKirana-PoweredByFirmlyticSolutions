import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const ROYAL_BLUE = '#1D4ED8';

export default function TabLayout() {
  return (
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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
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
  );
}
