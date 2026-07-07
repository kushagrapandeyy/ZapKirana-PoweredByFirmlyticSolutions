const fs = require('fs');
const path = 'app-vendor/src/app/operations/suppliers.tsx';

const content = `import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, SafeAreaView, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../constants/api';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const DUMMY_AVATARS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function SuppliersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  // Fetch Suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['admin_suppliers'],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers\`, {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    },
  });

  // Create Supplier Mutation
  const createMutation = useMutation({
    mutationFn: async (newSupplier: any) => {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify(newSupplier)
      });
      if (!res.ok) throw new Error('Failed to create supplier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_suppliers'] });
      setIsAddModalVisible(false);
      setName('');
      setContactPerson('');
      setContactPhone('');
      setContactEmail('');
      setAddress('');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to add supplier');
    }
  });

  const handleAddSupplier = () => {
    if (!name.trim() || !contactPhone.trim()) {
      Alert.alert('Validation Error', 'Supplier Name and Phone are required.');
      return;
    }
    createMutation.mutate({ name, contactPerson, contactPhone, contactEmail, address });
  };

  const filteredSuppliers = suppliers.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.contactPhone && s.contactPhone.includes(searchQuery))
  );

  const getInitials = (n: string) => n ? n.substring(0, 3).toUpperCase() : 'SUP';

  const renderSupplier = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(15)}>
      <TouchableOpacity 
        style={styles.supplierCard}
        onPress={() => router.push(\`/operations/supplier/\${item.id}\`)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: DUMMY_AVATARS[index % DUMMY_AVATARS.length] }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.phoneText}>{item.contactPhone || 'No Phone'}</Text>
          <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.personText} numberOfLines={1}>{item.contactPerson || 'No Contact Person'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList 
        data={filteredSuppliers}
        keyExtractor={item => item.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Supplier Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Supplier</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. ABC Corp" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Person</Text>
                <TextInput style={styles.input} value={contactPerson} onChangeText={setContactPerson} placeholder="e.g. Rahul Kumar" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholder="e.g. +91 9876543210" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" placeholder="e.g. contact@abccorp.com" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput style={[styles.input, { height: 80 }]} value={address} onChangeText={setAddress} multiline placeholder="Full street address..." />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, createMutation.isPending && { opacity: 0.7 }]} 
                onPress={handleAddSupplier}
                disabled={createMutation.isPending}
              >
                <Text style={styles.submitBtnText}>{createMutation.isPending ? 'Saving...' : 'Save Supplier'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuBtn: {
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
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 15,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: Radius.lg,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 16,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  phoneText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  personText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
`;

fs.writeFileSync(path, content, 'utf8');
console.log('Rewrote suppliers.tsx');
