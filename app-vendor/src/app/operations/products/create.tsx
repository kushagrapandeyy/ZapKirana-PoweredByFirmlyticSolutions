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

export default function CreateProductWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    
    // Pricing
    mrp: '',
    sellingPrice: '',
    purchasePrice: '',
    gstRate: '0',
    
    // Quick ERP (Optional)
    reorderQty: '',
    allowDecimal: false,
  });

  const nextStep = () => {
    if (step === 1 && !formData.name) {
      Alert.alert("Required", "Product name is required.");
      return;
    }
    if (step === 2 && (!formData.mrp || !formData.sellingPrice)) {
      Alert.alert("Required", "MRP and Selling Price are required.");
      return;
    }
    setStep((prev) => (prev < 3 ? (prev + 1) as WizardStep : prev));
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? (prev - 1) as WizardStep : prev));
  };

  const submitProduct = async () => {
    setIsLoading(true);
    try {
      // API call to backend (mocked for now, will connect to updated backend)
      const res = await fetch('http://localhost:3000/catalog/products/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: formData.barcode,
          suggestedName: formData.name,
          category: formData.category,
          mrp: Number(formData.mrp),
          sellingPrice: Number(formData.sellingPrice),
          purchasePrice: Number(formData.purchasePrice),
          gstRate: Number(formData.gstRate),
          // Additional fast-track fields can be mapped here
        })
      });

      if (!res.ok) throw new Error("Failed to create product");
      
      Alert.alert("Success", "Product added to catalog pending approval.", [
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
        <Text style={styles.headerTitle}>New Product</Text>
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
            <Text style={styles.stepSubtitle}>Identify the product for your catalog.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barcode (Scan or Type)</Text>
              <View style={styles.barcodeInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={formData.barcode}
                  onChangeText={(t) => setFormData({ ...formData, barcode: t })}
                  placeholder="890123456789"
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.scanBtn}>
                  <FontAwesome5 name="barcode" size={20} color={theme.card} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="e.g. Parle-G Original 800g"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(t) => setFormData({ ...formData, category: t })}
                placeholder="e.g. Biscuits & Cookies"
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pricing & Tax</Text>
            <Text style={styles.stepSubtitle}>Set how much you sell and buy this for.</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>MRP (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mrp}
                  onChangeText={(t) => setFormData({ ...formData, mrp: t })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.sellingPrice}
                  onChangeText={(t) => setFormData({ ...formData, sellingPrice: t })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Cost Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.purchasePrice}
                  onChangeText={(t) => setFormData({ ...formData, purchasePrice: t })}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>GST Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gstRate}
                  onChangeText={(t) => setFormData({ ...formData, gstRate: t })}
                  keyboardType="numeric"
                  placeholder="0, 5, 12, 18, 28"
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Fast-Track ERP (Optional)</Text>
            <Text style={styles.stepSubtitle}>Skip these to use smart defaults.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Low Stock Alert Level (Qty)</Text>
              <TextInput
                style={styles.input}
                value={formData.reorderQty}
                onChangeText={(t) => setFormData({ ...formData, reorderQty: t })}
                keyboardType="numeric"
                placeholder="e.g. 10"
              />
            </View>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, allowDecimal: !formData.allowDecimal })}
            >
              <View style={[styles.checkbox, formData.allowDecimal && styles.checkboxChecked]}>
                {formData.allowDecimal && <FontAwesome5 name="check" size={12} color={theme.card} />}
              </View>
              <Text style={styles.checkboxLabel}>Allow Decimal Quantities (e.g. for loose items)</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <FontAwesome5 name="info-circle" size={16} color={theme.secondary} />
              <Text style={styles.infoBoxText}>
                Additional ERP policies (schemes, tier pricing, exact shelf locations) can be managed later from the Product Detail screen.
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
          <TouchableOpacity style={styles.footerBtnAccent} onPress={submitProduct} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={theme.card} />
            ) : (
              <>
                <Text style={styles.footerBtnPrimaryText}>Save Product</Text>
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
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBtn: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    marginLeft: 12,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: theme.secondary,
    borderColor: theme.secondary,
  },
  checkboxLabel: {
    fontSize: 15,
    color: theme.text,
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
