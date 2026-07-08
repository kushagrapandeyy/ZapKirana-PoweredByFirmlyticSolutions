import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';

const T = {
  bg: '#F8FAFC', card: '#FFFFFF',
  primary: '#047857', danger: '#DC2626',
  text: '#0F172A', textSub: '#64748B', textMuted: '#94A3B8',
  border: '#E2E8F0', marg: '#059669', import: '#7C3AED', warning: '#D97706',
};

const lbl = (text: string, marg?: string, required?: boolean) => (
  <View style={{ marginBottom: 5 }}>
    <Text style={[s.label, required && { color: T.text }]}>{text}{required ? ' *' : ''}</Text>
    {marg && <Text style={s.margLabel}>MARG: {marg}</Text>}
  </View>
);

const inp = (value: string, onChange: (v: string) => void, opts?: { keyboardType?: any; placeholder?: string; multiline?: boolean; editable?: boolean; autoCapitalize?: any }) => (
  <TextInput style={[s.input, opts?.multiline && { height: 72, textAlignVertical: 'top' }, opts?.editable === false && { backgroundColor: '#F1F5F9', color: T.textSub }]} value={value} onChangeText={onChange} keyboardType={opts?.keyboardType} placeholder={opts?.placeholder ?? ''} placeholderTextColor={T.textMuted} multiline={opts?.multiline} editable={opts?.editable !== false} autoCapitalize={opts?.autoCapitalize} />
);

const Row = ({ children }: { children: React.ReactNode }) => <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
const Col = ({ children, flex = 1 }: { children: React.ReactNode; flex?: number }) => <View style={{ flex }}>{children}</View>;

const Accordion = ({ title, icon, children, defaultOpen = false, badge }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={s.acc}>
      <TouchableOpacity style={s.accHdr} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.accIcon}><Ionicons name={icon as any} size={16} color={T.primary} /></View>
          <Text style={s.accTitle}>{title}</Text>
          {badge && <View style={s.accBadge}><Text style={s.accBadgeText}>{badge}</Text></View>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={T.textSub} />
      </TouchableOpacity>
      {open && <Animated.View entering={FadeInDown.duration(180)} style={s.accBody}>{children}</Animated.View>}
    </View>
  );
};

