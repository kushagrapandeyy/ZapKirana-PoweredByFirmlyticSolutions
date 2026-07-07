import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

export default function TillScreen() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTill, setActiveTill] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionReason, setTransactionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStoreAndTill();
  }, []);

  const loadStoreAndTill = async () => {
    try {
      setIsLoading(true);
      const sid = await AsyncStorage.getItem('storeId');
      setStoreId(sid);
      if (sid) {
        await fetchActiveTill(sid);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveTill = async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/till/active/${sid}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTill(data); // null if no till open
      } else {
        setActiveTill(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTill = async () => {
    if (!storeId) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/till/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, openingBalance: parseFloat(openingBalance) || 0 })
      });
      if (res.ok) {
        await fetchActiveTill(storeId);
      } else {
        Alert.alert('Error', 'Failed to open till');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open till');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogTransaction = async (type: 'EXPENSE' | 'CASH_IN') => {
    if (!activeTill || !transactionAmount) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/till/${activeTill.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: parseFloat(transactionAmount) || 0, reason: transactionReason })
      });
      if (res.ok) {
        setTransactionAmount('');
        setTransactionReason('');
        await fetchActiveTill(storeId!);
      } else {
        Alert.alert('Error', 'Failed to log transaction');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTill = () => {
    Alert.prompt(
      "Close Till",
      "Enter the actual counted cash currently in the drawer to close the day:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Day",
          style: "destructive",
          onPress: async (countedCash) => {
            if (countedCash === undefined || countedCash === null) return;
            try {
              setIsSubmitting(true);
              const res = await fetch(`${API_BASE_URL}/till/${activeTill.id}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actualClosingBalance: parseFloat(countedCash) || 0 })
              });
              if (res.ok) {
                const closedData = await res.json();
                Alert.alert(
                  'Day Closed',
                  `Till closed. Expected: ₹${activeTill.expectedBalance}. Counted: ₹${parseFloat(countedCash)}. Discrepancy: ₹${closedData.discrepancy}.`
                );
                await fetchActiveTill(storeId!);
              } else {
                Alert.alert('Error', 'Failed to close till');
              }
            } catch (e) {
              console.error(e);
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ],
      "plain-text",
      activeTill?.expectedBalance?.toString() || "0",
      "number-pad"
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cash Register</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {!activeTill ? (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.cardTitle}>Till is Closed</Text>
            <Text style={styles.cardDesc}>Open the cash drawer to start the day and track cash flows.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Cash Float (₹)</Text>
              <TextInput
                style={styles.input}
                value={openingBalance}
                onChangeText={setOpeningBalance}
                keyboardType="numeric"
                placeholder="e.g. 1000"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.btnPrimary, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleOpenTill}
              disabled={isSubmitting}
            >
              <Text style={styles.btnPrimaryText}>Open Till</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Active Till Overview */}
            <View style={[styles.card, { backgroundColor: Colors.primary }]}>
              <Text style={[styles.cardTitle, { color: Colors.background }]}>Expected Cash in Drawer</Text>
              <Text style={[styles.bigValue, { color: Colors.background }]}>₹ {activeTill.expectedBalance?.toFixed(2)}</Text>
              
              <View style={styles.statsRow}>
                <View>
                  <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Opening Float</Text>
                  <Text style={[styles.statValue, { color: Colors.background }]}>₹ {activeTill.openingBalance}</Text>
                </View>
                <View>
                  <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Opened At</Text>
                  <Text style={[styles.statValue, { color: Colors.background }]}>
                    {new Date(activeTill.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Log Cash Flow</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={transactionAmount}
                  onChangeText={setTransactionAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 50"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason / Note</Text>
                <TextInput
                  style={styles.input}
                  value={transactionReason}
                  onChangeText={setTransactionReason}
                  placeholder="e.g. Tea for staff, Paid delivery boy"
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: '#fee2e2' }]} 
                  onPress={() => handleLogTransaction('EXPENSE')}
                  disabled={isSubmitting || !transactionAmount}
                >
                  <Ionicons name="arrow-down-circle" size={20} color={Colors.danger} />
                  <Text style={[styles.btnActionText, { color: Colors.danger }]}>Log Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: '#dcfce7' }]} 
                  onPress={() => handleLogTransaction('CASH_IN')}
                  disabled={isSubmitting || !transactionAmount}
                >
                  <Ionicons name="arrow-up-circle" size={20} color={Colors.success} />
                  <Text style={[styles.btnActionText, { color: Colors.success }]}>Add Cash</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Close Day Button */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity style={styles.btnDanger} onPress={handleCloseTill}>
                <Ionicons name="lock-closed" size={20} color="#fff" />
                <Text style={styles.btnDangerText}>Close Till (End of Day)</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions */}
            {activeTill.transactions && activeTill.transactions.length > 0 && (
              <View style={{ marginTop: 30 }}>
                <Text style={styles.sectionTitle}>Today's Logs</Text>
                {activeTill.transactions.map((tx: any) => (
                  <View key={tx.id} style={styles.txItem}>
                    <View style={styles.txIconBox}>
                      <Ionicons 
                        name={tx.type === 'SALE' || tx.type === 'CASH_IN' ? 'add' : 'remove'} 
                        size={20} 
                        color={tx.type === 'SALE' || tx.type === 'CASH_IN' ? Colors.success : Colors.danger} 
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.txReason}>{tx.reason || tx.type}</Text>
                      <Text style={styles.txTime}>{new Date(tx.createdAt).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={[
                      styles.txAmount,
                      { color: tx.type === 'SALE' || tx.type === 'CASH_IN' ? Colors.success : Colors.textPrimary }
                    ]}>
                      {tx.type === 'SALE' || tx.type === 'CASH_IN' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 20,
    ...Shadows.sm,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  bigValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 42,
    textAlign: 'center',
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  inputGroup: { marginBottom: 15 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    padding: 12,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  btnPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    fontSize: 16,
  },
  btnDanger: {
    backgroundColor: Colors.danger,
    padding: 15,
    borderRadius: Radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnDangerText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: Radius.md,
    gap: 6,
  },
  btnActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: Radius.md,
    marginBottom: 10,
    ...Shadows.sm,
  },
  txIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  txReason: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  txTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  }
});
