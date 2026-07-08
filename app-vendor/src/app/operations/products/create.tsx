import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Switch, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';

// =====================================================
// THEME
// =====================================================

const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#047857',    // Deep grocery green
  danger: '#DC2626',
  text: '#0F172A',
  textSub: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  marg: '#059669',       // MARG label color
  import: '#7C3AED',     // Import badge color
  warning: '#D97706',
};

// =====================================================
// HELPERS
// =====================================================

const label = (text: string, marg?: string, required?: boolean) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={[s.label, required && s.labelRequired]}>
      {text}{required ? ' *' : ''}
    </Text>
    {marg && <Text style={s.margLabel}>MARG: {marg}</Text>}
  </View>
);

const inp = (
  value: string,
  onChange: (v: string) => void,
  opts?: { keyboardType?: any; placeholder?: string; multiline?: boolean; editable?: boolean; mono?: boolean }
) => (
  <TextInput
    style={[s.input, opts?.multiline && { height: 72, textAlignVertical: 'top' }, opts?.mono && { fontFamily: 'monospace' }, opts?.editable === false && { backgroundColor: '#F1F5F9', color: T.textSub }]}
    value={value}
    onChangeText={onChange}
    keyboardType={opts?.keyboardType ?? 'default'}
    placeholder={opts?.placeholder ?? ''}
    placeholderTextColor={T.textMuted}
    multiline={opts?.multiline}
    editable={opts?.editable !== false}
  />
);

// =====================================================
// ACCORDION
// =====================================================

const Accordion = ({ title, icon, children, defaultOpen = false, badge }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={s.acc}>
      <TouchableOpacity style={s.accHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.accIconBox}><Ionicons name={icon as any} size={16} color={T.primary} /></View>
          <Text style={s.accTitle}>{title}</Text>
          {badge && <View style={s.accBadge}><Text style={s.accBadgeText}>{badge}</Text></View>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={T.textSub} />
      </TouchableOpacity>
      {open && (
        <Animated.View entering={FadeInDown.duration(180)} style={s.accBody}>
          {children}
        </Animated.View>
      )}
    </View>
  );
};

// =====================================================
// ROW LAYOUT HELPERS
// =====================================================

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>
);
const Col = ({ children, flex = 1 }: { children: React.ReactNode; flex?: number }) => (
  <View style={{ flex }}>{children}</View>
);

// =====================================================
// GST PREVIEW PANEL
// =====================================================

interface GstPreview { mrp: number; taxInclusive: boolean; gstRate: number; cgstRate: number; sgstRate: number; taxableValue: number; gstAmount: number; finalSalePrice: number; }

