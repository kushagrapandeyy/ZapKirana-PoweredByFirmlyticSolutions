import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';

type HubItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  color: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    title: 'Intelligent Alerts',
    icon: 'notifications',
    route: '/operations/alerts',
    description: 'Low stock, expiring & damaged goods',
    color: Colors.danger
  },
  {
    title: 'Scanner Approvals',
    icon: 'checkmark-done-circle',
    route: '/operations/approvals',
    description: 'Review & approve hardware scans',
    color: Colors.info
  },
  {
    title: 'Inventory Catalog',
    icon: 'cube',
    route: '/operations/inventory',
    description: 'Manage live products & stock',
    color: Colors.primary
  },
  {
    title: 'Purchase Orders',
    icon: 'document-text',
    route: '/operations/po',
    description: 'Supplier invoices & GRNs',
    color: Colors.accentDark
  },
  {
    title: 'Suppliers & Vendors',
    icon: 'business',
    route: '/operations/suppliers',
    description: 'Manage supplier contacts & history',
    color: Colors.primaryDark
  },
  {
    title: 'Staff & HR',
    icon: 'people',
    route: '/operations/staff',
    description: 'Timesheets & Wage Slips',
    color: Colors.success
  },
  {
    title: 'Cash Register & Expenses',
    icon: 'wallet',
    route: '/operations/till',
    description: 'Day-end closing & petty cash',
    color: Colors.accent
  },
  {
    title: 'Fleet Tracker',
    icon: 'hardware-chip',
    route: '/operations/devices',
    description: 'Scanner hardware telemetry',
    color: Colors.warningDark
  },
];

export default function OperationsHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Hub</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.welcomeBox}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          <View style={styles.welcomeTextGroup}>
            <Text style={styles.welcomeTitle}>Admin Access Granted</Text>
            <Text style={styles.welcomeSub}>All operational modules are unlocked.</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionHeader}>Core Operations</Text>

        <View style={styles.list}>
          {HUB_ITEMS.map((item, index) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
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
    backgroundColor: '#FAF9F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  welcomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGhost,
    padding: 16,
    borderRadius: Radius.lg,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  welcomeTextGroup: {
    marginLeft: 12,
    flex: 1,
  },
  welcomeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.primaryDark,
  },
  welcomeSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 16,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