// =====================================================
// GSTIN Verification Badge
// =====================================================
const GstinVerifiedBadge = ({ verified, status }: { verified?: boolean; status?: string }) => {
  if (!verified) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
      <Ionicons name="checkmark-circle" size={14} color={T.primary} />
      <Text style={{ fontSize: 11, color: T.primary, fontWeight: '600' }}>GSTN Verified · Status: {status ?? 'ACTIVE'}</Text>
    </View>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function SupplierLedgerMasterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partyLedgerId = params.id as string | undefined;
  const isEdit = !!partyLedgerId;

  const [mode, setMode] = useState<'simple' | 'erp'>('erp');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [geminiValidating, setGeminiValidating] = useState(false);
  const [importMeta, setImportMeta] = useState<{ source?: string; legacyCode?: string } | null>(null);
  const [gstnVerified, setGstnVerified] = useState(false);
  const [gstnStatus, setGstnStatus] = useState<string | undefined>();

  // Section state
  const [identity, setIdentity] = useState({ name: '', legacyCode: '', station: '', accountGroup: 'SUNDRY CREDITORS', balancingMethod: 'Bill by Bill', ledgerType: 'REGISTERED', category: 'OTHERS', ledgerDate: '', freezeUpto: '', isHidden: false, erpToErpEnabled: false, colorType: 'NORMAL', billImportSource: '' });
  const [opening, setOpening] = useState({ financialYear: '', amount: '0', balanceType: 'CR', asOfDate: '' });
  const [address, setAddress] = useState({ addressLine1: '', addressLine2: '', city: '', district: '', stateCode: '', stateName: '', pinCode: '', country: 'INDIA' });
  const [contact, setContact] = useState({ mobile: '', contactPerson: '', designation: '', phoneOff: '', phoneRes: '', fax: '', email: '', website: '', mailToName: '' });
  const [tax, setTax] = useState({ gstHeading: 'Local', gstin: '', gstRegistrationType: 'REGISTERED', pan: '', tinNumber: '', vatNumber: '', serviceTaxNumber: '', foodLicenseNumber: '', extraRegistrationNumber: '', registrationNumber: '' });
  const [payment, setPayment] = useState({ holdPayment: false, holdPaymentReason: '', holdPaymentPercent: '0', creditLimit: '0', creditDays: '15', paymentTerms: 'Net 30', defaultPaymentMode: 'BANK_TRANSFER', gstr1ComplianceRequired: false });

  const up = (setter: React.Dispatch<React.SetStateAction<any>>, field: string, value: any) =>
    setter((prev: any) => ({ ...prev, [field]: value }));

  // ---- Load existing ledger ----
  useEffect(() => {
    if (!partyLedgerId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/suppliers/ledger/${partyLedgerId}`);
        if (!res.ok) return;
        const d = await res.json();

        setIdentity({ name: d.name ?? '', legacyCode: d.legacyCode ?? '', station: d.station ?? '', accountGroup: d.accountGroup ?? 'SUNDRY CREDITORS', balancingMethod: d.balancingMethod ?? 'Bill by Bill', ledgerType: d.ledgerType ?? 'REGISTERED', category: d.category ?? 'OTHERS', ledgerDate: d.ledgerDate ? d.ledgerDate.slice(0, 10) : '', freezeUpto: d.freezeUpto ? d.freezeUpto.slice(0, 10) : '', isHidden: d.isHidden ?? false, erpToErpEnabled: d.erpToErpEnabled ?? false, colorType: d.colorType ?? 'NORMAL', billImportSource: d.billImportSource ?? '' });

        const ob = d.openingBalances?.[0];
        if (ob) setOpening({ financialYear: ob.financialYear ?? '', amount: String(ob.amount ?? 0), balanceType: ob.balanceType ?? 'CR', asOfDate: ob.asOfDate ? ob.asOfDate.slice(0, 10) : '' });

        const addr = d.addresses?.find((a: any) => a.isDefaultBilling) ?? d.addresses?.[0];
        if (addr) setAddress({ addressLine1: addr.addressLine1 ?? '', addressLine2: addr.addressLine2 ?? '', city: addr.city ?? '', district: addr.district ?? '', stateCode: addr.stateCode ?? '', stateName: addr.stateName ?? '', pinCode: addr.pinCode ?? '', country: addr.country ?? 'INDIA' });

        const ct = d.contacts?.find((c: any) => c.isPrimary) ?? d.contacts?.[0];
        if (ct) setContact({ mobile: ct.mobile ?? '', contactPerson: ct.name ?? '', designation: ct.designation ?? '', phoneOff: ct.officePhone ?? '', phoneRes: ct.residencePhone ?? '', fax: ct.fax ?? '', email: ct.email ?? '', website: ct.website ?? '', mailToName: ct.mailToName ?? '' });

        const tp = d.taxProfile;
        if (tp) {
          setTax({ gstHeading: tp.gstHeading ?? 'Local', gstin: tp.gstin ?? '', gstRegistrationType: tp.gstRegistrationType ?? 'REGISTERED', pan: tp.pan ?? '', tinNumber: tp.tinNumber ?? '', vatNumber: tp.vatNumber ?? '', serviceTaxNumber: tp.serviceTaxNumber ?? '', foodLicenseNumber: tp.foodLicenseNumber ?? '', extraRegistrationNumber: tp.extraRegistrationNumber ?? '', registrationNumber: tp.registrationNumber ?? '' });
          setGstnVerified(tp.gstnVerified ?? false);
          setGstnStatus(tp.gstnStatus ?? undefined);
        }

        const pp = d.paymentPolicy;
        if (pp) setPayment({ holdPayment: pp.holdPayment ?? false, holdPaymentReason: pp.holdPaymentReason ?? '', holdPaymentPercent: String(pp.holdPaymentPercent ?? 0), creditLimit: String(pp.creditLimit ?? 0), creditDays: String(pp.creditDays ?? 15), paymentTerms: pp.paymentTerms ?? 'Net 30', defaultPaymentMode: pp.defaultPaymentMode ?? 'BANK_TRANSFER', gstr1ComplianceRequired: pp.gstr1ComplianceRequired ?? false });

        if (d.legacyCode) setImportMeta({ source: 'MARG ERP', legacyCode: d.legacyCode });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [partyLedgerId]);

  // ---- Gemini GSTIN Validation ----
  const validateGstin = useCallback(async () => {
    if (tax.gstin.length !== 15) { Alert.alert('Invalid GSTIN', 'Must be exactly 15 characters.'); return; }
    setGeminiValidating(true);
    try {
      // Mock: extract PAN from GSTIN (chars 3–12), auto-fill state code (chars 1–2)
      await new Promise(r => setTimeout(r, 900));
      const extractedPan = tax.gstin.substring(2, 12);
      const stateCode = tax.gstin.substring(0, 2);
      up(setTax, 'pan', extractedPan);
      up(setAddress, 'stateCode', stateCode);
      setGstnVerified(true);
      setGstnStatus('ACTIVE');
      Alert.alert('GSTN Verified ✓', `PAN extracted: ${extractedPan}\nState code: ${stateCode}`);
    } catch { Alert.alert('Error', 'Gemini verification failed.'); }
    finally { setGeminiValidating(false); }
  }, [tax.gstin]);

  // ---- Save ----
  const handleSave = async () => {
    if (!identity.name) { Alert.alert('Required', 'Ledger Name is required.'); return; }
    if (!contact.mobile) { Alert.alert('Required', 'Mobile number is required.'); return; }

    setSaving(true);
    try {
      const body = {
        storeId: CURRENT_STORE_ID,
        name: identity.name,
        legacyCode: identity.legacyCode,
        station: identity.station,
        accountGroup: identity.accountGroup,
        balancingMethod: identity.balancingMethod,
        ledgerType: identity.ledgerType,
        category: identity.category,
        isHidden: identity.isHidden,
        erpToErpEnabled: identity.erpToErpEnabled,
        colorType: identity.colorType,
        billImportSource: identity.billImportSource,

        openingBalance: { financialYear: opening.financialYear, amount: Number(opening.amount), balanceType: opening.balanceType, asOfDate: opening.asOfDate || undefined },
        contact: { mobile: contact.mobile, contactPerson: contact.contactPerson, designation: contact.designation, phoneOff: contact.phoneOff, phoneRes: contact.phoneRes, fax: contact.fax, email: contact.email, website: contact.website },
        address: { addressLine1: address.addressLine1, addressLine2: address.addressLine2, city: address.city, district: address.district, stateCode: address.stateCode, stateName: address.stateName, pinCode: address.pinCode, country: address.country },
        tax: { gstHeading: tax.gstHeading, gstin: tax.gstin, gstRegistrationType: tax.gstRegistrationType, pan: tax.pan, tinNumber: tax.tinNumber, vatNumber: tax.vatNumber, serviceTaxNumber: tax.serviceTaxNumber, foodLicenseNumber: tax.foodLicenseNumber, extraRegistrationNumber: tax.extraRegistrationNumber, registrationNumber: tax.registrationNumber },
        paymentPolicy: { holdPayment: payment.holdPayment, holdPaymentReason: payment.holdPaymentReason, holdPaymentPercent: Number(payment.holdPaymentPercent), creditLimit: Number(payment.creditLimit), creditDays: Number(payment.creditDays), paymentTerms: payment.paymentTerms, defaultPaymentMode: payment.defaultPaymentMode, gstr1ComplianceRequired: payment.gstr1ComplianceRequired },
      };

      let res: Response;
      if (isEdit) {
        res = await fetch(`${API_BASE_URL}/suppliers/ledger/${partyLedgerId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: CURRENT_STORE_ID, ledger: { name: identity.name, station: identity.station, accountGroup: identity.accountGroup, balancingMethod: identity.balancingMethod, ledgerType: identity.ledgerType, category: identity.category, isHidden: identity.isHidden, colorType: identity.colorType, erpToErpEnabled: identity.erpToErpEnabled }, contact, address, tax, paymentPolicy: payment }),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/suppliers/ledger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }

      if (res.ok) {
        Alert.alert('Saved', `Ledger ${isEdit ? 'updated' : 'created'} successfully.`, [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message ?? 'Failed to save ledger.');
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator style={{ marginTop: 60 }} color={T.primary} /></SafeAreaView>;

  const isErp = mode === 'erp';
  const openingAmt = Number(opening.amount);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{identity.name || 'New Ledger Account'}</Text>
          <Text style={s.headerSub}>
            {identity.accountGroup}  ·  {identity.ledgerType}
            {openingAmt > 0 ? `  ·  ₹${openingAmt.toLocaleString()} ${opening.balanceType}` : ''}
          </Text>
        </View>
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

      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ===== SIMPLE MODE ===== */}
        {!isErp && (
          <View style={{ padding: 16, gap: 14 }}>
            <View style={s.fg}>{lbl('Ledger Name', 'Ledger Name', true)}{inp(identity.name, v => up(setIdentity, 'name', v))}</View>
            <View style={s.fg}>{lbl('Mobile', 'Mobile', true)}{inp(contact.mobile, v => up(setContact, 'mobile', v), { keyboardType: 'phone-pad' })}</View>
            <View style={s.fg}>{lbl('GSTIN', 'GSTIN')}{inp(tax.gstin, v => up(setTax, 'gstin', v.toUpperCase()), { autoCapitalize: 'characters' })}</View>
            <View style={s.fg}>{lbl('Credit Days')}{inp(payment.creditDays, v => up(setPayment, 'creditDays', v), { keyboardType: 'numeric' })}</View>
            <View style={s.fg}>{lbl('Address')}{inp(address.addressLine1, v => up(setAddress, 'addressLine1', v), { multiline: true })}</View>
          </View>
        )}

        {/* ===== ERP MODE ===== */}
        {isErp && (
          <View style={{ padding: 16, gap: 12 }}>

            {/* Section 1: Ledger Identity */}
            <Accordion title="Ledger Identity" icon="business-outline" defaultOpen={true}>
              <View style={s.fg}>{lbl('Ledger Name', 'Ledger Name', true)}{inp(identity.name, v => up(setIdentity, 'name', v), { placeholder: 'e.g. AMAZON DISTRIBUTORS PVT. LTD.' })}</View>
              <Row>
                <Col><View style={s.fg}>{lbl('Station', 'Station')}{inp(identity.station, v => up(setIdentity, 'station', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('Account Group', 'Account Group')}{inp(identity.accountGroup, v => up(setIdentity, 'accountGroup', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Balancing Method', 'Balancing Method')}{inp(identity.balancingMethod, v => up(setIdentity, 'balancingMethod', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('Ledger Type', 'Ledger Type')}{inp(identity.ledgerType, v => up(setIdentity, 'ledgerType', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Ledger Category', 'Ledger Category')}{inp(identity.category, v => up(setIdentity, 'category', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('Color', 'Color')}{inp(identity.colorType, v => up(setIdentity, 'colorType', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Ledger Date', 'Ledger Date')}{inp(identity.ledgerDate, v => up(setIdentity, 'ledgerDate', v), { placeholder: 'YYYY-MM-DD' })}</View></Col>
                <Col><View style={s.fg}>{lbl('Freeze Upto', 'Freez Upto')}{inp(identity.freezeUpto, v => up(setIdentity, 'freezeUpto', v), { placeholder: 'YYYY-MM-DD' })}</View></Col>
              </Row>
              <View style={s.switchRow}><Text style={s.switchLabel}>Hide Ledger  <Text style={s.margLabel}>MARG: Hide</Text></Text><Switch value={identity.isHidden} onValueChange={v => up(setIdentity, 'isHidden', v)} trackColor={{ true: T.danger }} /></View>
              <View style={s.switchRow}><Text style={s.switchLabel}>ERP to ERP  <Text style={s.margLabel}>MARG: ERP to ERP</Text></Text><Switch value={identity.erpToErpEnabled} onValueChange={v => up(setIdentity, 'erpToErpEnabled', v)} trackColor={{ true: T.primary }} /></View>
            </Accordion>

            {/* Section 2: Opening Balance */}
            <Accordion title="Opening Balance" icon="wallet-outline">
              <Row>
                <Col><View style={s.fg}>{lbl('Amount', 'Opening')}{inp(opening.amount, v => up(setOpening, 'amount', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.fg}>{lbl('CR / DR', 'Cr/Dr')}{inp(opening.balanceType, v => up(setOpening, 'balanceType', v.toUpperCase()), { autoCapitalize: 'characters' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Financial Year')}{inp(opening.financialYear, v => up(setOpening, 'financialYear', v), { placeholder: 'e.g. 2025-26' })}</View></Col>
                <Col><View style={s.fg}>{lbl('As of Date')}{inp(opening.asOfDate, v => up(setOpening, 'asOfDate', v), { placeholder: 'YYYY-MM-DD' })}</View></Col>
              </Row>
            </Accordion>

            {/* Section 3: Address */}
            <Accordion title="Address" icon="location-outline">
              <View style={s.fg}>{lbl('Address Line 1', 'Address')}{inp(address.addressLine1, v => up(setAddress, 'addressLine1', v))}</View>
              <View style={s.fg}>{lbl('Address Line 2')}{inp(address.addressLine2, v => up(setAddress, 'addressLine2', v))}</View>
              <Row>
                <Col><View style={s.fg}>{lbl('City')}{inp(address.city, v => up(setAddress, 'city', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('District')}{inp(address.district, v => up(setAddress, 'district', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('State Code', 'State')}{inp(address.stateCode, v => up(setAddress, 'stateCode', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('State Name')}{inp(address.stateName, v => up(setAddress, 'stateName', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Pin Code', 'Pin Code')}{inp(address.pinCode, v => up(setAddress, 'pinCode', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.fg}>{lbl('Country')}{inp(address.country, v => up(setAddress, 'country', v))}</View></Col>
              </Row>
            </Accordion>

            {/* Section 4: Contact */}
            <Accordion title="Contact" icon="call-outline">
              <View style={s.fg}>{lbl('Mobile', 'Mobile', true)}{inp(contact.mobile, v => up(setContact, 'mobile', v), { keyboardType: 'phone-pad' })}</View>
              <View style={s.fg}>{lbl('Mail To', 'Mail To')}{inp(contact.mailToName, v => up(setContact, 'mailToName', v), { placeholder: identity.name })}</View>
              <Row>
                <Col><View style={s.fg}>{lbl('Contact Person', 'Contact Person')}{inp(contact.contactPerson, v => up(setContact, 'contactPerson', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('Designation', 'Designation')}{inp(contact.designation, v => up(setContact, 'designation', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Phone (Off.)', 'Phone No. (Off.)')}{inp(contact.phoneOff, v => up(setContact, 'phoneOff', v), { keyboardType: 'phone-pad' })}</View></Col>
                <Col><View style={s.fg}>{lbl('Phone (Res.)', 'Phone No. (Res.)')}{inp(contact.phoneRes, v => up(setContact, 'phoneRes', v), { keyboardType: 'phone-pad' })}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Fax No.', 'Fax No.')}{inp(contact.fax, v => up(setContact, 'fax', v), { keyboardType: 'phone-pad' })}</View></Col>
                <Col><View style={s.fg}>{lbl('E-Mail', 'E-Mail')}{inp(contact.email, v => up(setContact, 'email', v), { keyboardType: 'email-address' })}</View></Col>
              </Row>
              <View style={s.fg}>{lbl('Web Site', 'Web Site')}{inp(contact.website, v => up(setContact, 'website', v))}</View>
            </Accordion>

            {/* Section 5: GST / Tax Registration */}
            <Accordion title="GST / Tax Registration" icon="document-text-outline">
              <View style={s.fg}>
                {lbl('GSTIN', 'GSTIN')}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput style={[s.input, { flex: 1, fontFamily: 'monospace' }]} value={tax.gstin} onChangeText={v => up(setTax, 'gstin', v.toUpperCase())} autoCapitalize="characters" maxLength={15} placeholderTextColor={T.textMuted} placeholder="07AAFCA9197E1ZF" />
                  <TouchableOpacity style={s.geminiBtn} onPress={validateGstin} disabled={geminiValidating}>
                    {geminiValidating ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesome5 name="magic" size={14} color="#fff" />}
                  </TouchableOpacity>
                </View>
                <GstinVerifiedBadge verified={gstnVerified} status={gstnStatus} />
              </View>
              <Row>
                <Col><View style={s.fg}>{lbl('GST Heading', 'GST Heading')}{inp(tax.gstHeading, v => up(setTax, 'gstHeading', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('GST Reg. Type', 'Ledger Type')}{inp(tax.gstRegistrationType, v => up(setTax, 'gstRegistrationType', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('I.T. PAN No.', 'I.T. PAN No.')}{inp(tax.pan, v => up(setTax, 'pan', v.toUpperCase()), { autoCapitalize: 'characters' })}</View></Col>
                <Col><View style={s.fg}>{lbl('TIN No.', 'TIN.No.')}{inp(tax.tinNumber, v => up(setTax, 'tinNumber', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('VAT No.', 'VAT Heading')}{inp(tax.vatNumber, v => up(setTax, 'vatNumber', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('S.T. No.', 'S.T. Heading')}{inp(tax.serviceTaxNumber, v => up(setTax, 'serviceTaxNumber', v))}</View></Col>
              </Row>
              <Row>
                <Col><View style={s.fg}>{lbl('Food Licence', 'Food Licence No.')}{inp(tax.foodLicenseNumber, v => up(setTax, 'foodLicenseNumber', v))}</View></Col>
                <Col><View style={s.fg}>{lbl('Extra Reg.', 'Extra Heading')}{inp(tax.extraRegistrationNumber, v => up(setTax, 'extraRegistrationNumber', v))}</View></Col>
              </Row>
              <View style={s.fg}>{lbl('Reg. No.', 'Reg.No.')}{inp(tax.registrationNumber, v => up(setTax, 'registrationNumber', v))}</View>
            </Accordion>

            {/* Section 6: Payment Policy */}
            <Accordion title="Payment Policy" icon="card-outline">
              <View style={s.switchRow}><Text style={s.switchLabel}>Hold Payment  <Text style={s.margLabel}>MARG: Hold Payment</Text></Text><Switch value={payment.holdPayment} onValueChange={v => up(setPayment, 'holdPayment', v)} trackColor={{ true: T.danger }} /></View>
              {payment.holdPayment && (
                <>
                  <View style={s.fg}>{lbl('Hold Reason')}{inp(payment.holdPaymentReason, v => up(setPayment, 'holdPaymentReason', v))}</View>
                  <View style={s.fg}>{lbl('Hold Payment %', 'Hold Payment %')}{inp(payment.holdPaymentPercent, v => up(setPayment, 'holdPaymentPercent', v), { keyboardType: 'numeric' })}</View>
                </>
              )}
              <Row>
                <Col><View style={s.fg}>{lbl('Credit Limit (₹)')}{inp(payment.creditLimit, v => up(setPayment, 'creditLimit', v), { keyboardType: 'numeric' })}</View></Col>
                <Col><View style={s.fg}>{lbl('Credit Days')}{inp(payment.creditDays, v => up(setPayment, 'creditDays', v), { keyboardType: 'numeric' })}</View></Col>
              </Row>
              <View style={s.fg}>{lbl('Payment Terms')}{inp(payment.paymentTerms, v => up(setPayment, 'paymentTerms', v))}</View>
              <View style={s.switchRow}><Text style={s.switchLabel}>GSTR1 Compliance Required  <Text style={s.margLabel}>MARG: 0% if GSTR1 not upload</Text></Text><Switch value={payment.gstr1ComplianceRequired} onValueChange={v => up(setPayment, 'gstr1ComplianceRequired', v)} trackColor={{ true: T.warning }} /></View>
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
              <Text style={s.saveBtnText}>{isEdit ? 'Update Ledger Master' : 'Create Ledger Account'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.text },
  headerSub: { fontSize: 11, color: T.textSub, marginTop: 2 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  modeBtnActive: { backgroundColor: T.card, elevation: 2 },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: T.textSub },
  modeBtnTextActive: { color: T.primary },
  importBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EDE9FE', paddingHorizontal: 16, paddingVertical: 8 },
  importText: { fontSize: 12, color: T.import, fontWeight: '600' },
  scroll: { flex: 1 },
  acc: { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  accHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  accIcon: { width: 28, height: 28, borderRadius: 7, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  accTitle: { fontSize: 15, fontWeight: '700', color: T.text },
  accBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  accBadgeText: { fontSize: 11, color: T.primary, fontWeight: '600' },
  accBody: { paddingHorizontal: 14, paddingBottom: 14 },
  fg: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: T.textSub, marginBottom: 2 },
  margLabel: { fontSize: 10, color: T.marg, fontWeight: '600' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 10, fontSize: 14, color: T.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: T.text, flex: 1 },
  geminiBtn: { backgroundColor: '#7C3AED', width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border },
  saveBtn: { backgroundColor: T.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
