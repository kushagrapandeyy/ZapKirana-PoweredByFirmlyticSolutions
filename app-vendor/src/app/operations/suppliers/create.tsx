import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

// Theme constants matching vendor app
const theme = {
  primary: '#1E293B',    // Slate 800
  secondary: '#3B82F6',  // Blue 500
  accent: '#10B981',     // Emerald 500
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  text: '#0F172A',       // Slate 900
  textMuted: '#64748B',  // Slate 500
  border: '#E2E8F0',     // Slate 200
  error: '#EF4444'       // Red 500
};

type WizardStep = 1 | 2 | 3;

export default function CreateSupplierWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiValidating, setIsGeminiValidating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basics
    name: '',
    contactPerson: '',
    phone: '',
    station: '',
    
    // Step 2: Taxes & Legal
    gstin: '',
    pan: '',
    address: '',
    
    // Step 3: Fast-Track ERP
    creditDays: '15',
    ledgerGroup: 'Sundry Creditors',
  });

  const validateGstinWithGemini = async () => {
    if (!formData.gstin || formData.gstin.length !== 15) {
      Alert.alert("Invalid GSTIN", "Please enter a valid 15-character GSTIN.");
      return;
    }
    
    setIsGeminiValidating(true);
    try {
      // Mocked Gemini validation logic - would hit backend /gemini/validate-gstin
      setTimeout(() => {
        // Auto-extract PAN from GSTIN (digits 3-12)
        const extractedPan = formData.gstin.substring(2, 12);
        setFormData(prev => ({
          ...prev,
          pan: extractedPan,
        }));
        Alert.alert("GSTIN Verified", "Gemini successfully verified this GSTIN and extracted the PAN.");
        setIsGeminiValidating(false);
      }, 1500);
    } catch (err: any) {
      Alert.alert("Error", err.message);
      setIsGeminiValidating(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.phone)) {
      Alert.alert("Required", "Company name and phone are required.");
      return;
    }
    setStep((prev) => (prev < 3 ? (prev + 1) as WizardStep : prev));
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? (prev - 1) as WizardStep : prev));
  };

  const submitSupplier = async () => {
    setIsLoading(true);
    try {
      // Mocked backend connection to real ERP schemas
      const res = await fetch('http://localhost:3000/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contactPerson,
          contactPhone: formData.phone,
          station: formData.station,
          gstin: formData.gstin,
          pan: formData.pan,
          address: formData.address,
          creditDays: Number(formData.creditDays),
          accountGroup: formData.ledgerGroup,
        })
      });

      if (!res.ok) throw new Error("Failed to create supplier ledger");
      
      Alert.alert("Success", "Supplier Ledger created successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Ledger Account</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 3</Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Info</Text>
            <Text style={styles.stepSubtitle}>Identify the supplier / party ledger.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="e.g. Amazon Distributors Pvt. Ltd."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Contact Person</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contactPerson}
                  onChangeText={(t) => setFormData({ ...formData, contactPerson: t })}
                  placeholder="e.g. Rahul"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Station/City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.station}
                  onChangeText={(t) => setFormData({ ...formData, station: t })}
                  placeholder="e.g. Delhi"
                />
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Taxes & Address</Text>
            <Text style={styles.stepSubtitle}>Essential for GST and billing compliance.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GSTIN</Text>
              <View style={styles.gstinRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={formData.gstin}
                  onChangeText={(t) => setFormData({ ...formData, gstin: t.toUpperCase() })}
                  placeholder="e.g. 07AAFCA9197E1ZF"
                  maxLength={15}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={[styles.geminiBtn, isGeminiValidating && { opacity: 0.7 }]} 
                  onPress={validateGstinWithGemini}
                  disabled={isGeminiValidating}
                >
                  {isGeminiValidating ? (
                    <ActivityIndicator color={theme.card} size="small" />
                  ) : (
                    <FontAwesome5 name="magic" size={16} color={theme.card} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Tap the magic wand to validate via Gemini</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PAN</Text>
              <TextInput
                style={styles.input}
                value={formData.pan}
                onChangeText={(t) => setFormData({ ...formData, pan: t.toUpperCase() })}
                placeholder="Auto-filled from GSTIN"
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Address</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formData.address}
                onChangeText={(t) => setFormData({ ...formData, address: t })}
                placeholder="Billing address..."
                multiline
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Trading Terms</Text>
            <Text style={styles.stepSubtitle}>Smart defaults applied automatically.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Ledger Group</Text>
              <TextInput
                style={styles.input}
                value={formData.ledgerGroup}
                onChangeText={(t) => setFormData({ ...formData, ledgerGroup: t })}
                placeholder="Sundry Creditors"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Credit Days</Text>
              <TextInput
                style={styles.input}
                value={formData.creditDays}
                onChangeText={(t) => setFormData({ ...formData, creditDays: t })}
                keyboardType="numeric"
                placeholder="15"
              />
            </View>

            <View style={styles.infoBox}>
              <FontAwesome5 name="info-circle" size={16} color={theme.secondary} />
              <Text style={styles.infoBoxText}>
                Advanced payment policies (Hold Payment %, Overdue Interest) can be managed later from the Supplier Detail screen.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity style={styles.footerBtnSecondary} onPress={prevStep}>
            <Text style={styles.footerBtnSecondaryText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        
        {step < 3 ? (
          <TouchableOpacity style={styles.footerBtnPrimary} onPress={nextStep}>
            <Text style={styles.footerBtnPrimaryText}>Continue</Text>
            <FontAwesome5 name="arrow-right" size={14} color={theme.card} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.footerBtnAccent} onPress={submitSupplier} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={theme.card} />
            ) : (
              <>
                <Text style={styles.footerBtnPrimaryText}>Save Ledger</Text>
                <FontAwesome5 name="check" size={14} color={theme.card} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, // Safe area roughly
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gstinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geminiBtn: {
    backgroundColor: '#8B5CF6', // Purple for AI
    padding: 16,
    borderRadius: 12,
    marginLeft: 12,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginTop: 20,
  },
  infoBoxText: {
    flex: 1,
    marginLeft: 12,
    color: theme.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  footerBtnSecondary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerBtnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  footerBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: theme.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnAccent: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.card,
  },
});
