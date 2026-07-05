import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

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
  const [pendingItems, setPendingItems] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingProduct | null>(null);
  
  // Modal state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');

  useEffect(() => {
    fetchPendingItems();

    // Subscribe to pending product inserts
    const subscription = supabase
      .channel(`approvals_updates_${CURRENT_STORE_ID}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Product', filter: `storeId=eq.${CURRENT_STORE_ID}` },
        (payload) => {
          // Typically we'd check if status === 'PENDING_APPROVAL' on the payload
          console.log('Realtime Approval Alert:', payload);
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

  const openApprovalModal = (item: PendingProduct) => {
    setSelectedItem(item);
    setEditName(item.suggestedName || '');
    setEditCategory(item.suggestedCategory || '');
    setEditMrp(item.mrp ? item.mrp.toString() : '');
    setEditSellingPrice(item.sellingPrice ? item.sellingPrice.toString() : '');
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    if (!editName || !editSellingPrice) {
      Alert.alert('Validation Error', 'Name and Selling Price are required.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${selectedItem.id}/approve`, {
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

      if (response.ok) {
        setSelectedItem(null);
        fetchPendingItems();
      } else {
        Alert.alert('Error', 'Failed to approve item.');
      }
    } catch (error) {
      console.error('Error approving item:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const renderItem = ({ item, index }: { item: PendingProduct, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(15)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.barcodeWrapper}>
            <Ionicons name="barcode-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.barcodeText}>{item.barcode}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.cardBody}>
          <Image 
            source={{ uri: item.imageUrl || `https://placehold.co/100x100?text=${item.suggestedName?.substring(0,1) || '?'}` }} 
            style={styles.productImage} 
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.suggestedName || 'Unknown Product'}
            </Text>
            <Text style={styles.categoryText}>{item.suggestedCategory || 'Uncategorized'}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Suggested Price: </Text>
              <Text style={styles.priceValue}>₹{item.sellingPrice || '--'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.scannedByText}>
            Scanned by: <Text style={{ fontFamily: 'Inter_700Bold' }}>{item.createdBy?.name || 'Staff'}</Text>
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.rejectBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={Colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.approveCardBtn}
              onPress={() => openApprovalModal(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.approveCardBtnText}>Review</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
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
            <Text style={styles.actionPillText}>{pendingItems.length} ACTION REQUIRED</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Review scanner inventory dumps and price overrides.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pendingItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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

      {/* Approval Modal */}
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

                <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.8}>
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
  listContainer: { padding: 20, paddingBottom: 100 },
  
  card: { backgroundColor: '#fff', borderRadius: Radius.xl, marginBottom: 16, overflow: 'hidden', ...Shadows.md, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  barcodeWrapper: { flexDirection: 'row', alignItems: 'center' },
  barcodeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.5 },
  timeText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textMuted },
  
  cardBody: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  productImage: { width: 64, height: 64, borderRadius: Radius.lg, backgroundColor: '#F1F5F9', marginRight: 16 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  categoryText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  priceValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.successDark },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 0 },
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
