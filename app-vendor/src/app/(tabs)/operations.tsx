import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';

type HubItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    title: 'Scanner Approvals',
    icon: 'checkmark-done-circle',
    route: '/operations/approvals',
    description: 'Review & approve scans',
  },
  {
    title: 'Inventory Catalog',
    icon: 'cube',
    route: '/operations/inventory',
    description: 'Manage products & stock',
  },
  {
    title: 'Suppliers & POs',
    icon: 'business',
    route: '/operations/suppliers',
    description: 'Purchase orders & goods',
  },
  {
    title: 'Purchase Orders',
    icon: 'document-text',
    route: '/po-dashboard',
    description: 'Manage PO status',
  },
  {
    title: 'Scanner Devices',
    icon: 'barcode',
    route: '/operations/devices',
    description: 'Manage connected devices',
  },
  {
    title: 'Staff Management',
    icon: 'people',
    route: '/operations/staff',
    description: 'Roles & permissions',
  },
];

export default function OperationsHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Command Center</Text>
          <Text style={styles.subtitle}>Store Operations Hub</Text>
        </Animated.View>

        <View style={styles.grid}>
          {HUB_ITEMS.map((item, index) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(150 + index * 50).springify().damping(14).mass(0.8)}
              style={styles.cardWrapper}
            >
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={32} color={Colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Account for bottom tab bar
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    ...Shadows.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.05)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.1)',
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 5,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
