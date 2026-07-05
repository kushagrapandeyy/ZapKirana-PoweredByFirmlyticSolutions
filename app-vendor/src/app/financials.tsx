import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../constants/api';

const { width } = Dimensions.get('window');

export default function FinancialsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState<any>(null);

  useEffect(() => {
    const fetchFin = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/profit?storeId=${CURRENT_STORE_ID}`);
        if (res.ok) {
          setProfitData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFin();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const pieData = profitData ? [
    {
      name: 'Profit',
      population: profitData.netProfit,
      color: Colors.success,
      legendFontColor: Colors.textSecondary,
    },
    {
      name: 'PO Cost',
      population: profitData.totalCOGS,
      color: Colors.info,
      legendFontColor: Colors.textSecondary,
    },
    {
      name: 'Expenses',
      population: profitData.totalExpenses,
      color: Colors.danger,
      legendFontColor: Colors.textSecondary,
    }
  ] : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Financial Deep Dive</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>P&L Breakdown</Text>
          {profitData ? (
            <PieChart
              data={pieData}
              width={width - 72}
              height={180}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          ) : (
            <Text style={styles.noData}>No profit data available.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Metrics Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Revenue</Text>
            <Text style={styles.val}>₹{(profitData?.totalRevenue || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total COGS</Text>
            <Text style={styles.val}>₹{(profitData?.totalCOGS || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Net Profit</Text>
            <Text style={[styles.val, { color: Colors.successDark }]}>₹{(profitData?.netProfit || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Profit Margin</Text>
            <Text style={styles.val}>{profitData?.profitMargin || '0%'}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  content: { flex: 1, padding: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20, marginBottom: 20, ...Shadows.sm },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 16 },
  noData: { color: Colors.textSecondary, fontFamily: 'Inter_500Medium', textAlign: 'center', padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  val: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary }
});
