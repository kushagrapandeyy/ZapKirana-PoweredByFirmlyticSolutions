import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Mocking true for UI

  const handleLogout = async () => {
    // await AsyncStorage.removeItem('@auth_token');
    // setIsAuthenticated(false);
    // router.replace('/auth/login');
  };

  const menuGroups = [
    {
      title: 'ZipKirana Services',
      items: [
        { icon: 'wallet-outline', label: 'ZipPay & ZipCredits', route: null },
        { icon: 'pricetags-outline', label: 'ZipOffers', route: null },
        { icon: 'receipt-outline', label: 'Your Orders', route: '/(tabs)/orders' },
        { icon: 'calendar-outline', label: 'Subscriptions', route: '/subscriptions', badge: 'New' },
        { icon: 'heart-outline', label: 'Favorite Items', route: null },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { icon: 'notifications-outline', label: 'Dynamic Notification Engine', route: '/(tabs)/notifications-settings', badge: 'New' },
        { icon: 'person-outline', label: 'Personal Information', route: null },
        { icon: 'location-outline', label: 'Saved Addresses', route: null },
        { icon: 'card-outline', label: 'Payment Methods', route: null },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'chatbubbles-outline', label: 'Help & Support', route: '/help' },
        { icon: 'document-text-outline', label: 'Terms & Policies', route: null },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View entering={FadeInDown} style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.phone}>+91 98765 43210</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' }} 
              style={styles.avatar} 
            />
          </View>
        </Animated.View>

        {/* Quick Stats / Wallet (Mock) */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="wallet-outline" size={24} color={Colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>₹450</Text>
            <Text style={styles.statLabel}>ZipCash</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="star" size={24} color={Colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>Gold</Text>
            <Text style={styles.statLabel}>Membership</Text>
          </View>
        </Animated.View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuGroups.map((group, groupIdx) => (
            <Animated.View key={groupIdx} entering={FadeInDown.delay(150 + groupIdx * 50)}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupCard}>
                {group.items.map((item, itemIdx) => (
                  <TouchableOpacity 
                    key={itemIdx} 
                    style={[
                      styles.menuItem, 
                      itemIdx !== group.items.length - 1 && styles.menuItemBorder
                    ]}
                    onPress={() => item.route && router.push(item.route as any)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.border} />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Logout */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>ZipKirana OS v1.0.0</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  
  scroll: { flex: 1 },
  
  profileCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16, padding: 20, borderRadius: Radius.xl, ...Shadows.md },
  profileInfo: { flex: 1 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  phone: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 2 },
  email: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 12 },
  editBtn: { alignSelf: 'flex-start' },
  editBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceAlt, padding: 4, ...Shadows.sm },
  avatar: { width: '100%', height: '100%', borderRadius: 36 },
  
  statsContainer: { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16, borderRadius: Radius.xl, padding: 16, ...Shadows.md },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 8 },
  
  menuContainer: { paddingHorizontal: 20, marginTop: 24, gap: 20 },
  groupTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: 4 },
  groupCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, ...Shadows.md, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  menuItemLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  badge: { backgroundColor: Colors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff', textTransform: 'uppercase' },
  
  logoutContainer: { paddingHorizontal: 20, marginTop: 32, alignItems: 'center', gap: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.dangerLight, backgroundColor: Colors.surface },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
  versionText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
