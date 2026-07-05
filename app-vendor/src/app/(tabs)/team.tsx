import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import Toast from 'react-native-toast-message';

const COLORS = {
  primary: '#064e3b',
  surface: '#ffffff',
  bg: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

const ROLES = ['OWNER', 'MANAGER', 'STAFF', 'DELIVERY', 'SCANNER_STAFF'];

export default function TeamScreen() {
  const { role } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const isOwner = role === 'OWNER';
  
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/stores/${CURRENT_STORE_ID}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Could not fetch team.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${CURRENT_STORE_ID}/staff/${selectedUser.id}/role?role=${newRole}`, {
        method: 'POST'
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Role Updated', text2: `${selectedUser.name || 'User'}'s role is now ${newRole}` });
        fetchStaff();
        setModalVisible(false);
      } else {
        Toast.show({ type: 'error', text1: 'Error updating role' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error' });
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'U'}</Text>
        </View>
        <View>
          <Text style={styles.name}>{item.name || 'Unnamed Staff'}</Text>
          <Text style={styles.contact}>{item.phone || item.email || 'No contact info'}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.roleBadge, item.role === 'OWNER' && styles.roleBadgeOwner]}>
          <Text style={[styles.roleText, item.role === 'OWNER' && styles.roleTextOwner]}>{item.role}</Text>
        </View>
        
        {isOwner && item.role !== 'OWNER' && (
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => { setSelectedUser(item); setModalVisible(true); }}
          >
            <Ionicons name="pencil" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Management</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn} onPress={() => Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Invite flow pending' })}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No team members found.</Text>}
        />
      )}

      {/* Role Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Role for {selectedUser?.name || 'User'}</Text>
            {ROLES.map(r => (
              <TouchableOpacity key={r} style={styles.modalOption} onPress={() => handleRoleChange(r)}>
                <Text style={[styles.modalOptionText, selectedUser?.role === r && styles.modalOptionActive]}>{r}</Text>
                {selectedUser?.role === r && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.primary },
  name: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: COLORS.text, marginBottom: 2 },
  contact: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.textMuted },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: COLORS.textMuted },
  roleBadgeOwner: { backgroundColor: '#fef3c7' },
  roleTextOwner: { color: '#d97706' },
  editBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontFamily: 'Inter_500Medium' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.text, marginBottom: 20 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalOptionText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.text },
  modalOptionActive: { color: COLORS.primary, fontFamily: 'Inter_700Bold' },
  cancelBtn: { marginTop: 20, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: COLORS.textMuted }
});
