import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../../constants/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function PurchaseOrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: po, isLoading, isError, refetch } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`);
      if (!res.ok) throw new Error('Failed to fetch PO');
      return res.json();
    }
  });

  useEffect(() => {
    if (po && po.items) {
      setEditableItems(po.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        priceAtOrder: i.purchasePrice || i.priceAtOrder,
        product: i.product
      })));
      setHasChanges(false);
    }
  }, [po]);

  const updateQuantity = (productId: string, val: string) => {
    const q = parseInt(val, 10);
    const newQ = isNaN(q) ? 0 : Math.max(0, q);
    setEditableItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: newQ } : i));
    setHasChanges(true);
  };

  const deleteItem = (productId: string) => {
    setEditableItems(prev => prev.filter(i => i.productId !== productId));
    setHasChanges(true);
  };

  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      const payload = { items: editableItems.map(i => ({ productId: i.productId, quantity: i.quantity, purchasePrice: i.priceAtOrder })) };
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save changes');
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'PO Updated Successfully' });
      refetch();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update PO' })
  });

  const deletePOMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete PO');
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'PO Deleted' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      router.back();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to delete PO' })
  });

  const actionMutation = useMutation({
    mutationFn: async (action: 'accept' | 'grn') => {
      const endpoint = action === 'accept' ? 'accept' : 'grn';
      const staffId = await AsyncStorage.getItem('@staff_id') || 'STAFF-1001';
      
      const payload = action === 'grn' ? {
        staffId,
        receivedItems: po.items.map((i: any) => ({ poItemId: i.id, receivedQuantity: i.quantity }))
      } : {};

      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/${endpoint}`, {
        method: action === 'grn' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Failed to ${action} PO`);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Success', text2: 'Purchase Order updated.' });
      refetch();
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Action Failed', text2: err.message });
    }
  });

  const generatePDF = () => {
    Linking.openURL(`${API_BASE_URL}/purchase-orders/${id}/pdf`);
  };

  const shareViaWhatsApp = () => {
    const text = `Purchase Order ${po?.id?.split('-')[0].toUpperCase()} from Basko\nPlease find the PO attached via this link:\n${API_BASE_URL}/purchase-orders/${id}/pdf`;
    const phone = po?.supplier?.phone ? `+91${po.supplier.phone.replace(/\D/g,'')}` : '';
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}&phone=${phone}`);
  };

  const confirmDeletePO = () => {
    Alert.alert('Delete PO', 'Are you sure you want to delete this drafted PO?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePOMutation.mutate() }
    ]);
  };

  if (isLoading) return <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (isError || !po) return <View style={styles.loader}><Text>Failed to load PO details.</Text></View>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return { bg: Colors.warningLight, text: Colors.warningDark };
      case 'ACCEPTED': return { bg: Colors.infoLight, text: Colors.infoDark };
      case 'SENT': return { bg: Colors.infoLight, text: Colors.infoDark };
      case 'DELIVERED': return { bg: Colors.successLight, text: Colors.successDark };
      default: return { bg: '#F1F5F9', text: Colors.textSecondary };
    }
  };

  const statusStyle = getStatusColor(po.status);
  const isEditable = po.status === 'CREATED';

  const totalValue = editableItems.reduce((acc, i) => acc + (i.quantity * i.priceAtOrder), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        {isEditable ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeletePO}>
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View>
            <Text style={{ fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 4 }}>Purchase Order</Text>
            <Text style={styles.poId}>#{po.id.split('-')[0].toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{po.status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date Issued</Text>
            <Text style={styles.infoValue}>{new Date(po.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Expected Delivery Date</Text>
            <Text style={styles.infoValue}>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>Supplier Details</Text>
            <Ionicons name="business" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.supplierName}>{po.supplier?.businessName || po.supplier?.name || 'Unknown'}</Text>
          <Text style={styles.supplierSub}>{po.supplier?.contactPerson}</Text>
          <Text style={styles.supplierSub}>{po.supplier?.phone}</Text>
          <Text style={styles.supplierSub}>{po.supplier?.email}</Text>
          {po.supplier?.gstin && <Text style={styles.supplierSub}>GST: {po.supplier?.gstin}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items & Quantities</Text>
          
          {editableItems.map((item: any, idx: number) => (
            <View key={item.productId} style={[styles.itemRow, idx === editableItems.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product?.name || 'Unknown Item'}</Text>
                <Text style={styles.itemPrice}>₹{item.priceAtOrder?.toFixed(2) || '0.00'} / unit</Text>
              </View>
              
              {isEditable ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.qtyController}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, (item.quantity - 1).toString())}>
                      <Ionicons name="remove" size={16} color={Colors.primaryDark} />
                    </TouchableOpacity>
                    <TextInput 
                      style={styles.qtyInput}
                      keyboardType="numeric"
                      value={item.quantity.toString()}
                      onChangeText={(val) => updateQuantity(item.productId, val)}
                    />
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, (item.quantity + 1).toString())}>
                      <Ionicons name="add" size={16} color={Colors.primaryDark} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.itemDeleteBtn} onPress={() => deleteItem(item.productId)}>
                    <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.itemQtyBox}>
                  <Text style={styles.itemQty}>{item.quantity}</Text>
                  <Text style={styles.itemQtyLabel}>Units</Text>
                </View>
              )}
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Value</Text>
            <Text style={styles.totalValue}>₹{(totalValue || 0).toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Dynamic Action Bar */}
      <View style={styles.actionBar}>
        {isEditable && hasChanges ? (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: Colors.primary }]} 
            onPress={() => saveChangesMutation.mutate()}
            disabled={saveChangesMutation.isPending}
          >
            {saveChangesMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.iconBtn} onPress={generatePDF}>
              <Ionicons name="document-text" size={24} color={Colors.textPrimary} />
              <Text style={styles.iconBtnText}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={shareViaWhatsApp}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.iconBtnText}>Share</Text>
            </TouchableOpacity>

            {po.status === 'CREATED' && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: Colors.primary }]} 
                onPress={() => actionMutation.mutate('accept')}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Approve PO</Text>}
              </TouchableOpacity>
            )}

            {(po.status === 'ACCEPTED' || po.status === 'SENT') && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: Colors.success }]} 
                onPress={() => actionMutation.mutate('grn')}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Receive Goods</Text>}
              </TouchableOpacity>
            )}

            {po.status === 'DELIVERED' && (
              <View style={[styles.primaryBtn, { backgroundColor: Colors.borderLight, opacity: 0.8 }]}>
                <Text style={[styles.primaryBtnText, { color: Colors.textSecondary }]}>Fulfilled</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0',
  },
  deleteBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scrollContent: { padding: 20 },
  titleSection: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  poId: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.sm, marginBottom: 20 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  supplierName: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.primary, marginBottom: 4 },
  supplierSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  itemPrice: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  itemQtyBox: { alignItems: 'flex-end' },
  itemQty: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.textPrimary },
  itemQtyLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  
  qtyController: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0' },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyInput: { width: 40, textAlign: 'center', fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, backgroundColor: '#fff', height: 32, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' },
  itemDeleteBtn: { marginLeft: 12 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#F1F5F9' },
  totalLabel: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary },
  totalValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.primaryDark },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 30, ...Shadows.md },
  iconBtn: { alignItems: 'center', justifyContent: 'center', width: 60 },
  iconBtnText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  primaryBtn: { flex: 1, height: 50, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' }
});
