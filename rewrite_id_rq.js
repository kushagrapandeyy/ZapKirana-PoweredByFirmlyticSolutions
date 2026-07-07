const fs = require('fs');
const path = 'app-vendor/src/app/operations/supplier/[id].tsx';

const content = `import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../constants/api';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

export default function SupplierDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Form State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  // Fetch Supplier Detail
  const { data: supplier, isLoading } = useQuery({
    queryKey: ['admin_supplier', id],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers/\${id}\`, {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (!res.ok) throw new Error('Failed to fetch supplier details');
      return res.json();
    },
  });

  // Populate Edit Form when modal opens
  useEffect(() => {
    if (supplier && isEditModalVisible) {
      setName(supplier.name || '');
      setContactPerson(supplier.contactPerson || '');
      setContactPhone(supplier.contactPhone || '');
      setContactEmail(supplier.contactEmail || '');
      setAddress(supplier.address || '');
    }
  }, [isEditModalVisible, supplier]);

  // Edit Supplier Mutation
  const editMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers/\${id}\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update supplier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_supplier', id] });
      queryClient.invalidateQueries({ queryKey: ['admin_suppliers'] });
      setIsEditModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update supplier');
    }
  });

  const handleEditSupplier = () => {
    if (!name.trim() || !contactPhone.trim()) {
      Alert.alert('Validation Error', 'Supplier Name and Phone are required.');
      return;
    }
    editMutation.mutate({ name, contactPerson, contactPhone, contactEmail, address });
  };

  const handleOpenPDF = async (poId: string) => {
    try {
      await WebBrowser.openBrowserAsync(\`\${API_BASE_URL}/purchase-orders/\${poId}/pdf\`);
    } catch (e) {
      Alert.alert('Error', 'Could not open invoice PDF.');
    }
  };

  if (isLoading || !supplier) {
    return <View style={styles.container} />;
  }

  const purchaseOrders = supplier.purchaseOrders || [];
  const supplierProducts = supplier.supplierProducts || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{supplier.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Avatar Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRedHalf} />
            <Text style={styles.avatarInitial}>{supplier.name.substring(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{supplier.name}</Text>
          <Text style={styles.profilePerson}>{supplier.contactPerson || 'No Contact Person'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditModalVisible(true)}>
            <Ionicons name="pencil-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(\`tel:\${supplier.contactPhone}\`)}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(\`mailto:\${supplier.contactEmail}\`)}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact Person</Text>
            <Text style={styles.infoValue}>{supplier.contactPerson || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{supplier.contactPhone || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValueBlue}>{supplier.contactEmail || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRowAddress}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValueAddress}>{supplier.address || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Recent PO Orders (PDF/Invoices) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent PO Orders</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>AMOUNT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>INVOICE</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            {purchaseOrders.length === 0 ? (
              <Text style={styles.emptyText}>No recent purchase orders.</Text>
            ) : (
              purchaseOrders.map((po: any, index: number) => (
                <Animated.View key={po.id} entering={FadeIn.delay(index * 50)} style={[styles.tableRow, index === purchaseOrders.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.tableRowText, { flex: 1.5 }]}>{new Date(po.createdAt).toLocaleDateString()}</Text>
                  <Text style={[styles.tableRowText, { flex: 1, color: po.status === 'RECEIVED' ? Colors.success : Colors.warningDark }]}>{po.status}</Text>
                  <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{po.totalAmount}</Text>
                  <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => handleOpenPDF(po.id)}>
                    <Ionicons name="document-text" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Active Catalog (Supplier Products) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Catalog</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>PRODUCT</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>SUPPLIER PRICE</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            {supplierProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products linked to this supplier.</Text>
            ) : (
              supplierProducts.map((sp: any, index: number) => (
                <Animated.View key={sp.id} entering={FadeIn.delay(index * 50)} style={[styles.tableRow, index === supplierProducts.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.tableRowText, { flex: 2 }]} numberOfLines={1}>{sp.product?.name || 'Unknown'}</Text>
                  <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{sp.price}</Text>
                </Animated.View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Supplier Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Supplier</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
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
                style={[styles.submitBtn, editMutation.isPending && { opacity: 0.7 }]} 
                onPress={handleEditSupplier}
                disabled={editMutation.isPending}
              >
                <Text style={styles.submitBtnText}>{editMutation.isPending ? 'Updating...' : 'Update Supplier'}</Text>
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
  backBtn: {
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
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  avatarRedHalf: {
    width: 100,
    height: 50,
    backgroundColor: Colors.danger,
    position: 'absolute',
    top: 0,
  },
  avatarInitial: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 40,
    color: '#000',
    marginTop: 10,
  },
  profileName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  profilePerson: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: { marginBottom: 6 },
  actionText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRowAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  infoValueBlue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  infoValueAddress: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
    lineHeight: 22,
  },
  transactionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  tableHeaderText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  tableHeaderLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableRowText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    paddingVertical: 10,
    textAlign: 'center',
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
console.log('Rewrote [id].tsx to integrate RQ and CRUD');
