import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../constants/api';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';


const DUMMY_TRANSACTIONS = [
  { id: '1', date: 'Oct 24, 2023', type: 'Purchase', qty: 150, cost: 2450, sell: 3100 },
  { id: '2', date: 'Nov 02, 2023', type: 'Return', qty: 10, cost: 120, sell: 180 },
  { id: '3', date: 'Nov 15, 2023', type: 'Purchase', qty: 500, cost: 8900, sell: 11200 },
  { id: '4', date: 'Dec 01, 2023', type: 'Purchase', qty: 300, cost: 4500, sell: 6200 },
  { id: '5', date: 'Jan 10, 2024', type: 'Return', qty: 5, cost: 60, sell: 90 },
  { id: '6', date: 'Feb 14, 2024', type: 'Purchase', qty: 200, cost: 3200, sell: 4100 },
  { id: '7', date: 'Mar 05, 2024', type: 'Purchase', qty: 150, cost: 2450, sell: 3100 },
  { id: '8', date: 'Apr 12, 2024', type: 'Return', qty: 20, cost: 240, sell: 360 },
  { id: '9', date: 'May 20, 2024', type: 'Purchase', qty: 400, cost: 6800, sell: 8900 },
  { id: '10', date: 'Jun 11, 2024', type: 'Purchase', qty: 250, cost: 4100, sell: 5500 },
  { id: '11', date: 'Jul 04, 2024', type: 'Purchase', qty: 100, cost: 1800, sell: 2400 },
];

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
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  
  // ERP Fields State
  const [gstinNo, setGstinNo] = useState('');
  const [foodLicenceNo, setFoodLicenceNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  // Fetch Supplier Detail
  const { data: supplier, isLoading } = useQuery({
    queryKey: ['admin_supplier', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      setWebsite(supplier.website || supplier.description || '');
      setAddress(supplier.address || '');
      setGstinNo(supplier.gstinNo || '');
      setFoodLicenceNo(supplier.foodLicenceNo || '');
      setPanNo(supplier.panNo || '');
      setOpeningBalance(supplier.openingBalance?.toString() || '');
    }
  }, [isEditModalVisible, supplier]);

  // Edit Supplier Mutation
  const editMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
    editMutation.mutate({ 
      name, contactPerson, contactPhone, contactEmail, address, description: website,
      gstinNo, foodLicenceNo, panNo, openingBalance: openingBalance ? parseFloat(openingBalance) : null
    });
  };

  
  const handleSafeLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Action Unavailable', `Your device cannot open this link: ${url}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong opening the link.');
    }
  };

  const handleOpenPDF = async (poId: string) => {
    try {
      await WebBrowser.openBrowserAsync(`${API_BASE_URL}/purchase-orders/${poId}/pdf`);
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSafeLink(`tel:${supplier.contactPhone?.replace(/\s/g, '')}`)}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSafeLink(`mailto:${supplier.contactEmail}`)}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSafeLink(supplier.description || supplier.website || "https://google.com")}>
            <Ionicons name="globe-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.actionRow, { marginTop: 12 }]}>
          <TouchableOpacity 
            style={[styles.primaryActionBtn, { flex: 1 }]} 
            onPress={() => router.push(`/operations/po/draft?supplierId=${id}`)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.primaryActionText}>Create Purchase Order</Text>
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

        {/* Transaction History (Legacy View) */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>TYPE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>QTY</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>COST</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>SELLING</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {DUMMY_TRANSACTIONS.map((txn, index) => (
                <Animated.View key={txn.id} entering={FadeIn.delay(index * 20)} style={[styles.tableRow, index === Math.min(DUMMY_TRANSACTIONS.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.tableRowText, { flex: 1.5 }]}>{txn.date}</Text>
                  <Text style={[styles.tableRowText, { flex: 1, color: txn.type === 'Purchase' ? Colors.success : Colors.danger }]}>{txn.type}</Text>
                  <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right' }]}>{txn.qty}</Text>
                  <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{txn.cost}</Text>
                  <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right' }]}>₹{txn.sell}</Text>
                </Animated.View>
              ))}
            </ScrollView>
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

            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {purchaseOrders.length === 0 ? (
                <Text style={styles.emptyText}>No recent purchase orders.</Text>
              ) : (
                purchaseOrders.map((po: any, index: number) => (
                  <Animated.View key={po.id} entering={FadeIn.delay(index * 20)} style={[styles.tableRow, index === Math.min(purchaseOrders.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.tableRowText, { flex: 1.5 }]}>{new Date(po.createdAt).toLocaleDateString()}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, color: po.status === 'RECEIVED' ? Colors.success : Colors.warningDark }]}>{po.status}</Text>
                    <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{po.totalAmount}</Text>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => handleOpenPDF(po.id)}>
                      <Ionicons name="document-text" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </ScrollView>
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

            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
              {supplierProducts.length === 0 ? (
                <Text style={styles.emptyText}>No products linked to this supplier.</Text>
              ) : (
                supplierProducts.map((sp: any, index: number) => (
                  <Animated.View key={sp.id} entering={FadeIn.delay(index * 20)} style={[styles.tableRow, index === Math.min(supplierProducts.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.tableRowText, { flex: 2 }]} numberOfLines={1}>{sp.product?.name || 'Unknown'}</Text>
                    <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{sp.price}</Text>
                  </Animated.View>
                ))
              )}
            </ScrollView>
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
                <Text style={styles.label}>Website</Text>
                <TextInput style={styles.input} value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" placeholder="e.g. https://zapkirana.com" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput style={[styles.input, { height: 80 }]} value={address} onChangeText={setAddress} multiline placeholder="Full street address..." />
              </View>

              <Text style={[styles.label, { fontSize: 16, marginTop: 10, marginBottom: 15, color: Colors.primary }]}>Legal & Accounting (ERP)</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GSTIN No.</Text>
                <TextInput style={styles.input} value={gstinNo} onChangeText={setGstinNo} autoCapitalize="characters" placeholder="e.g. 07AAFCA9197E1ZF" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Food Licence No.</Text>
                <TextInput style={styles.input} value={foodLicenceNo} onChangeText={setFoodLicenceNo} placeholder="e.g. FSSAI12345" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PAN No.</Text>
                <TextInput style={styles.input} value={panNo} onChangeText={setPanNo} autoCapitalize="characters" placeholder="e.g. AAFCA9197E" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Opening Balance</Text>
                <TextInput style={styles.input} value={openingBalance} onChangeText={setOpeningBalance} keyboardType="numeric" placeholder="e.g. 43399.00" />
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
