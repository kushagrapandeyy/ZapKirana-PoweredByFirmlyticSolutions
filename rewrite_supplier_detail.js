const fs = require('fs');
const path = 'app-vendor/src/app/operations/supplier/[id].tsx';

const content = `import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../constants/api';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../../constants/theme';

const DUMMY_TRANSACTIONS = [
  { id: '1', date: 'Oct 24, 2023', type: 'Purchase', qty: 150, cost: 2450, sell: 3100 },
  { id: '2', date: 'Nov 02, 2023', type: 'Return', qty: 10, cost: 120, sell: 180 },
  { id: '3', date: 'Nov 15, 2023', type: 'Purchase', qty: 500, cost: 8900, sell: 11200 },
  { id: '4', date: 'Dec 01, 2023', type: 'Purchase', qty: 300, cost: 4500, sell: 6200 },
];

export default function SupplierDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSupplierDetail();
  }, [id]);

  const fetchSupplierDetail = async () => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers/\${id}\`);
      if (res.ok) {
        setSupplier(await res.json());
      } else {
        // Mock data if API fails
        setSupplier({
          name: 'ABC Corporation',
          contactPerson: 'Rahul Kumar',
          contactPhone: '+91 9876543210',
          contactEmail: 'abc.corporation@gmail.com',
          address: '1/2, W.E.A. Karol Bagh, New Delhi - 110005',
        });
      }
    } catch (e) {
      console.error(e);
      setSupplier({
        name: 'ABC Corporation',
        contactPerson: 'Rahul Kumar',
        contactPhone: '+91 9876543210',
        contactEmail: 'abc.corporation@gmail.com',
        address: '1/2, W.E.A. Karol Bagh, New Delhi - 110005',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !supplier) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{supplier.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Avatar Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRedHalf} />
          </View>
          <Text style={styles.profileName}>{supplier.name}</Text>
          <Text style={styles.profilePerson}>{supplier.contactPerson || 'Rahul Kumar'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="globe-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact Person</Text>
            <Text style={styles.infoValue}>{supplier.contactPerson || 'Rahul Kumar'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{supplier.contactPhone || '+91 9876543210'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValueBlue}>{supplier.contactEmail || 'abc.corporation@gmail.com'}</Text>
          </View>
          
          <View style={styles.infoRowAddress}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValueAddress}>{supplier.address || '1/2, W.E.A. Karol Bagh, New Delhi - 110005'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.transactionHeaderRow}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search history..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Table Container */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>TYPE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>QTY</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right', color: Colors.textPrimary }]}>COST</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>SELLING</Text>
            </View>
            <View style={styles.tableHeaderLine} />

            {/* Table Rows */}
            {DUMMY_TRANSACTIONS.map((txn, index) => (
              <Animated.View key={txn.id} entering={FadeIn.delay(index * 50)} style={[styles.tableRow, index === DUMMY_TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableRowText, { flex: 1.5 }]}>{txn.date}</Text>
                <Text style={[styles.tableRowText, { flex: 1, color: txn.type === 'Purchase' ? Colors.success : Colors.danger }]}>{txn.type}</Text>
                <Text style={[styles.tableRowText, { flex: 1, textAlign: 'right' }]}>{txn.qty}</Text>
                <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right', fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }]}>₹{txn.cost}</Text>
                <Text style={[styles.tableRowText, { flex: 1.2, textAlign: 'right' }]}>₹{txn.sell}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...Shadows.sm,
  },
  avatarRedHalf: {
    width: 100,
    height: 50,
    backgroundColor: Colors.danger,
    position: 'absolute',
    top: 0,
  },
  profileName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  profilePerson: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: { marginBottom: 6 },
  actionText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRowAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  infoValueBlue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  infoValueAddress: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
    lineHeight: 22,
  },
  transactionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 15,
    height: 44,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  tableHeaderText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  tableHeaderLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
`;

fs.writeFileSync(path, content, 'utf8');
console.log('Rewrote [id].tsx to Light Mode');
