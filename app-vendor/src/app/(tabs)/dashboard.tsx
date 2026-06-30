import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL, CURRENT_STORE_ID } from '@/constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';
const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { role } = useAuth();
  const [ledger, setLedger] = useState<any[]>([]);
  
  const canViewFinancials = role === 'OWNER' || role === 'PARTNER' || role === 'MANAGER';

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/inventory/ledger?storeId=${CURRENT_STORE_ID}`);
        if (res.ok) {
          const data = await res.json();
          setLedger(data);
        }
      } catch (err) {
        console.error('Failed to fetch ledger:', err);
      }
    };
    // Polling every 5 seconds for live updates demo
    fetchLedger();
    const interval = setInterval(fetchLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  };

  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [12000, 15000, 11000, 18000, 22000, 30000, 28000], color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`, strokeWidth: 2 }],
  };

  const exportPDF = async () => {
    let rows = '';
    
    ledger.forEach(entry => {
      rows += `
        <tr>
          <td>${entry.id.substring(0, 8)}</td>
          <td>${new Date(entry.createdAt).toLocaleString()}</td>
          <td>${entry.type}</td>
          <td>${entry.staff?.name || 'System'}</td>
          <td>${entry.quantityChange > 0 ? '+' : ''}${entry.quantityChange} units</td>
          <td>${entry.reason || entry.product?.name || '-'}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1D4ED8; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>GrocerEase Store Ledger</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Type</th>
              <th>Actor</th>
              <th>Qty Change</th>
              <th>Details</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      alert("Could not generate PDF");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store Dashboard</Text>
        {canViewFinancials && (
          <TouchableOpacity style={styles.exportBtn} onPress={exportPDF}>
            <Ionicons name="download-outline" size={16} color={ROYAL_BLUE} />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* KPI Cards (Role Restricted) */}
        {canViewFinancials ? (
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Ionicons name="cash" size={24} color={ROYAL_BLUE} />
              <Text style={styles.kpiValue}>₹12,450</Text>
              <Text style={styles.kpiLabel}>Today's Revenue (Est)</Text>
            </View>
            <View style={styles.kpiCard}>
              <Ionicons name="receipt" size={24} color={ROYAL_BLUE} />
              <Text style={styles.kpiValue}>₹622.50</Text>
              <Text style={styles.kpiLabel}>GST Liability (Est)</Text>
            </View>
          </View>
        ) : (
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Ionicons name="basket" size={24} color={ROYAL_BLUE} />
              <Text style={styles.kpiValue}>84</Text>
              <Text style={styles.kpiLabel}>Items Picked Today</Text>
            </View>
          </View>
        )}

        {/* Charts (Role Restricted) */}
        {canViewFinancials && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Weekly Revenue Trend</Text>
            <LineChart data={revenueData} width={width - 40} height={220} chartConfig={chartConfig} bezier style={styles.chart} />
          </View>
        )}

        {/* Append-Only Ledger */}
        <View style={styles.logsContainer}>
          <View style={styles.ledgerHeader}>
            <Text style={styles.sectionTitle}>Immutable Ledger</Text>
            <View style={styles.appendOnlyBadge}><Text style={styles.appendOnlyText}>Append-Only</Text></View>
          </View>
          
          {ledger.map(log => {
            return (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logLeft}>
                  <View style={[styles.iconBox, log.type === 'REFUND_TX' && {backgroundColor: '#fee2e2'}]}>
                    <Ionicons 
                      name={log.type === 'POS_SALE' ? 'cash-outline' : log.type === 'REFUND_TX' ? 'return-down-back' : 'document-text-outline'} 
                      size={20} 
                      color={log.type === 'REFUND_TX' ? '#ef4444' : ROYAL_BLUE} 
                    />
                  </View>
                  <View>
                    <Text style={styles.logTxId}>{log.id.substring(0,8)} • {log.staff?.name || 'System'}</Text>
                    <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleTimeString()} • {log.type}</Text>
                  </View>
                </View>
                <View style={styles.logRight}>
                  <Text style={[styles.logAmount, log.quantityChange < 0 && {color: '#ef4444'}]}>
                    {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                  </Text>
                  <Text style={styles.logMethod}>{log.product?.name?.substring(0, 10)}...</Text>
                </View>
              </View>
            )
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, color: '#0f172a', fontFamily: 'PlayfairDisplay_700Bold' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 5 },
  exportBtnText: { color: ROYAL_BLUE, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scrollContent: { paddingBottom: 100 },
  kpiContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: WHITE, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  kpiValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#0f172a', marginVertical: 8 },
  kpiLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748b' },
  chartContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 15 },
  chart: { borderRadius: 16, backgroundColor: WHITE, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  logsContainer: { paddingHorizontal: 20 },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  appendOnlyBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 15 },
  appendOnlyText: { color: '#166534', fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: WHITE, padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  logLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logTxId: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0f172a', marginBottom: 2 },
  logTime: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748b' },
  logRight: { alignItems: 'flex-end' },
  logAmount: { fontSize: 16, fontFamily: 'Inter_700Bold', color: ROYAL_BLUE, marginBottom: 2 },
  logMethod: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748b' },
});