const GstPreviewPanel = ({ preview, warnings }: { preview: GstPreview | null; warnings: string[] }) => {
  if (!preview && warnings.length === 0) return null;
  return (
    <View style={s.gstPanel}>
      {preview && (
        <>
          <Text style={s.gstPanelTitle}>GST Calculation Preview</Text>
          <View style={s.gstRow}><Text style={s.gstKey}>MRP</Text><Text style={s.gstVal}>₹{preview.mrp.toFixed(2)}</Text></View>
          <View style={s.gstRow}><Text style={s.gstKey}>Tax Inclusive</Text><Text style={s.gstVal}>{preview.taxInclusive ? 'Yes' : 'No'}</Text></View>
          <View style={s.gstRow}><Text style={s.gstKey}>GST Rate</Text><Text style={s.gstVal}>{preview.gstRate}% (CGST {preview.cgstRate}% + SGST {preview.sgstRate}%)</Text></View>
          <View style={[s.gstRow, { borderTopWidth: 1, borderTopColor: T.border, marginTop: 6, paddingTop: 6 }]}>
            <Text style={s.gstKey}>Taxable Value</Text><Text style={s.gstVal}>₹{preview.taxableValue.toFixed(2)}</Text>
          </View>
          <View style={s.gstRow}><Text style={s.gstKey}>GST Amount</Text><Text style={s.gstVal}>₹{preview.gstAmount.toFixed(2)}</Text></View>
          <View style={s.gstRow}><Text style={[s.gstKey, { fontWeight: '700', color: T.text }]}>Final Sale Price</Text><Text style={[s.gstVal, { fontWeight: '700', color: T.primary }]}>₹{preview.finalSalePrice.toFixed(2)}</Text></View>
        </>
      )}
      {warnings.map((w, i) => (
        <View key={i} style={s.warningRow}>
          <Ionicons name="warning-outline" size={14} color={T.warning} />
          <Text style={s.warningText}>{w}</Text>
        </View>
      ))}
    </View>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ProductMasterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeProductId = params.id as string | undefined;
  const isEdit = !!storeProductId;

  const [mode, setMode] = useState<'simple' | 'erp'>('erp');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [gstPreview, setGstPreview] = useState<GstPreview | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importMeta, setImportMeta] = useState<{ source?: string; legacyCode?: string } | null>(null);

  // ---- Section State ----
  const [identity, setIdentity] = useState({ barcode: '', displayName: '', name: '', legacyCode: '', baseUnit: 'Pcs', status: 'CONTINUE', type: 'NORMAL', itemType: '1 NORMAL', packagingText: '', colorType: 'NORMAL', isHidden: false, allowDecimalQty: false, manufacturerLegacyRef: '' });
  const [classification, setClassification] = useState({ companyName: '', manufacturerName: '', groupName: '', categoryName: '', hsnSac: '' });
  const [tax, setTax] = useState({ localTaxability: 'Taxable', centralTaxability: 'Taxable', sgst: '0', cgst: '0', igst: '0', cess: '0', cessAmt: '0', taxInclusive: true });
  const [pricing, setPricing] = useState({ mrp: '0', sellingPrice: '0', rateA: '0', rateB: '0', rateC: '0', purchaseRate: '0', costPerPiece: '0', landingCost: '0' });
  const [inventory, setInventory] = useState({ convBox: '0', defSaleQty: '1', minQty: '0', maxQty: '0', reorderQty: '0', shelflife: '0', allowNegative: false, trackBatch: false, trackExpiry: false, trackSerial: false, stockUom: 'Pcs', saleUom: 'Pcs', purchaseUom: 'Pcs' });
  const [discount, setDiscount] = useState({ applicable: false, visibleOn: '0', disc1: '0', disc2: '0', specialDisc: '0', maxDisc: '0', purchaseDisc: '0', discLess: '0', rateOverride: false });
  const [rack, setRack] = useState({ rackNo: '', shelfNo: '', binNo: '', zone: '' });

  const up = (setter: React.Dispatch<React.SetStateAction<any>>, field: string, value: any) =>
    setter((prev: any) => ({ ...prev, [field]: value }));

  // ---- Load existing product ----
  useEffect(() => {
    if (!storeProductId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/${storeProductId}/master`);
        if (!res.ok) return;
        const d = await res.json();

        const sp = d;
        const p = d.product;
        const pr = d.pricing?.[0];
        const tx = d.taxProfile?.[0];
        const inv = d.inventoryPolicy;
        const disc = d.discountPolicy;
        const r = d.rackLocations?.[0];
        const bc = d.productBarcodes?.[0];

        setIdentity({ barcode: bc?.barcode ?? '', displayName: sp.displayName ?? '', name: p?.name ?? '', legacyCode: sp.legacyCode ?? '', baseUnit: p?.baseUnit ?? 'Pcs', status: sp.status ?? 'CONTINUE', type: sp.type ?? 'NORMAL', itemType: sp.itemType ?? '1 NORMAL', packagingText: sp.packagingText ?? '', colorType: sp.colorType ?? 'NORMAL', isHidden: sp.isHidden ?? false, allowDecimalQty: sp.allowDecimalQty ?? false, manufacturerLegacyRef: sp.manufacturerLegacyRef ?? '' });
        setClassification({ companyName: p?.brand?.name ?? '', manufacturerName: p?.manufacturer?.name ?? '', groupName: p?.group?.name ?? '', categoryName: p?.category?.name ?? '', hsnSac: tx?.hsnSacCode ?? p?.hsnSacCode ?? '' });
        setTax({ localTaxability: tx?.localTaxabilityStatus ?? 'Taxable', centralTaxability: tx?.centralTaxabilityStatus ?? 'Taxable', sgst: String(tx?.sgstRate ?? 0), cgst: String(tx?.cgstRate ?? 0), igst: String(tx?.igstRate ?? 0), cess: String(tx?.cessRate ?? 0), cessAmt: String(tx?.cessAmountPerUnit ?? 0), taxInclusive: tx?.taxInclusive ?? true });
        setPricing({ mrp: String(pr?.mrp ?? 0), sellingPrice: String(pr?.sellingPrice ?? 0), rateA: String(pr?.rateA ?? 0), rateB: String(pr?.rateB ?? 0), rateC: String(pr?.rateC ?? 0), purchaseRate: String(pr?.purchaseRate ?? 0), costPerPiece: String(pr?.costPerPiece ?? 0), landingCost: String(pr?.landingCost ?? 0) });
        setInventory({ convBox: String(inv?.boxConversionQty ?? 0), defSaleQty: String(inv?.defaultSaleQty ?? 1), minQty: String(inv?.minimumQty ?? 0), maxQty: String(inv?.maximumQty ?? 0), reorderQty: String(inv?.reorderQty ?? 0), shelflife: String(inv?.shelfLifeDays ?? 0), allowNegative: inv?.allowNegativeStock ?? false, trackBatch: inv?.trackBatch ?? false, trackExpiry: inv?.trackExpiry ?? false, trackSerial: inv?.trackSerial ?? false, stockUom: inv?.stockUom ?? 'Pcs', saleUom: inv?.saleUom ?? 'Pcs', purchaseUom: inv?.purchaseUom ?? 'Pcs' });
        setDiscount({ applicable: disc?.discountApplicable ?? false, visibleOn: String(disc?.visibleDiscountOn ?? 0), disc1: String(disc?.itemDiscount1Percent ?? 0), disc2: String(disc?.itemDiscount2Percent ?? 0), specialDisc: String(disc?.specialDiscountPercent ?? 0), maxDisc: String(disc?.maximumDiscountPercent ?? 0), purchaseDisc: String(disc?.purchaseDiscountPercent ?? 0), discLess: String(disc?.discountLessPercent ?? 0), rateOverride: disc?.rateOverrideAllowed ?? false });
        setRack({ rackNo: r?.rackNo ?? '', shelfNo: r?.shelfNo ?? '', binNo: r?.binNo ?? '', zone: r?.zone ?? '' });
        if (sp.source === 'erp_import' && sp.legacyCode) setImportMeta({ source: 'MARG ERP', legacyCode: sp.legacyCode });
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    load();
  }, [storeProductId]);

  // ---- Live GST Preview ----
  const runValidation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing: { mrp: Number(pricing.mrp), sellingPrice: Number(pricing.sellingPrice), purchaseRate: Number(pricing.purchaseRate) }, taxProfile: { cgstRate: Number(tax.cgst), sgstRate: Number(tax.sgst), igstRate: Number(tax.igst), taxInclusive: tax.taxInclusive } }),
      });
      if (res.ok) {
        const r = await res.json();
        setGstPreview(r.gstPreview);
        setValidationErrors(r.errors);
      }
    } catch { /* offline / not yet started */ }
  }, [pricing.mrp, pricing.sellingPrice, pricing.purchaseRate, tax.cgst, tax.sgst, tax.igst, tax.taxInclusive]);

  useEffect(() => { runValidation(); }, [runValidation]);

  // ---- Save ----
  const handleSave = async () => {
    if (!identity.name && !identity.displayName) { Alert.alert('Required', 'Product Name is required.'); return; }
    if (!isEdit && !identity.barcode) { Alert.alert('Required', 'Barcode is required.'); return; }

    setSaving(true);
    try {
      const payload = {
        storeProduct: { displayName: identity.displayName, legacyCode: identity.legacyCode, status: identity.status, type: identity.type, itemType: identity.itemType, isHidden: identity.isHidden, allowDecimalQty: identity.allowDecimalQty, packagingText: identity.packagingText, colorType: identity.colorType, manufacturerLegacyRef: identity.manufacturerLegacyRef },
        product: { name: identity.name, baseUnit: identity.baseUnit },
        pricing: { mrp: Number(pricing.mrp), sellingPrice: Number(pricing.sellingPrice), rateA: Number(pricing.rateA), rateB: Number(pricing.rateB), rateC: Number(pricing.rateC), purchaseRate: Number(pricing.purchaseRate), costPerPiece: Number(pricing.costPerPiece), landingCost: Number(pricing.landingCost) },
        taxProfile: { hsnSacCode: classification.hsnSac, localTaxabilityStatus: tax.localTaxability, centralTaxabilityStatus: tax.centralTaxability, cgstRate: Number(tax.cgst), sgstRate: Number(tax.sgst), igstRate: Number(tax.igst), cessRate: Number(tax.cess), cessAmountPerUnit: Number(tax.cessAmt), taxInclusive: tax.taxInclusive },
        inventoryPolicy: { allowNegativeStock: inventory.allowNegative, boxConversionQty: Number(inventory.convBox), defaultSaleQty: Number(inventory.defSaleQty), minimumQty: Number(inventory.minQty), maximumQty: Number(inventory.maxQty), reorderQty: Number(inventory.reorderQty), shelfLifeDays: Number(inventory.shelflife), trackBatch: inventory.trackBatch, trackExpiry: inventory.trackExpiry, trackSerial: inventory.trackSerial, stockUom: inventory.stockUom, saleUom: inventory.saleUom, purchaseUom: inventory.purchaseUom },
        discountPolicy: { discountApplicable: discount.applicable, itemDiscount1Percent: Number(discount.disc1), itemDiscount2Percent: Number(discount.disc2), specialDiscountPercent: Number(discount.specialDisc), maximumDiscountPercent: Number(discount.maxDisc), purchaseDiscountPercent: Number(discount.purchaseDisc), discountLessPercent: Number(discount.discLess), rateOverrideAllowed: discount.rateOverride },
        rack: { rackNo: rack.rackNo, shelfNo: rack.shelfNo, binNo: rack.binNo, zone: rack.zone },
        updatedBy: 'vendor_app',
      };

      let res: Response;
      if (isEdit) {
        res = await fetch(`${API_BASE_URL}/products/${storeProductId}/master`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API_BASE_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: CURRENT_STORE_ID, createdBy: 'vendor_app', name: identity.name, barcode: identity.barcode, ...payload.storeProduct, ...payload.pricing, ...payload.taxProfile, ...payload.inventoryPolicy }) });
      }

      if (res.ok) {
        Alert.alert('Saved', `Product master ${isEdit ? 'updated' : 'created'} successfully.`, [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message ?? 'Failed to save.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator style={{ marginTop: 60 }} color={T.primary} /></SafeAreaView>;

  const isErp = mode === 'erp';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {identity.displayName || identity.name || 'New Product'}
          </Text>
          {identity.legacyCode ? <Text style={s.headerSub}>Code: {identity.legacyCode}</Text> : null}
        </View>
        {/* Mode Toggle */}
        <View style={s.modeToggle}>
          <TouchableOpacity style={[s.modeBtn, mode === 'simple' && s.modeBtnActive]} onPress={() => setMode('simple')}>
            <Text style={[s.modeBtnText, mode === 'simple' && s.modeBtnTextActive]}>Simple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.modeBtn, mode === 'erp' && s.modeBtnActive]} onPress={() => setMode('erp')}>
            <Text style={[s.modeBtnText, mode === 'erp' && s.modeBtnTextActive]}>ERP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Import Badge */}
      {importMeta && (
        <View style={s.importBanner}>
          <FontAwesome5 name="database" size={12} color={T.import} />
          <Text style={s.importText}>Imported from {importMeta.source} · Legacy Code: {importMeta.legacyCode}</Text>
        </View>
      )}

      {/* Bill Impact Warning (only in edit mode) */}
      {isEdit && (
        <View style={s.billWarning}>
          <Ionicons name="information-circle-outline" size={14} color={T.warning} />
          <Text style={s.billWarningText}>Changes affect future bills only. Past invoices remain unchanged.</Text>
        </View>
      )}

      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ============ SIMPLE MODE ============ */}
        {!isErp && (
          <View style={{ padding: 16, gap: 16 }}>
            <View style={s.formGroup}>{label('Barcode *', 'BARCODE', true)}{inp(identity.barcode, v => up(setIdentity, 'barcode', v), { keyboardType: 'numeric', placeholder: '890123456789' })}</View>
            <View style={s.formGroup}>{label('Product Name *', 'PRODUCT', true)}{inp(identity.name, v => up(setIdentity, 'name', v), { placeholder: 'e.g. AMUL CHAZ 200ML' })}</View>
            <Row>
              <Col><View style={s.formGroup}>{label('MRP (₹)', 'M.R.P.')}{inp(pricing.mrp, v => up(setPricing, 'mrp', v), { keyboardType: 'numeric' })}</View></Col>
              <Col><View style={s.formGroup}>{label('Selling Price (₹)')}{inp(pricing.sellingPrice, v => up(setPricing, 'sellingPrice', v), { keyboardType: 'numeric' })}</View></Col>
            </Row>
            <Row>
              <Col><View style={s.formGroup}>{label('CGST %', 'CGST %')}{inp(tax.cgst, v => up(setTax, 'cgst', v), { keyboardType: 'numeric' })}</View></Col>
              <Col><View style={s.formGroup}>{label('SGST %', 'SGST %')}{inp(tax.sgst, v => up(setTax, 'sgst', v), { keyboardType: 'numeric' })}</View></Col>
            </Row>
            <View style={s.formGroup}>{label('Reorder Qty')}{inp(inventory.reorderQty, v => up(setInventory, 'reorderQty', v), { keyboardType: 'numeric' })}</View>
            <View style={s.formGroup}>{label('Rack No.', 'RACK NO.')}{inp(rack.rackNo, v => up(setRack, 'rackNo', v))}</View>
            <GstPreviewPanel preview={gstPreview} warnings={validationErrors} />
          </View>
        )}

        {/* ============ ERP MODE ============ */}
        {isErp && (
          <View style={{ padding: 16, gap: 12 }}>

            {/* Section 1: Product Identity */}
            <Accordion title="Product Identity" icon="barcode-outline" defaultOpen={true}>
              <View style={s.formGroup}>{label('Barcode', 'BARCODE', !isEdit)}{inp(identity.barcode, v => up(setIdentity, 'barcode', v), { keyboardType: 'numeric', editable: !isEdit })}</View>
              <View style={s.formGroup}>{label('Product Name', 'PRODUCT', true)}{inp(identity.name, v => up(setIdentity, 'name', v))}</View>
              <View style={s.formGroup}>{label('Display Name', 'PRODUCT')}{inp(identity.displayName, v => up(setIdentity, 'displayName', v), { placeholder: 'Override for store display' })}</View>
              <Row>
                <Col><View style={s.formGroup}>{label('Code', 'CODE')}{inp(identity.legacyCode, v => up(setIdentity, 'legacyCode', v), { mono: true })}</View></Col>
                <Col><View style={s.formGroup}>{label('Unit', 'UNIT')}{inp(identity.baseUnit, v => up(setIdentity, 'baseUnit', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Status', 'STATUS')}{inp(identity.status, v => up(setIdentity, 'status', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Type', 'TYPE')}{inp(identity.type, v => up(setIdentity, 'type', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Item Type', 'ITEM TYPE')}{inp(identity.itemType, v => up(setIdentity, 'itemType', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Color Type', 'COLOR TYPE')}{inp(identity.colorType, v => up(setIdentity, 'colorType', v))}</View></Col>
              </Row>
              <View style={s.formGroup}>{label('Packing', 'PACKING')}{inp(identity.packagingText, v => up(setIdentity, 'packagingText', v))}</View>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Decimal Qty  <Text style={s.margLabel}>MARG: DECIMAL</Text></Text>
                <Switch value={identity.allowDecimalQty} onValueChange={v => up(setIdentity, 'allowDecimalQty', v)} trackColor={{ true: T.primary }} />
              </View>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Hide Product  <Text style={s.margLabel}>MARG: HIDE</Text></Text>
                <Switch value={identity.isHidden} onValueChange={v => up(setIdentity, 'isHidden', v)} trackColor={{ true: T.danger }} />
              </View>
            </Accordion>

            {/* Section 2: Company / Classification */}
            <Accordion title="Company / Classification" icon="business-outline">
              <Row>
                <Col><View style={s.formGroup}>{label('Company', 'COMPANY')}{inp(classification.companyName, v => up(setClassification, 'companyName', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Manufacturer', 'MANUFACTURER F3')}{inp(classification.manufacturerName, v => up(setClassification, 'manufacturerName', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Group', 'GROUP')}{inp(classification.groupName, v => up(setClassification, 'groupName', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Category', 'CATEGORY')}{inp(classification.categoryName, v => up(setClassification, 'categoryName', v))}</View></Col>
              </Row>
              <View style={s.formGroup}>{label('HSN / SAC', 'HSN/SAC')}{inp(classification.hsnSac, v => up(setClassification, 'hsnSac', v), { keyboardType: 'numeric', mono: true, placeholder: 'e.g. 04039090' })}</View>
            </Accordion>

            {/* Section 3: GST / Tax */}
            <Accordion title="GST / Tax" icon="receipt-outline">
              <Row>
                <Col><View style={s.formGroup}>{label('Local Tax', 'LOCAL')}{inp(tax.localTaxability, v => up(setTax, 'localTaxability', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Central Tax', 'CENTRAL')}{inp(tax.centralTaxability, v => up(setTax, 'centralTaxability', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('SGST %', 'SGST %')}{inp(tax.sgst, v => up(setTax, 'sgst', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('CGST %', 'CGST %')}{inp(tax.cgst, v => up(setTax, 'cgst', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('IGST %', 'IGST %')}{inp(tax.igst, v => up(setTax, 'igst', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('CESS %', 'CESS%')}{inp(tax.cess, v => up(setTax, 'cess', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <View style={s.formGroup}>{label('CESS Amount / Unit', 'CESS Amt')}{inp(tax.cessAmt, v => up(setTax, 'cessAmt', v), { keyboardType: 'numeric' })}</View>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Tax Inclusive (MRP includes GST)</Text>
                <Switch value={tax.taxInclusive} onValueChange={v => up(setTax, 'taxInclusive', v)} trackColor={{ true: T.primary }} />
              </View>
              <GstPreviewPanel preview={gstPreview} warnings={validationErrors} />
            </Accordion>

            {/* Section 4: Pricing */}
            <Accordion title="Pricing" icon="pricetags-outline">
              <Row>
                <Col><View style={s.formGroup}>{label('M.R.P.', 'M.R.P.')}{inp(pricing.mrp, v => up(setPricing, 'mrp', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Selling Price')}{inp(pricing.sellingPrice, v => up(setPricing, 'sellingPrice', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Rate-A', 'Rate-A')}{inp(pricing.rateA, v => up(setPricing, 'rateA', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Rate-B', 'Rate-B')}{inp(pricing.rateB, v => up(setPricing, 'rateB', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Rate-C', 'Rate-C')}{inp(pricing.rateC, v => up(setPricing, 'rateC', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('P.RATE', 'P.RATE')}{inp(pricing.purchaseRate, v => up(setPricing, 'purchaseRate', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('COST/PCS', 'COST/PCS')}{inp(pricing.costPerPiece, v => up(setPricing, 'costPerPiece', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Landing Cost')}{inp(pricing.landingCost, v => up(setPricing, 'landingCost', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
            </Accordion>

            {/* Section 5: Inventory Rules */}
            <Accordion title="Inventory Rules" icon="cube-outline">
              <Row>
                <Col><View style={s.formGroup}>{label('Conv.Box', 'CONV.BOX')}{inp(inventory.convBox, v => up(setInventory, 'convBox', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Def. Sale Qty', 'DEF.SALE QTY')}{inp(inventory.defSaleQty, v => up(setInventory, 'defSaleQty', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Minimum Qty', 'MINIMUM QTY')}{inp(inventory.minQty, v => up(setInventory, 'minQty', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Maximum Qty', 'MAXIMUM QTY')}{inp(inventory.maxQty, v => up(setInventory, 'maxQty', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Reorder Qty', 'REORDER QTY')}{inp(inventory.reorderQty, v => up(setInventory, 'reorderQty', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Shelf Life (Days)', 'SHELFLIFE')}{inp(inventory.shelflife, v => up(setInventory, 'shelflife', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <View style={s.switchRow}><Text style={s.switchLabel}>Negative Stock  <Text style={s.margLabel}>MARG: NEGATIVE</Text></Text><Switch value={inventory.allowNegative} onValueChange={v => up(setInventory, 'allowNegative', v)} trackColor={{ true: T.danger }} /></View>
              <View style={s.switchRow}><Text style={s.switchLabel}>Track Batch</Text><Switch value={inventory.trackBatch} onValueChange={v => up(setInventory, 'trackBatch', v)} trackColor={{ true: T.primary }} /></View>
              <View style={s.switchRow}><Text style={s.switchLabel}>Track Expiry</Text><Switch value={inventory.trackExpiry} onValueChange={v => up(setInventory, 'trackExpiry', v)} trackColor={{ true: T.primary }} /></View>
              <View style={s.switchRow}><Text style={s.switchLabel}>Track Serial</Text><Switch value={inventory.trackSerial} onValueChange={v => up(setInventory, 'trackSerial', v)} trackColor={{ true: T.primary }} /></View>
            </Accordion>

            {/* Section 6: Discount / Scheme */}
            <Accordion title="Discount / Scheme" icon="gift-outline">
              <View style={s.switchRow}><Text style={s.switchLabel}>Discount Applicable  <Text style={s.margLabel}>MARG: DISCOUNT</Text></Text><Switch value={discount.applicable} onValueChange={v => up(setDiscount, 'applicable', v)} trackColor={{ true: T.primary }} /></View>
              <Row>
                <Col><View style={s.formGroup}>{label('Item Disc-1', 'ITEM DISC-1')}{inp(discount.disc1, v => up(setDiscount, 'disc1', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Disc-2', 'DISC-2')}{inp(discount.disc2, v => up(setDiscount, 'disc2', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Special Disc', 'SPECIAL DISC')}{inp(discount.specialDisc, v => up(setDiscount, 'specialDisc', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Max Disc %', 'MAXIMUM DISCOUNT %')}{inp(discount.maxDisc, v => up(setDiscount, 'maxDisc', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Purchase Disc', 'PURC.Disc')}{inp(discount.purchaseDisc, v => up(setDiscount, 'purchaseDisc', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.formGroup}>{label('Disc. Less', 'DISC.LESS')}{inp(discount.discLess, v => up(setDiscount, 'discLess', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <View style={s.switchRow}><Text style={s.switchLabel}>Rate Override Allowed  <Text style={s.margLabel}>MARG: F6/RATE±</Text></Text><Switch value={discount.rateOverride} onValueChange={v => up(setDiscount, 'rateOverride', v)} trackColor={{ true: T.primary }} /></View>
            </Accordion>

            {/* Section 7: Rack / Barcode */}
            <Accordion title="Rack / Barcode" icon="location-outline">
              <Row>
                <Col><View style={s.formGroup}>{label('Rack No.', 'RACK NO.')}{inp(rack.rackNo, v => up(setRack, 'rackNo', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Shelf No.')}{inp(rack.shelfNo, v => up(setRack, 'shelfNo', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.formGroup}>{label('Bin No.')}{inp(rack.binNo, v => up(setRack, 'binNo', v))}</View></Col>
                <Col><View style={s.formGroup}>{label('Zone')}{inp(rack.zone, v => up(setRack, 'zone', v))}</View></Col>
              </Row>
            </Accordion>

          </View>
        )}

      </ScrollView>

      {/* Save Button */}
      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={s.saveBtnText}>{isEdit ? 'Update Product Master' : 'Create Product Master'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: T.text, flex: 1 },
  headerSub: { fontSize: 12, color: T.textSub, fontWeight: '500' },

  modeToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  modeBtnActive: { backgroundColor: T.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: T.textSub },
  modeBtnTextActive: { color: T.primary },

  importBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EDE9FE', paddingHorizontal: 16, paddingVertical: 8 },
  importText: { fontSize: 12, color: T.import, fontWeight: '600' },

  billWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 6 },
  billWarningText: { fontSize: 12, color: T.warning, fontWeight: '500' },

  scroll: { flex: 1 },

  acc: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  accHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: T.card },
  accIconBox: { width: 28, height: 28, borderRadius: 7, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  accTitle: { fontSize: 15, fontWeight: '700', color: T.text },
  accBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  accBadgeText: { fontSize: 11, color: T.primary, fontWeight: '600' },
  accBody: { paddingHorizontal: 14, paddingBottom: 14, backgroundColor: T.card },

  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: T.textSub, marginBottom: 2 },
  labelRequired: { color: T.text },
  margLabel: { fontSize: 10, color: T.marg, fontWeight: '600', marginTop: 1 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 11, fontSize: 14, color: T.text },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: T.text, flex: 1 },

  gstPanel: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14, marginTop: 12 },
  gstPanelTitle: { fontSize: 13, fontWeight: '700', color: T.primary, marginBottom: 8 },
  gstRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  gstKey: { fontSize: 12, color: T.textSub },
  gstVal: { fontSize: 12, color: T.text, fontWeight: '600' },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
  warningText: { fontSize: 12, color: T.warning, flex: 1 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border },
  saveBtn: { backgroundColor: T.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
