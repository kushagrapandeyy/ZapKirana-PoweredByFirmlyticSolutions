import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Image, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';

export default function InventoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token, role } = useAuth();
  const queryClient = useQueryClient();
  
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockAmount, setStockAmount] = useState('');
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Identification');

  // Huge Form State for Product Schema Parity
  const [formData, setFormData] = useState({
    skuCode: '', name: '', description: '', brand: '', category: '', 
    barcode: '', company: '', group: '', itemType: '', erpStatus: '', erpType: '', colorType: '',
    unit: 'PCS', saleUnit: 'PCS', packing: '', shelfLifeDays: '', conversionToBase: '1', rackNo: '',
    mrp: '', sellingPrice: '', purchaseRate: '', saleRateA: '', saleRateB: '', saleRateC: '', costPerPiece: '', minimumMarginPercent: '',
    hsnSac: '', taxability: '', gstRate: '', sgstPercent: '', cgstPercent: '', igstPercent: '', cessPercent: '', gstClass: 'EXEMPT',
    minimumQty: '', maximumQty: '', reorderQty: '', reorderDays: '', allowNegativeStock: false, allowDecimal: false,
    itemDiscount: '', specialDisc: '', maximumDiscountPercent: '', freeScheme: '', vDisOn: '', subscriptionDiscount: '',
    imageUrl: ''
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['inventory_products', CURRENT_STORE_ID],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const productWrapper = products?.find((p: any) => p.productId === id || p.id === id);
  const product = productWrapper?.product || productWrapper;

  useEffect(() => {
    if (product && isEditModalVisible) {
      setFormData({
        skuCode: product.skuCode || '', name: product.name || '', description: product.description || '', brand: product.brand || '', category: product.category || '',
        barcode: product.barcode || '', company: product.company || '', group: product.group || '', itemType: product.itemType || '', erpStatus: product.erpStatus || '', erpType: product.erpType || '', colorType: product.colorType || '',
        unit: product.unit || 'PCS', saleUnit: product.saleUnit || 'PCS', packing: product.packing || '', shelfLifeDays: product.shelfLifeDays?.toString() || '', conversionToBase: product.conversionToBase?.toString() || '1', rackNo: product.rackNo || '',
        mrp: product.mrp?.toString() || '', sellingPrice: product.sellingPrice?.toString() || '', purchaseRate: product.purchaseRate?.toString() || '', saleRateA: product.saleRateA?.toString() || '', saleRateB: product.saleRateB?.toString() || '', saleRateC: product.saleRateC?.toString() || '', costPerPiece: product.costPerPiece?.toString() || '', minimumMarginPercent: product.minimumMarginPercent?.toString() || '',
        hsnSac: product.hsnSac || '', taxability: product.taxability || '', gstRate: product.gstRate?.toString() || '', sgstPercent: product.sgstPercent?.toString() || '', cgstPercent: product.cgstPercent?.toString() || '', igstPercent: product.igstPercent?.toString() || '', cessPercent: product.cessPercent?.toString() || '', gstClass: product.gstClass || 'EXEMPT',
        minimumQty: product.minimumQty?.toString() || '', maximumQty: product.maximumQty?.toString() || '', reorderQty: product.reorderQty?.toString() || '', reorderDays: product.reorderDays?.toString() || '', allowNegativeStock: product.allowNegativeStock || false, allowDecimal: product.allowDecimal || false,
        itemDiscount: product.itemDiscount?.toString() || '', specialDisc: product.specialDisc?.toString() || '', maximumDiscountPercent: product.maximumDiscountPercent?.toString() || '', freeScheme: product.freeScheme || '', vDisOn: product.vDisOn?.toString() || '', subscriptionDiscount: product.subscriptionDiscount?.toString() || '',
        imageUrl: product.imageUrl || ''
      });
    }
  }, [isEditModalVisible, product]);

  const { data: movements } = useQuery({
    queryKey: ['inventory_ledger', CURRENT_STORE_ID, id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/inventory/ledger?storeId=${CURRENT_STORE_ID}&productId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch movements');
      return res.json();
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      
      // Parse numeric fields
      const numericFields = ['mrp', 'sellingPrice', 'purchaseRate', 'saleRateA', 'saleRateB', 'saleRateC', 'costPerPiece', 'minimumMarginPercent', 'gstRate', 'sgstPercent', 'cgstPercent', 'igstPercent', 'cessPercent', 'minimumQty', 'maximumQty', 'reorderQty', 'reorderDays', 'itemDiscount', 'specialDisc', 'maximumDiscountPercent', 'vDisOn', 'subscriptionDiscount', 'shelfLifeDays', 'conversionToBase'];
      
      numericFields.forEach(field => {
        if (payload[field] !== undefined && payload[field] !== '') {
          payload[field] = parseFloat(payload[field]);
        } else {
          payload[field] = null;
        }
      });

      const res = await fetch(`${API_BASE_URL}/inventory/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory_products', CURRENT_STORE_ID] });
      setIsEditModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update product');
    }
  });

  const handleEditProduct = () => {
    if (!formData.name.trim() || !formData.skuCode.trim()) {
      Alert.alert('Validation Error', 'Product Name and SKU Code are required.');
      return;
    }
    updateProductMutation.mutate(formData);
  };

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderInput = (label: string, key: keyof typeof formData, placeholder: string = '', keyboardType: any = 'default', multiline = false) => (
    <View style={styles.inputGroup} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={[styles.input, multiline && { height: 80 }]} 
        value={String(formData[key] || '')} 
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

  if (isLoadingProducts || !product) {
    return <SafeAreaView style={styles.container}><View style={styles.loader}><Text>Loading...</Text></View></SafeAreaView>;
  }

  const tabs = ['Identification', 'Logistics', 'Pricing', 'Taxation', 'Inventory', 'Discounts'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image' }} 
            style={styles.heroImage} 
            resizeMode="cover" 
          />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productCategory}>{product.category || 'Uncategorized'}</Text>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditModalVisible(true)}>
            <Ionicons name="pencil" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit Full Master</Text>
          </TouchableOpacity>
        </View>

        {/* Key Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Information</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>SKU Code</Text><Text style={styles.infoValue}>{product.skuCode}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Barcode</Text><Text style={styles.infoValue}>{product.barcode || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>MRP</Text><Text style={styles.infoValue}>₹{product.mrp}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Selling Price</Text><Text style={styles.infoValue}>₹{product.sellingPrice}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Current Stock</Text><Text style={styles.infoValue}>{productWrapper?.quantity || 0} {product.unit}</Text></View>
        </View>

        {/* Movement History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movement History</Text>
          {movements?.length === 0 && <Text style={{ color: Colors.textMuted }}>No movements recorded.</Text>}
          {movements?.slice(0, 10).map((mov: any) => (
            <View key={mov.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '600', color: Colors.textPrimary }}>{mov.type.replace(/_/g, ' ')}</Text>
                <Text style={{ fontWeight: '700', color: mov.quantityDeltaBase > 0 ? Colors.success : Colors.error }}>
                  {mov.quantityDeltaBase > 0 ? '+' : ''}{mov.quantityDeltaBase}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>{new Date(mov.createdAt).toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>{mov.note || mov.reason || 'Scanner Scan'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Product Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Master Product Edit</Text>
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
              
              {activeTab === 'Identification' && (
                <View>
                  {renderInput('SKU Code *', 'skuCode')}
                  {renderInput('Product Name *', 'name')}
                  {renderInput('Barcode', 'barcode')}
                  {renderInput('Brand', 'brand')}
                  {renderInput('Company', 'company')}
                  {renderInput('Group', 'group')}
                  {renderInput('Category', 'category')}
                  {renderInput('Item Type', 'itemType')}
                  {renderInput('ERP Status', 'erpStatus')}
                  {renderInput('ERP Type', 'erpType')}
                  {renderInput('Color Type', 'colorType')}
                  {renderInput('Image URL', 'imageUrl', '', 'url')}
                  {renderInput('Description', 'description', '', 'default', true)}
                </View>
              )}

              {activeTab === 'Logistics' && (
                <View>
                  {renderInput('Base Unit', 'unit')}
                  {renderInput('Sale Unit', 'saleUnit')}
                  {renderInput('Packing', 'packing')}
                  {renderInput('Shelf Life (Days)', 'shelfLifeDays', '', 'numeric')}
                  {renderInput('Conversion to Base', 'conversionToBase', '', 'numeric')}
                  {renderInput('Rack Number', 'rackNo')}
                </View>
              )}

              {activeTab === 'Pricing' && (
                <View>
                  {renderInput('MRP', 'mrp', '', 'numeric')}
                  {renderInput('Selling Price', 'sellingPrice', '', 'numeric')}
                  {renderInput('Purchase Rate', 'purchaseRate', '', 'numeric')}
                  {renderInput('Sale Rate A', 'saleRateA', '', 'numeric')}
                  {renderInput('Sale Rate B', 'saleRateB', '', 'numeric')}
                  {renderInput('Sale Rate C', 'saleRateC', '', 'numeric')}
                  {renderInput('Cost Per Piece', 'costPerPiece', '', 'numeric')}
                  {renderInput('Minimum Margin %', 'minimumMarginPercent', '', 'numeric')}
                </View>
              )}

              {activeTab === 'Taxation' && (
                <View>
                  {renderInput('HSN/SAC', 'hsnSac')}
                  {renderInput('Taxability (taxable/exempt/nil)', 'taxability')}
                  {renderInput('GST Class (EXEMPT, ZERO, FIVE, TWELVE, EIGHTEEN, TWENTYEIGHT)', 'gstClass')}
                  {renderInput('GST Rate %', 'gstRate', '', 'numeric')}
                  {renderInput('SGST %', 'sgstPercent', '', 'numeric')}
                  {renderInput('CGST %', 'cgstPercent', '', 'numeric')}
                  {renderInput('IGST %', 'igstPercent', '', 'numeric')}
                  {renderInput('CESS %', 'cessPercent', '', 'numeric')}
                </View>
              )}

              {activeTab === 'Inventory' && (
                <View>
                  {renderInput('Minimum Qty', 'minimumQty', '', 'numeric')}
                  {renderInput('Maximum Qty', 'maximumQty', '', 'numeric')}
                  {renderInput('Reorder Qty', 'reorderQty', '', 'numeric')}
                  {renderInput('Reorder Days', 'reorderDays', '', 'numeric')}
                  {renderSwitch('Allow Negative Stock', 'allowNegativeStock')}
                  {renderSwitch('Allow Decimal Quantity', 'allowDecimal')}
                </View>
              )}

              {activeTab === 'Discounts' && (
                <View>
                  {renderInput('Item Discount %', 'itemDiscount', '', 'numeric')}
                  {renderInput('Special Discount %', 'specialDisc', '', 'numeric')}
                  {renderInput('Max Discount %', 'maximumDiscountPercent', '', 'numeric')}
                  {renderInput('Volume Discount On', 'vDisOn', '', 'numeric')}
                  {renderInput('Subscription Discount %', 'subscriptionDiscount', '', 'numeric')}
                  {renderInput('Free Scheme (e.g. 10+1)', 'freeScheme')}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.submitBtn, updateProductMutation.isPending && { opacity: 0.7 }]} 
                onPress={handleEditProduct}
                disabled={updateProductMutation.isPending}
              >
                <Text style={styles.submitBtnText}>{updateProductMutation.isPending ? 'Updating...' : 'Save Product Master'}</Text>
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary },
  scrollContent: { paddingBottom: 40 },
  imageContainer: { width: '100%', height: 250, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  heroImage: { width: '100%', height: '100%' },
  titleSection: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  productTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 5 },
  productCategory: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', padding: 20, backgroundColor: '#fff' },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.sm },
  actionIcon: { marginRight: 8 },
  actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.primary },
  section: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  infoLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  
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
