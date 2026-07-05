import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows, Radius } from '../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

type HubItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  badgeCount?: number;
};

const HUB_ITEMS: HubItem[] = [
  { title: 'Inventory', icon: 'cube', route: '/operations/inventory', color: Colors.primary, badgeCount: 0 },
  { title: 'Approvals', icon: 'checkmark-done-circle', route: '/operations/approvals', color: Colors.info, badgeCount: 2 },
  { title: 'POs & GRNs', icon: 'document-text', route: '/operations/po', color: Colors.accentDark, badgeCount: 0 },
  { title: 'Fleet', icon: 'hardware-chip', route: '/operations/devices', color: Colors.warningDark, badgeCount: 0 },
  { title: 'Team', icon: 'people', route: '/(tabs)/team', color: Colors.success, badgeCount: 0 },
  { title: 'Campaigns', icon: 'megaphone', route: '/(tabs)/campaigns', color: Colors.primaryDark, badgeCount: 0 },
  { title: 'Subscriptions', icon: 'repeat', route: '/(tabs)/subscriptions', color: Colors.secondary, badgeCount: 3 }, // New Subscriptions Hub
];

export default function CommandStrip() {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.stripContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {HUB_ITEMS.map((item, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.pill}
            activeOpacity={0.8}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon} size={18} color={item.color} />
            <Text style={styles.pillText}>{item.title}</Text>
            {item.badgeCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badgeCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stripContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 12,
    ...Shadows.sm,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
