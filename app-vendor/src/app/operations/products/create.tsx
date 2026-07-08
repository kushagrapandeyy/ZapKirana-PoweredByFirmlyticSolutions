import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const theme = {
  primary: '#1E293B',    
  secondary: '#3B82F6',  
  accent: '#10B981',     
  background: '#F1F5F9', 
  card: '#FFFFFF',
  text: '#0F172A',       
  textMuted: '#64748B',  
  border: '#E2E8F0',     
  error: '#EF4444'       
};

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

export default function CreateProductMaster() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Massive ERP State Object
  const [formData, setFormData] = useState({
    // Basic (Compulsory)
    barcode: '',
    name: '',
    
    // Classification
    status: 'CONTINUE',
    type: 'NORMAL',
    itemType: '1 NORMAL',
    legacyCode: '',
    packingText: '',
    colorType: 'NORMAL',
    rackNo: '',
    companyName: '',
    group: 'OTHERS',
    category: '',
    allowDecimal: false,
    isHidden: false,

    // Pricing & Tax
    hsnSac: '',
    localTaxability: 'Taxable',
    centralTaxability: 'Taxable',
    sgstRate: '0',
    cgstRate: '0',
    igstRate: '0',
    cessRate: '0',
    mrp: '0',
    sellingPrice: '0',
    purchaseRate: '0',
    costPerPiece: '0',
    rateA: '0',
    rateB: '0',
    rateC: '0',

    // Inventory Rules
    convBox: '0',
    defSaleQty: '0',
    minimumQty: '0',
    maximumQty: '0',
    reorderQty: '0',
    shelflifeDays: '0',
    allowNegative: false,

    // Discount
    itemDisc1: '0',
    itemDisc2: '0',
    specialDisc: '0',
    maxDiscPercent: '0',
    purchaseDisc: '0',
    discLess: '0',
  });

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitProduct = async () => {
    if (!formData.barcode || !formData.name) {
      Alert.alert("Required Fields", "Barcode and Product Name are compulsory.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate backend POST
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert("Product Master Created", `Product ${formData.name} added to Master.`, [
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Product Master</Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={theme.secondary} />
          <Text style={styles.infoBannerText}>Master Product Form. Enter Barcode and Name first, then configure detailed ERP rules below.</Text>
        </View>

        {/* 1. Basic Identity */}
        <Accordion title="Basic & Classification" icon="cube-outline" defaultOpen={true}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode *</Text>
            <View style={styles.barcodeInputRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.barcode} onChangeText={(t) => updateField('barcode', t)} placeholder="Scan or type barcode" keyboardType="numeric" />
              <TouchableOpacity style={styles.scanBtn}>
                <FontAwesome5 name="barcode" size={20} color={theme.card} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} value={formData.name} onChangeText={(t) => updateField('name', t)} placeholder="e.g. AMUL CHAZ 200ML" />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Status</Text>
              <TextInput style={styles.input} value={formData.status} onChangeText={(t) => updateField('status', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Legacy Code</Text>
              <TextInput style={styles.input} value={formData.legacyCode} onChangeText={(t) => updateField('legacyCode', t)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Packing (Text)</Text>
              <TextInput style={styles.input} value={formData.packingText} onChangeText={(t) => updateField('packingText', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Rack No.</Text>
              <TextInput style={styles.input} value={formData.rackNo} onChangeText={(t) => updateField('rackNo', t)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Type</Text>
              <TextInput style={styles.input} value={formData.type} onChangeText={(t) => updateField('type', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Item Type</Text>
              <TextInput style={styles.input} value={formData.itemType} onChangeText={(t) => updateField('itemType', t)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Company (Mfg)</Text>
              <TextInput style={styles.input} value={formData.companyName} onChangeText={(t) => updateField('companyName', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={formData.category} onChangeText={(t) => updateField('category', t)} />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Allow Decimal Qty</Text>
            <Switch value={formData.allowDecimal} onValueChange={(v) => updateField('allowDecimal', v)} trackColor={{ true: theme.accent }} />
          </View>
        </Accordion>

        {/* 2. Pricing & Taxation */}
        <Accordion title="Pricing & Taxation" icon="pricetags-outline">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>HSN / SAC</Text>
            <TextInput style={styles.input} value={formData.hsnSac} onChangeText={(t) => updateField('hsnSac', t)} keyboardType="numeric" />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Local Tax</Text>
              <TextInput style={styles.input} value={formData.localTaxability} onChangeText={(t) => updateField('localTaxability', t)} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Central Tax</Text>
              <TextInput style={styles.input} value={formData.centralTaxability} onChangeText={(t) => updateField('centralTaxability', t)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>SGST %</Text>
              <TextInput style={styles.input} value={formData.sgstRate} onChangeText={(t) => updateField('sgstRate', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
              <Text style={styles.label}>CGST %</Text>
              <TextInput style={styles.input} value={formData.cgstRate} onChangeText={(t) => updateField('cgstRate', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>IGST %</Text>
              <TextInput style={styles.input} value={formData.igstRate} onChangeText={(t) => updateField('igstRate', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>M.R.P.</Text>
              <TextInput style={styles.input} value={formData.mrp} onChangeText={(t) => updateField('mrp', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Selling Price</Text>
              <TextInput style={styles.input} value={formData.sellingPrice} onChangeText={(t) => updateField('sellingPrice', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>P.RATE (Purchase)</Text>
              <TextInput style={styles.input} value={formData.purchaseRate} onChangeText={(t) => updateField('purchaseRate', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>COST/PCS</Text>
              <TextInput style={styles.input} value={formData.costPerPiece} onChangeText={(t) => updateField('costPerPiece', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Rate-A (Wholesale)</Text>
              <TextInput style={styles.input} value={formData.rateA} onChangeText={(t) => updateField('rateA', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Rate-B</Text>
              <TextInput style={styles.input} value={formData.rateB} onChangeText={(t) => updateField('rateB', t)} keyboardType="numeric" />
            </View>
          </View>
        </Accordion>

        {/* 3. Inventory Rules */}
        <Accordion title="Inventory Rules" icon="bar-chart-outline">
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>CONV.BOX</Text>
              <TextInput style={styles.input} value={formData.convBox} onChangeText={(t) => updateField('convBox', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Def. Sale Qty</Text>
              <TextInput style={styles.input} value={formData.defSaleQty} onChangeText={(t) => updateField('defSaleQty', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Min Qty</Text>
              <TextInput style={styles.input} value={formData.minimumQty} onChangeText={(t) => updateField('minimumQty', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
              <Text style={styles.label}>Max Qty</Text>
              <TextInput style={styles.input} value={formData.maximumQty} onChangeText={(t) => updateField('maximumQty', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Reorder Qty</Text>
              <TextInput style={styles.input} value={formData.reorderQty} onChangeText={(t) => updateField('reorderQty', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Shelflife (Days)</Text>
              <TextInput style={styles.input} value={formData.shelflifeDays} onChangeText={(t) => updateField('shelflifeDays', t)} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1, marginLeft: 8, justifyContent: 'center' }}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Negative Stock</Text>
                <Switch value={formData.allowNegative} onValueChange={(v) => updateField('allowNegative', v)} trackColor={{ true: theme.accent }} />
              </View>
            </View>
          </View>
        </Accordion>

        {/* 4. Discount & Schemes */}
        <Accordion title="Discount & Schemes" icon="gift-outline">
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Item Disc 1 (%)</Text>
              <TextInput style={styles.input} value={formData.itemDisc1} onChangeText={(t) => updateField('itemDisc1', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Item Disc 2 (%)</Text>
              <TextInput style={styles.input} value={formData.itemDisc2} onChangeText={(t) => updateField('itemDisc2', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Special Disc (%)</Text>
              <TextInput style={styles.input} value={formData.specialDisc} onChangeText={(t) => updateField('specialDisc', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Max Disc (%)</Text>
              <TextInput style={styles.input} value={formData.maxDiscPercent} onChangeText={(t) => updateField('maxDiscPercent', t)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Purc. Disc (%)</Text>
              <TextInput style={styles.input} value={formData.purchaseDisc} onChangeText={(t) => updateField('purchaseDisc', t)} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Disc. Less (%)</Text>
              <TextInput style={styles.input} value={formData.discLess} onChangeText={(t) => updateField('discLess', t)} keyboardType="numeric" />
            </View>
          </View>
        </Accordion>

      </ScrollView>

      {/* Floating Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={submitProduct} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={theme.card} />
          ) : (
            <Text style={styles.saveBtnText}>Save Product Master</Text>
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: theme.text },
  
  barcodeInputRow: { flexDirection: 'row', alignItems: 'center' },
  scanBtn: { backgroundColor: theme.primary, padding: 14, borderRadius: 8, marginLeft: 12, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  saveBtn: { backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: theme.card, fontSize: 16, fontWeight: '700' },
});
