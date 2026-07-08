import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';

const theme = {
  primary: '#1E293B',    // Slate 800
  secondary: '#3B82F6',  // Blue 500
  accent: '#10B981',     // Emerald 500
  background: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  text: '#0F172A',       // Slate 900
  textMuted: '#64748B',  // Slate 500
  border: '#E2E8F0',     // Slate 200
  error: '#EF4444'       // Red 500
};

// Simple inline Accordion component
const Accordion = ({ title, icon, children, defaultOpen = false }: { title: string, icon: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.accordionIcon}>
            <Ionicons name={icon as any} size={18} color={theme.secondary} />
          </View>
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.textMuted} />
      </TouchableOpacity>
      {isOpen && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.accordionBody}>
          {children}
        </Animated.View>
      )}
    </View>
  );
};

export default function CreateSupplierLedger() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiValidating, setIsGeminiValidating] = useState(false);

  // Massive ERP State Object
  const [formData, setFormData] = useState({
    // Basic Identity (Compulsory)
    name: '',
    mobile: '',
    station: '',
    accountGroup: 'SUNDRY CREDITORS',

    // Contact
    contactPerson: '',
    designation: '',
    phoneOff: '',
    phoneRes: '',
    email: '',
    website: '',
    address: '',
    pincode: '',
    state: '',
    country: 'INDIA',

    // Tax & Legal
    gstin: '',
    pan: '',
    foodLicenseNo: '',
    regNo: '',
    gstHeading: 'Local',
    vatHeading: '',

    // Accounting
    openingBalance: '0',
    openingBalanceType: 'CR',
    balancingMethod: 'Bill by Bill',
    ledgerCategory: 'OTHERS',
    ledgerType: 'REGISTERED',
    holdPayment: 'No',
    creditDays: '15',
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateGstinWithGemini = async () => {
    if (!formData.gstin || formData.gstin.length !== 15) {
      Alert.alert("Invalid GSTIN", "Please enter a valid 15-character GSTIN.");
      return;
    }
    
    setIsGeminiValidating(true);
    try {
      // Mock Gemini extraction
      setTimeout(() => {
        const extractedPan = formData.gstin.substring(2, 12);
        updateField('pan', extractedPan);
        Alert.alert("GSTIN Verified", "Gemini extracted the PAN successfully.");
        setIsGeminiValidating(false);
      }, 1000);
    } catch (err: any) {
      Alert.alert("Error", err.message);
      setIsGeminiValidating(false);
    }
  };

  const submitSupplier = async () => {
    if (!formData.name || !formData.mobile) {
      Alert.alert("Required Fields", "Ledger Name and Mobile Number are compulsory.");
      return;
    }

    setIsLoading(true);
    try {
      // In reality, this points to our backend POST /suppliers/legacy
      // For now, simulating the network request
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert("Ledger Created", `Supplier ${formData.name} added to Master.`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Ledger (Supplier)</Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={theme.secondary} />
          <Text style={styles.infoBannerText}>Master Ledger Form. Fill the compulsory fields in Basic Identity. Other sections are optional for detailed ERP tracking.</Text>
        </View>

        {/* 1. Basic Identity */}
        <Accordion title="Basic Identity" icon="person-outline" defaultOpen={true}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ledger Name (Company) *</Text>
            <TextInput style={styles.input} value={formData.name} onChangeText={(t) => updateField('name', t)} placeholder="e.g. Amazon Distributors Pvt. Ltd." />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput style={styles.input} value={formData.mobile} onChangeText={(t) => updateField('mobile', t)} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Station</Text>
              <TextInput style={styles.input} value={formData.station} onChangeText={(t) => updateField('station', t)} placeholder="e.g. Delhi" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Account Group</Text>
              <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={formData.accountGroup} editable={false} />
            </View>
          </View>
        </Accordion>

        {/* 2. Contact & Communication */}
        <Accordion title="Contact & Communication" icon="call-outline">
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput style={styles.input} value={formData.contactPerson} onChangeText={(t) => updateField('contactPerson', t)} placeholder="Name" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Designation</Text>
              <TextInput style={styles.input} value={formData.designation} onChangeText={(t) => updateField('designation', t)} placeholder="e.g. Manager" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Phone (Off.)</Text>
              <TextInput style={styles.input} value={formData.phoneOff} onChangeText={(t) => updateField('phoneOff', t)} keyboardType="phone-pad" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Phone (Res.)</Text>
              <TextInput style={styles.input} value={formData.phoneRes} onChangeText={(t) => updateField('phoneRes', t)} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={formData.address} onChangeText={(t) => updateField('address', t)} placeholder="Full Billing Address" multiline />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City/State</Text>
              <TextInput style={styles.input} value={formData.state} onChangeText={(t) => updateField('state', t)} placeholder="e.g. 07-DELHI" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pin Code</Text>
              <TextInput style={styles.input} value={formData.pincode} onChangeText={(t) => updateField('pincode', t)} keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={formData.email} onChangeText={(t) => updateField('email', t)} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </Accordion>

        {/* 3. Tax & Legal */}
        <Accordion title="Taxation & Legal" icon="document-text-outline">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GSTIN</Text>
            <View style={styles.gstinRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.gstin} onChangeText={(t) => updateField('gstin', t.toUpperCase())} placeholder="e.g. 07AAFCA9197E1ZF" maxLength={15} autoCapitalize="characters" />
              <TouchableOpacity style={styles.geminiBtn} onPress={validateGstinWithGemini} disabled={isGeminiValidating}>
                {isGeminiValidating ? <ActivityIndicator color={theme.card} size="small" /> : <FontAwesome5 name="magic" size={16} color={theme.card} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>I.T. PAN No.</Text>
              <TextInput style={styles.input} value={formData.pan} onChangeText={(t) => updateField('pan', t.toUpperCase())} autoCapitalize="characters" maxLength={10} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Food Licence No.</Text>
              <TextInput style={styles.input} value={formData.foodLicenseNo} onChangeText={(t) => updateField('foodLicenseNo', t)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>GST Heading</Text>
              <TextInput style={styles.input} value={formData.gstHeading} onChangeText={(t) => updateField('gstHeading', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Reg. No.</Text>
              <TextInput style={styles.input} value={formData.regNo} onChangeText={(t) => updateField('regNo', t)} />
            </View>
          </View>
        </Accordion>

        {/* 4. Accounting Setup */}
        <Accordion title="Accounting Setup" icon="calculator-outline">
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Opening Bal.</Text>
              <TextInput style={styles.input} value={formData.openingBalance} onChangeText={(t) => updateField('openingBalance', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Bal. Type (CR/DR)</Text>
              <TextInput style={styles.input} value={formData.openingBalanceType} onChangeText={(t) => updateField('openingBalanceType', t.toUpperCase())} maxLength={2} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Balancing Method</Text>
              <TextInput style={styles.input} value={formData.balancingMethod} onChangeText={(t) => updateField('balancingMethod', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Hold Payment</Text>
              <TextInput style={styles.input} value={formData.holdPayment} onChangeText={(t) => updateField('holdPayment', t)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Ledger Type</Text>
              <TextInput style={styles.input} value={formData.ledgerType} onChangeText={(t) => updateField('ledgerType', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Ledger Category</Text>
              <TextInput style={styles.input} value={formData.ledgerCategory} onChangeText={(t) => updateField('ledgerCategory', t)} />
            </View>
          </View>
        </Accordion>

      </ScrollView>

      {/* Floating Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={submitSupplier} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={theme.card} />
          ) : (
            <Text style={styles.saveBtnText}>Save Master Ledger</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  
  content: { flex: 1, padding: 16 },
  
  infoBanner: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'flex-start' },
  infoBannerText: { flex: 1, marginLeft: 12, color: theme.secondary, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  
  accordionContainer: { backgroundColor: theme.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: theme.card },
  accordionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  accordionBody: { padding: 16, paddingTop: 0, backgroundColor: theme.card },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: theme.textMuted, marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 15, color: theme.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  gstinRow: { flexDirection: 'row', alignItems: 'center' },
  geminiBtn: { backgroundColor: '#8B5CF6', padding: 14, borderRadius: 8, marginLeft: 12, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  saveBtn: { backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: theme.card, fontSize: 16, fontWeight: '700' },
});
