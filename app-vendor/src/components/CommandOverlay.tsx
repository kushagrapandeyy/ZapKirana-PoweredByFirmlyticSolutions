import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Colors, Shadows, Radius } from '../constants/theme';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
];

interface CommandOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export default function CommandOverlay({ visible, onClose }: CommandOverlayProps) {
  const router = useRouter();

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150); // slight delay to allow modal close animation
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          entering={FadeInUp.duration(300).springify()} 
          exiting={FadeOutDown.duration(200)}
          style={styles.sheet}
        >
          <View style={styles.handleBar} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Command Center</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.grid}>
            {HUB_ITEMS.map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleNavigate(item.route)}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                  {item.badgeCount ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badgeCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: height * 0.7,
    ...Shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: 'center'
  },
  card: {
    width: (width - 64) / 3, // 3 columns
    backgroundColor: Colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
