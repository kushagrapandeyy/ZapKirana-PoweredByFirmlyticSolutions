import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import OperationsHubModal from '../../components/OperationsHubModal';

const DEEP_GREEN = '#064e3b'; // Premium grocery green

export default function TabLayout() {
  const { role } = useAuth();
  const [hubVisible, setHubVisible] = useState(false);
  
  const isDelivery = role === 'DELIVERY';
  const isStaff = role === 'STAFF';
  const isManagerOrOwner = role === 'OWNER' || role === 'MANAGER' || role === 'PARTNER';

  return (
    <>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: DEEP_GREEN,
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
          href: isManagerOrOwner ? '/(tabs)/dashboard' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          href: (isManagerOrOwner || isStaff) ? '/(tabs)/orders' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          href: null, // Hidden from bottom bar to maintain 5-tab symmetry, accessed via Dashboard
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Hub',
          tabBarButton: (props) => {
            if (!(isManagerOrOwner || isStaff)) return null;
            return (
              <TouchableOpacity
                style={{
                  top: -25,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setHubVisible(true)}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: DEEP_GREEN,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: DEEP_GREEN,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 5,
                  borderWidth: 4,
                  borderColor: '#fff'
                }}>
                  <Ionicons name="grid" size={28} color="#fff" />
                  {/* Cumulative Notifications Badge */}
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#10b981', // Colors.success
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 3,
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 11,
                      fontFamily: 'Inter_700Bold',
                    }}>5</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'Deliveries',
          href: (isManagerOrOwner || isDelivery) ? '/(tabs)/delivery' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          href: null, // Hidden from bottom bar, accessed via Dashboard
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          href: null, // Accessed via Command Center
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
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
      <Tabs.Screen
        name="subscriptions"
        options={{
          href: null, // Accessed via Hub
        }}
      />
      </Tabs>
      
      <OperationsHubModal 
        visible={hubVisible} 
        onClose={() => setHubVisible(false)} 
      />
    </>
  );
}
