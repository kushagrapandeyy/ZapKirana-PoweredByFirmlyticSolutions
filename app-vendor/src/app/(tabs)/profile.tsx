import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, Role } from '@/context/AuthContext';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function ProfileScreen() {
  const { role, phone, tenantId, logout, updateRole } = useAuth();

  const handleRoleChange = async (newRole: Role) => {
    await updateRole(newRole);
    alert(`Role switched to ${newRole} for testing purposes.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={40} color={WHITE} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.phoneText}>+91 {phone}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
          </View>
        </View>

        {/* Store Details (Visible to Owner/Manager/Partner) */}
        {(role === 'OWNER' || role === 'MANAGER' || role === 'PARTNER') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tenant ID</Text>
              <Text style={styles.infoValue}>{tenantId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Store Name</Text>
              <Text style={styles.infoValue}>Basko Main Store</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GST Number</Text>
              <Text style={styles.infoValue}>29GGGGG1314R9Z6</Text>
            </View>
          </View>
        )}

        {/* Danger Zone: Dev Role Switcher */}
        <View style={[styles.section, { marginTop: 40 }]}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Developer Role Switcher</Text>
          <Text style={styles.helpText}>Use this to test the app as different users.</Text>
          <View style={styles.roleBtns}>
            {['OWNER', 'MANAGER', 'PICKER', 'PARTNER'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => handleRoleChange(r as Role)}
              >
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, color: '#0f172a', fontFamily: 'PlayfairDisplay_700Bold' },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: WHITE, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, alignItems: 'center', marginBottom: 30 },
  avatarBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: ROYAL_BLUE, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  userInfo: { flex: 1 },
  phoneText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleText: { color: ROYAL_BLUE, fontSize: 12, fontFamily: 'Inter_700Bold' },
  section: { backgroundColor: WHITE, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, color: '#64748b', fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 14, color: '#0f172a', fontFamily: 'Inter_600SemiBold' },
  helpText: { fontSize: 13, color: '#64748b', marginBottom: 15 },
  roleBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  roleBtnActive: { backgroundColor: ROYAL_BLUE, borderColor: ROYAL_BLUE },
  roleBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748b' },
  roleBtnTextActive: { color: WHITE },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fef2f2', padding: 15, borderRadius: 12, marginTop: 20, gap: 8 },
  logoutText: { color: '#ef4444', fontSize: 16, fontFamily: 'Inter_600SemiBold' }
});
