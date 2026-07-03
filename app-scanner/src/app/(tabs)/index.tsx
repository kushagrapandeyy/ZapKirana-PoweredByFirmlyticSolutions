import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Box, Package, ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react-native';

export default function DashboardScreen() {
  const { staffId } = useAuthStore();
  const router = useRouter();

  const WORKFLOWS = [
    { id: 'GOODS_RECEIVING', label: 'Receive GRN', icon: Package, color: '#3B82F6' },
    { id: 'STOCK_AUDIT', label: 'Stock Audit', icon: ClipboardList, color: '#8B5CF6' },
    { id: 'PRODUCT_INTAKE', label: 'New Product', icon: Box, color: '#10B981' },
    { id: 'ORDER_PICKING', label: 'Pick Orders', icon: CheckCircle2, color: '#F59E0B' },
    { id: 'DAMAGED_EXPIRED', label: 'Damaged / Expired', icon: AlertTriangle, color: '#EF4444' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Staff {staffId?.substring(0, 5)}</Text>
        <Text style={styles.subtitle}>Select a workflow to start scanning</Text>
      </View>

      <View style={styles.grid}>
        {WORKFLOWS.map((workflow) => (
          <TouchableOpacity 
            key={workflow.id} 
            style={styles.card}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/scanner',
                params: { workflow: workflow.id }
              });
            }}
          >
            <View style={[styles.iconContainer, { backgroundColor: workflow.color + '20' }]}>
              <workflow.icon color={workflow.color} size={32} />
            </View>
            <Text style={styles.cardTitle}>{workflow.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});
