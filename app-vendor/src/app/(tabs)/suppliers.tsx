import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, CURRENT_STORE_ID } from '@/constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';
const { width } = Dimensions.get('window');

export default function SuppliersScreen() {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'MY_SUPPLIERS'>('DIRECTORY');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [myConnections, setMyConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'DIRECTORY') {
        const res = await fetch(`${API_BASE_URL}/suppliers`);
        const data = await res.json();
        if (Array.isArray(data)) setSuppliers(data);
      } else {
        const res = await fetch(`${API_BASE_URL}/suppliers/connections?storeId=${CURRENT_STORE_ID}`);
        const data = await res.json();
        if (Array.isArray(data)) setMyConnections(data);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectToSupplier = async (supplierId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: CURRENT_STORE_ID, supplierId }),
      });
      if (res.ok) {
        alert('Connection request sent!');
        fetchData(); // refresh to show updated status or if it moved to connected
      } else {
        alert('Failed to connect to supplier.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const renderDirectory = () => {
    return suppliers.map(supplier => {
      // Check if already connected/pending
      const connection = myConnections.find(c => c.supplierId === supplier.id);
      return (
        <View key={supplier.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{supplier.name}</Text>
              <Text style={styles.cardSubtitle}>{supplier.categories}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#eab308" />
              <Text style={styles.ratingText}>{supplier.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.contactInfo}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text style={styles.contactText}>{supplier.contactPhone || 'N/A'}</Text>
            </View>
            {connection ? (
              <View style={[styles.statusBadge, connection.status === 'CONNECTED' ? styles.statusConnected : styles.statusPending]}>
                <Text style={[styles.statusText, connection.status === 'CONNECTED' ? styles.statusTextConnected : styles.statusTextPending]}>
                  {connection.status}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.connectBtn} onPress={() => connectToSupplier(supplier.id)}>
                <Text style={styles.connectBtnText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    });
  };

  const renderMySuppliers = () => {
    if (myConnections.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>You haven't connected with any suppliers yet.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => setActiveTab('DIRECTORY')}>
            <Text style={styles.browseBtnText}>Browse Directory</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return myConnections.map(conn => (
      <View key={conn.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{conn.supplier.name}</Text>
            <Text style={styles.cardSubtitle}>{conn.supplier.categories}</Text>
          </View>
          <View style={[styles.statusBadge, conn.status === 'CONNECTED' ? styles.statusConnected : styles.statusPending]}>
            <Text style={[styles.statusText, conn.status === 'CONNECTED' ? styles.statusTextConnected : styles.statusTextPending]}>
              {conn.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="document-text-outline" size={18} color={ROYAL_BLUE} />
            <Text style={styles.actionBtnText}>New Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubbles-outline" size={18} color={ROYAL_BLUE} />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supplier Network</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'DIRECTORY' && styles.activeTab]} 
          onPress={() => setActiveTab('DIRECTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'DIRECTORY' && styles.activeTabText]}>Directory</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'MY_SUPPLIERS' && styles.activeTab]} 
          onPress={() => {
            setActiveTab('MY_SUPPLIERS');
            // Optimistic prefetch for UX
            fetch(`${API_BASE_URL}/suppliers/connections?storeId=${CURRENT_STORE_ID}`)
              .then(res => res.json())
              .then(setMyConnections).catch(console.error);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'MY_SUPPLIERS' && styles.activeTabText]}>My Suppliers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={ROYAL_BLUE} style={{ marginTop: 50 }} />
        ) : (
          activeTab === 'DIRECTORY' ? renderDirectory() : renderMySuppliers()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, color: '#0f172a', fontFamily: 'PlayfairDisplay_700Bold' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  activeTab: { borderBottomColor: ROYAL_BLUE },
  tabText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#64748b' },
  activeTabText: { color: ROYAL_BLUE },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: WHITE, padding: 18, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1e293b', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  ratingText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#a16207' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#475569' },
  connectBtn: { backgroundColor: ROYAL_BLUE, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  connectBtnText: { color: WHITE, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusPending: { backgroundColor: '#fef9c3' },
  statusConnected: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  statusTextPending: { color: '#854d0e' },
  statusTextConnected: { color: '#166534' },
  actionRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#eff6ff', paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: ROYAL_BLUE },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#64748b', fontFamily: 'Inter_400Regular', marginVertical: 20 },
  browseBtn: { backgroundColor: ROYAL_BLUE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseBtnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
