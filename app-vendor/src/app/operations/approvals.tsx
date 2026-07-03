import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/api';

// Hardcoded for now until auth context is fully connected
const STORE_ID = 'b935e4e7-4b15-46d5-8eb6-a36746cf5cb0'; // Same test store ID used in other tabs
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
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/pending?storeId=${STORE_ID}`);
      const data = await response.json();
      setPendingItems(data);
    } catch (error) {
      console.error('Error fetching pending products', error);
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
    
    try {
      const response = await fetch(`${API_URL}/pending/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          mrp: parseFloat(editMrp) || 0,
          sellingPrice: parseFloat(editSellingPrice) || 0,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Product approved and added to catalog.');
        setSelectedItem(null);
        fetchPendingItems();
      } else {
        Alert.alert('Error', 'Failed to approve product');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  const handleReject = async (id: string) => {
    Alert.alert('Reject Item', 'Are you sure you want to reject this scanned item?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reject', 
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/pending/${id}/reject`, { method: 'POST' });
            if (response.ok) {
              fetchPendingItems();
            }
          } catch (error) {
            Alert.alert('Error', 'Network error');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: PendingProduct }) => (
    <TouchableOpacity style={styles.card} onPress={() => openApprovalModal(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.barcodeTag}>
          <Ionicons name="barcode-outline" size={14} color="#064e3b" />
          <Text style={styles.barcodeText}>{item.barcode || 'NO BARCODE'}</Text>
        </View>
        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardBody}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#9ca3af" />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.suggestedName || 'Unknown Product'}</Text>
          <Text style={styles.productCategory}>{item.suggestedCategory || 'Uncategorized'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Suggested: </Text>
            <Text style={styles.priceValue}>₹{item.sellingPrice || 0}</Text>
          </View>
          {item.createdBy && (
            <Text style={styles.scannedBy}>Scanned by {item.createdBy.name}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={() => openApprovalModal(item)}>
          <Text style={styles.approveBtnText}>Review & Approve</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approvals</Text>
        <Text style={styles.headerSubtitle}>Review items scanned by your staff</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#064e3b" />
        </View>
      ) : pendingItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>All caught up!</Text>
          <Text style={styles.emptyStateSub}>No pending items to review.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Approval Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approve Product</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Enter official name" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} placeholder="Enter category" />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>MRP (₹)</Text>
                <TextInput style={styles.input} value={editMrp} onChangeText={setEditMrp} keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Selling Price (₹)</Text>
                <TextInput style={styles.input} value={editSellingPrice} onChangeText={setEditSellingPrice} keyboardType="numeric" />
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleApprove}>
              <Text style={styles.confirmBtnText}>Add to Catalog</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Warm off-white
  },
  header: {
    padding: 24,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  barcodeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#064e3b',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardBody: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  productCategory: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#4b5563',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064e3b',
  },
  scannedBy: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  rejectBtnText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  approveBtn: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptyStateSub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  confirmBtn: {
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
