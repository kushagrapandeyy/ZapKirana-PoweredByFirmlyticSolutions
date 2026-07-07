import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { OfflineQueueService } from '../../services/OfflineQueueService';

const API_URL = `${API_BASE_URL}/inventory`;

type PendingProduct = {
  id: string;
  barcode: string | null;
  suggestedName: string | null;
  suggestedCategory: string | null;
  mrp: number | null;
  sellingPrice: number | null;
  imageUrl: string | null;
  createdAt: string;
  createdBy: { name: string; role: string } | null;
};

export default function ApprovalsScreen() {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'PO'>('INVENTORY');
  
  const [pendingItems, setPendingItems] = useState<PendingProduct[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [poLoading, setPoLoading] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState<PendingProduct | null>(null);
  
  // Modal state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');

  useEffect(() => {
    fetchPendingItems();
    fetchPendingPOs();

    const subscription = supabase
      .channel(`approvals_updates_${CURRENT_STORE_ID}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Product', filter: `storeId=eq.${CURRENT_STORE_ID}` },
        (payload) => {
          fetchPendingItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/products?storeId=${CURRENT_STORE_ID}&status=PENDING_APPROVAL`);
      if (response.ok) {
        const data = await response.json();
        setPendingItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPOs = async () => {
    setPoLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/purchase-orders/store/${CURRENT_STORE_ID}`);
      if (res.ok) {
        const data = await res.json();
        setPendingPOs(data.filter((po: any) => po.status === 'CREATED'));
      }
    } catch (error) {
      console.error('Failed to fetch POs:', error);
    } finally {
      setPoLoading(false);
    }
  };

  const openApprovalModal = (item: PendingProduct) => {
    setSelectedItem(item);
    setEditName(item.suggestedName || '');
    setEditCategory(item.suggestedCategory || '');
    setEditMrp(item.mrp ? item.mrp.toString() : '');
    setEditSellingPrice(item.sellingPrice ? item.sellingPrice.toString() : '');
  };

  const handleApproveInventory = async () => {
    if (!selectedItem) return;

    if (!editName || !editSellingPrice) {
      Alert.alert('Validation Error', 'Name and Selling Price are required.');
      return;
    }

    try {
      const response = await OfflineQueueService.apiFetch(`${API_URL}/products/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          mrp: parseFloat(editMrp) || null,
          sellingPrice: parseFloat(editSellingPrice),
          status: 'ACTIVE'
        }),
      });

      if (response.ok || response.status === 202) {
        setSelectedItem(null);
        if (response.status === 202) {
          Alert.alert('Offline Mode', 'Approval queued for sync.');
          // Optimistically remove from list
          setPendingItems(prev => prev.filter(i => i.id !== selectedItem.id));
        } else {
          fetchPendingItems();
        }
      } else {
        Alert.alert('Error', 'Failed to approve item.');
      }
    } catch (error) {
      console.error('Error approving item:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleRejectInventory = async (id: string) => {
    try {
      const response = await OfflineQueueService.apiFetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok || response.status === 202) {
        if (response.status === 202) {
          Alert.alert('Offline Mode', 'Rejection queued for sync.');
          setPendingItems(prev => prev.filter(i => i.id !== id));
        } else {
          fetchPendingItems();
        }
      }
    } catch(e) {
      console.error(e);
    }
  }

  const handleApprovePO = async (poId: string) => {
    try {
      const response = await OfflineQueueService.apiFetch(`${API_BASE_URL}/purchase-orders/${poId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok || response.status === 202) {
        if (response.status === 202) {
           Alert.alert('Offline Mode', 'PO Approval queued.');
           setPendingPOs(prev => prev.filter(p => p.id !== poId));
        } else {
           Alert.alert('Success', 'Purchase Order Approved and Sent.');
           fetchPendingPOs();
        }
      } else {
        Alert.alert('Error', 'Failed to approve PO.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectPO = async (poId: string) => {
    try {
      const response = await OfflineQueueService.apiFetch(`${API_BASE_URL}/purchase-orders/${poId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok || response.status === 202) {
        if (response.status === 202) {
           Alert.alert('Offline Mode', 'PO Rejection queued.');
           setPendingPOs(prev => prev.filter(p => p.id !== poId));
        } else {
           Alert.alert('Rejected', 'Purchase Order Draft deleted.');
           fetchPendingPOs();
        }
      } else {
        Alert.alert('Error', 'Failed to reject PO.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1-to-1 match with inventory product card style
  const renderInventoryItem = ({ item, index }: { item: PendingProduct, index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify().damping(15)}>
        <TouchableOpacity style={styles.productCard} onPress={() => openApprovalModal(item)} activeOpacity={0.7}>
          <Image 
            source={{ uri: item.imageUrl || `https://placehold.co/100x100?text=${item.suggestedName?.substring(0,1) || '?'}` }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.suggestedName || 'Unknown Product'}</Text>
            <Text style={styles.productCategory}>{item.suggestedCategory || 'General'}</Text>
            <Text style={styles.productPrice}>₹{item.sellingPrice || '--'}</Text>
          </View>
          <View style={styles.actionsColumn}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: Colors.success, borderWidth: 1 }]}
              onPress={() => openApprovalModal(item)}
            >
              <Ionicons name="checkmark-outline" size={20} color={Colors.successDark} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: Colors.danger, borderWidth: 1, marginTop: 8 }]}
              onPress={() => handleRejectInventory(item.id)}
            >
              <Ionicons name="close-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPOItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(15)}>
      <View style={styles.poCard}>
        <View style={styles.poCardHeader}>
          <View style={styles.barcodeWrapper}>
            <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.barcodeText}>PO #{item.id.slice(-6).toUpperCase()}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.poCardBody}>
          <View style={styles.poProductImage}>
            <Ionicons name="business" size={32} color={Colors.textSecondary} />
          </View>
          <View style={styles.poProductInfo}>
            <Text style={styles.poProductName} numberOfLines={2}>
              {item.supplier?.name || 'Unknown Supplier'}
            </Text>
            <Text style={styles.poCategoryText}>{item.items?.length || 0} Items Ordered</Text>
            <View style={styles.poPriceRow}>
              <Text style={styles.poPriceLabel}>Total Value: </Text>
              <Text style={styles.poPriceValue}>₹{item.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.poCardFooter}>
          <Text style={styles.scannedByText}>Drafted by Staff</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.rejectBtn} 
              activeOpacity={0.8}
              onPress={() => handleRejectPO(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.approveCardBtn}
              onPress={() => handleApprovePO(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.approveCardBtnText}>Approve & Send</Text>
              <Ionicons name="paper-plane-outline" size={16} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Approvals</Text>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>{pendingItems.length + pendingPOs.length} ACTION REQUIRED</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Review scanner inventory dumps and drafted POs.</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'INVENTORY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('INVENTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'INVENTORY' && styles.tabTextActive]}>Inventory ({pendingItems.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'PO' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PO')}
        >
          <Text style={[styles.tabText, activeTab === 'PO' && styles.tabTextActive]}>Purchase Orders ({pendingPOs.length})</Text>
        </TouchableOpacity>
      </View>

      {(activeTab === 'INVENTORY' ? loading : poLoading) ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={activeTab === 'INVENTORY' ? pendingItems : pendingPOs}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'INVENTORY' ? renderInventoryItem : renderPOItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No pending items to approve.</Text>
            </View>
          }
        />
      )}

      {/* Approval Modal (Inventory) */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approve Product</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.formContainer}>
                <Image 
                  source={{ uri: selectedItem.imageUrl || `https://placehold.co/100x100?text=?` }} 
                  style={styles.modalImage} 
                />

                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Tata Salt 1kg"
                />

                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder="e.g. Groceries"
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>MRP (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={editMrp}
                      onChangeText={setEditMrp}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Selling Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={editSellingPrice}
                      onChangeText={setEditSellingPrice}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.approveBtn} onPress={handleApproveInventory} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.approveBtnText}>Publish to Catalog</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { padding: 20, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  headerSub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 4 },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#E2E8F0' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontFamily: 'Inter_700Bold' },

  listContainer: { padding: 20, paddingBottom: 100 },
  
  // INVENTORY EXACT MATCH STYLES
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: Radius.xl, padding: 12, marginBottom: 12, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  cardImage: { width: 64, height: 64, borderRadius: Radius.lg, backgroundColor: '#F8FAFC', marginRight: 16 },
  cardInfo: { flex: 1 },
  productName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  productCategory: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 6 },
  productPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  actionsColumn: { alignItems: 'center', justifyContent: 'center' },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // PO SPECIFIC STYLES
  poCard: { backgroundColor: '#fff', borderRadius: Radius.xl, marginBottom: 16, overflow: 'hidden', ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9' },
  poCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  barcodeWrapper: { flexDirection: 'row', alignItems: 'center' },
  barcodeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.5 },
  timeText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textMuted },
  
  poCardBody: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  poProductImage: { width: 64, height: 64, borderRadius: Radius.lg, backgroundColor: '#F1F5F9', marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  poProductInfo: { flex: 1 },
  poProductName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  poCategoryText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 8 },
  poPriceRow: { flexDirection: 'row', alignItems: 'center' },
  poPriceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  poPriceValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.successDark },

  poCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 0 },
  scannedByText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  approveCardBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 16, height: 36, borderRadius: 18, gap: 4, ...Shadows.sm },
  approveCardBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 13 },
  
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionPill: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#FECACA' },
  actionPillText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.danger, letterSpacing: 0.5 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FAF9F6', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20 },
  
  formContainer: {},
  modalImage: { width: 80, height: 80, borderRadius: Radius.lg, alignSelf: 'center', marginBottom: 24, backgroundColor: '#fff', ...Shadows.sm },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', height: 50, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.sm },
  row: { flexDirection: 'row' },
  approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, height: 56, borderRadius: Radius.xl, marginTop: 16, gap: 8, ...Shadows.md },
  approveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
});
