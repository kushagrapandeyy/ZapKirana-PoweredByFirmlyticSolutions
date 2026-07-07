import os

FILE_PATH = "/Users/kushagrapandey/COde/Basko-FirmlyticSolutions/Basko-PoweredByFirmlyticSolutions/app-vendor/src/app/operations/supplier/[id].tsx"

content = """import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking, Switch } from 'react-native';
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

  // Unified Form State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', description: '',
    ledgerName: '', station: '', accountGroup: '', balancingMethod: '',
    openingBalance: '', openingBalanceType: 'Cr', mailTo: '', pinCode: '',
    holdPayment: false, gstr1HoldPercent: '', website: '', contactPerson: '',
    designation: '', mobile: '', faxNo: '', gstin: '', tin: '', foodLicenseNo: '',
    pan: '', ledgerCategory: '', state: '', country: '', ledgerType: ''
  });

  const [activeTab, setActiveTab] = useState('General'); // General, Contact, Location, Compliance, Accounting

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

  useEffect(() => {
    if (supplier && isEditModalVisible) {
      setFormData({
        name: supplier.name || '', email: supplier.email || '', phone: supplier.phone || '', address: supplier.address || '', description: supplier.description || '',
        ledgerName: supplier.ledgerName || '', station: supplier.station || '', accountGroup: supplier.accountGroup || '', balancingMethod: supplier.balancingMethod || '',
        openingBalance: supplier.openingBalance?.toString() || '', openingBalanceType: supplier.openingBalanceType || 'Cr', mailTo: supplier.mailTo || '', pinCode: supplier.pinCode || '',
        holdPayment: supplier.holdPayment || false, gstr1HoldPercent: supplier.gstr1HoldPercent?.toString() || '', website: supplier.website || '', contactPerson: supplier.contactPerson || '',
        designation: supplier.designation || '', mobile: supplier.mobile || '', faxNo: supplier.faxNo || '', gstin: supplier.gstin || '', tin: supplier.tin || '', foodLicenseNo: supplier.foodLicenseNo || '',
        pan: supplier.pan || '', ledgerCategory: supplier.ledgerCategory || '', state: supplier.state || '', country: supplier.country || '', ledgerType: supplier.ledgerType || ''
      });
    }
  }, [isEditModalVisible, supplier]);

  const editMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const payload = { ...updatedData };
      if (payload.openingBalance) payload.openingBalance = parseFloat(payload.openingBalance);
      if (payload.gstr1HoldPercent) payload.gstr1HoldPercent = parseFloat(payload.gstr1HoldPercent);

      const res = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update supplier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_supplier', id] });
      queryClient.invalidateQueries({ queryKey: ['admin_suppliers'] });
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Supplier updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update supplier');
    }
  });

  const handleEditSupplier = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Validation Error', 'Supplier Name and Phone are required.');
      return;
    }
    editMutation.mutate(formData);
  };

  const handleSafeLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong opening the link.');
    }
  };

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderInput = (label: string, key: keyof typeof formData, placeholder: string = '', keyboardType: any = 'default', multiline = false) => (
    <View style={styles.inputGroup} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={[styles.input, multiline && { height: 80 }]} 
        value={String(formData[key])} 
        onChangeText={(text) => updateForm(key, text)} 
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  const renderSwitch = (label: string, key: keyof typeof formData) => (
    <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} key={key}>
      <Text style={styles.label}>{label}</Text>
      <Switch 
        value={Boolean(formData[key])} 
        onValueChange={(val) => updateForm(key, val)}
        trackColor={{ false: '#E2E8F0', true: Colors.primary }}
      />
    </View>
  );

  if (isLoading || !supplier) {
    return <View style={styles.container} />;
  }

  const tabs = ['General', 'Contact', 'Location', 'Compliance', 'Accounting'];

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
            <Text style={styles.actionText}>Edit Full Master</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSafeLink(`tel:${supplier.phone?.replace(/\s/g, '')}`)}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSafeLink(`mailto:${supplier.email}`)}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Display Read-Only Fields (Key ones) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Information</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Ledger Name</Text><Text style={styles.infoValue}>{supplier.ledgerName || supplier.name}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>GSTIN</Text><Text style={styles.infoValue}>{supplier.gstin || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>PAN</Text><Text style={styles.infoValue}>{supplier.pan || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{supplier.phone || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Opening Bal</Text><Text style={styles.infoValue}>{supplier.openingBalance ? \`₹${supplier.openingBalance} ${supplier.openingBalanceType}\` : 'N/A'}</Text></View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Full Edit Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Master Supplier Edit</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map(t => (
                  <TouchableOpacity key={t} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]} onPress={() => setActiveTab(t)}>
                    <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              
              {activeTab === 'General' && (
                <View>
                  {renderInput('Company/Supplier Name *', 'name')}
                  {renderInput('Ledger Name', 'ledgerName')}
                  {renderInput('Account Group', 'accountGroup')}
                  {renderInput('Ledger Type', 'ledgerType')}
                  {renderInput('Ledger Category', 'ledgerCategory')}
                  {renderInput('Description / Notes', 'description', '', 'default', true)}
                </View>
              )}

              {activeTab === 'Contact' && (
                <View>
                  {renderInput('Contact Person', 'contactPerson')}
                  {renderInput('Designation', 'designation')}
                  {renderInput('Phone *', 'phone', '', 'phone-pad')}
                  {renderInput('Mobile', 'mobile', '', 'phone-pad')}
                  {renderInput('Email', 'email', '', 'email-address')}
                  {renderInput('Website', 'website', '', 'url')}
                  {renderInput('Fax No.', 'faxNo')}
                </View>
              )}

              {activeTab === 'Location' && (
                <View>
                  {renderInput('Address / Mail To', 'address', '', 'default', true)}
                  {renderInput('City / Station', 'station')}
                  {renderInput('State', 'state')}
                  {renderInput('Country', 'country')}
                  {renderInput('Pin Code', 'pinCode', '', 'numeric')}
                </View>
              )}

              {activeTab === 'Compliance' && (
                <View>
                  {renderInput('GSTIN No.', 'gstin')}
                  {renderInput('PAN No.', 'pan')}
                  {renderInput('TIN No.', 'tin')}
                  {renderInput('Food Licence No.', 'foodLicenseNo')}
                </View>
              )}

              {activeTab === 'Accounting' && (
                <View>
                  {renderInput('Balancing Method', 'balancingMethod')}
                  {renderInput('Opening Balance', 'openingBalance', '', 'numeric')}
                  {renderInput('Opening Balance Type (Cr/Dr)', 'openingBalanceType')}
                  {renderSwitch('Hold Payment', 'holdPayment')}
                  {renderInput('GSTR-1 Hold %', 'gstr1HoldPercent', '', 'numeric')}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.submitBtn, editMutation.isPending && { opacity: 0.7 }]} 
                onPress={handleEditSupplier}
                disabled={editMutation.isPending}
              >
                <Text style={styles.submitBtnText}>{editMutation.isPending ? 'Updating...' : 'Save Supplier Master'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: 20 },
  profileSection: { alignItems: 'center', marginTop: 20, marginBottom: 25 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  avatarRedHalf: { width: 100, height: 50, backgroundColor: Colors.danger, position: 'absolute', top: 0 },
  avatarInitial: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 40, color: '#000', marginTop: 10 },
  profileName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.textPrimary, marginBottom: 5 },
  profilePerson: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionBtn: { backgroundColor: '#fff', borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center', flex: 1, marginHorizontal: 4, ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  actionIcon: { marginBottom: 6 },
  actionText: { color: Colors.primary, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  section: { marginVertical: 15 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.textPrimary, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textSecondary },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.textPrimary },
  tabContainer: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  formContent: { padding: 20, paddingBottom: 100 },
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: '#FAF9F6', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: Radius.md, paddingHorizontal: 15, paddingVertical: 12, fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textPrimary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 20, marginBottom: 40, ...Shadows.sm },
  submitBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' },
});
"""

with open(FILE_PATH, "w") as f:
    f.write(content)

print("Supplier Detail Screen overwritten with 25+ fields modal!")
