import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Switch, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';

const MINT_GREEN = '#10b981';
const DARK_BG = '#0f172a';
const WHITE = '#FFFFFF';

export default function ProfileScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleHelp = () => {
    router.push('/help');
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    Toast.show({
      type: 'success',
      text1: isDarkMode ? 'Light Mode Enabled' : 'Dark Mode Enabled',
      position: 'bottom',
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
          <View>
            <Text style={[styles.name, isDarkMode && styles.textDark]}>Rahul Sharma</Text>
            <Text style={styles.phone}>+91 98765 43210</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color={isDarkMode ? '#fff' : '#475569'} />
              <Text style={[styles.settingText, isDarkMode && styles.textDark]}>Dark Mode</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#e2e8f0', true: MINT_GREEN }}
            />
          </View>
          <View style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={isDarkMode ? '#fff' : '#475569'} />
              <Text style={[styles.settingText, isDarkMode && styles.textDark]}>Push Notifications</Text>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e2e8f0', true: MINT_GREEN }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={24} color={isDarkMode ? '#fff' : '#475569'} />
              <Text style={[styles.settingText, isDarkMode && styles.textDark]}>Saved Addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
            <View style={styles.settingLeft}>
              <Ionicons name="card-outline" size={24} color={isDarkMode ? '#fff' : '#475569'} />
              <Text style={[styles.settingText, isDarkMode && styles.textDark]}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
          <Ionicons name="help-buoy" size={24} color={WHITE} />
          <Text style={styles.helpButtonText}>Help & Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: DARK_BG },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30, marginTop: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  phone: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#64748b', marginTop: 4 },
  textDark: { color: WHITE },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: WHITE, padding: 15, borderRadius: 12, marginBottom: 10 },
  settingRowDark: { backgroundColor: '#1e293b' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#1e293b' },
  helpButton: { flexDirection: 'row', backgroundColor: MINT_GREEN, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  helpButtonText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
