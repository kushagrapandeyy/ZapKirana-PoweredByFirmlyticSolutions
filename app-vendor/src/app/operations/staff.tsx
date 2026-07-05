import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export default function StaffManagement() {
  const { tenantId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'STAFF' | 'TIMESHEETS' | 'WAGE_SLIPS'>('STAFF');
  
  const [staff, setStaff] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [wageSlips, setWageSlips] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [staffRes, timesheetsRes, wagesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/hr/staff?storeId=${tenantId}`),
        fetch(`${API_BASE_URL}/admin/hr/timesheets?storeId=${tenantId}`),
        fetch(`${API_BASE_URL}/admin/hr/wage-slips?storeId=${tenantId}`),
      ]);

      if (staffRes.ok) setStaff(await staffRes.json());
      if (timesheetsRes.ok) setTimesheets(await timesheetsRes.json());
      if (wagesRes.ok) setWageSlips(await wagesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const renderStaff = () => (
    <View style={styles.list}>
      {staff.map((member, index) => {
        const isClockedIn = member.timesheets && member.timesheets.length > 0;
        return (
          <Animated.View key={member.id} entering={FadeInDown.delay(index * 50).springify().damping(15)}>
            <View style={styles.card}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{member.name?.substring(0,2).toUpperCase() || 'UN'}</Text>
                <View style={[styles.statusDot, { backgroundColor: isClockedIn ? Colors.success : Colors.textMuted }]} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.staffName}>{member.name || 'Unknown'}</Text>
                <Text style={styles.staffRole}>{member.role}</Text>
                {isClockedIn && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '45%' }]} />
                  </View>
                )}
              </View>
              <View style={[styles.badge, { backgroundColor: isClockedIn ? '#F0FDF4' : '#F1F5F9' }]}>
                <Text style={[styles.badgeText, { color: isClockedIn ? Colors.successDark : Colors.textSecondary }]}>
                  {isClockedIn ? 'On Duty' : 'Off Duty'}
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );

  const renderTimesheets = () => (
    <View style={styles.list}>
      {timesheets.map((ts, index) => (
        <Animated.View key={ts.id} entering={FadeInDown.delay(index * 50).springify().damping(15)}>
          <View style={styles.card}>
            <View style={[styles.avatarCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="time" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.staffName}>{ts.staff?.name}</Text>
              <View style={styles.timesRow}>
                <Ionicons name="enter-outline" size={14} color={Colors.success} />
                <Text style={styles.timeText}>{new Date(ts.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} style={{ marginHorizontal: 8 }} />
                <Ionicons name="exit-outline" size={14} color={ts.clockOut ? Colors.danger : Colors.textMuted} />
                <Text style={styles.timeText}>{ts.clockOut ? new Date(ts.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}</Text>
              </View>
              {!ts.clockOut && (
                <View style={[styles.progressTrack, { marginTop: 8 }]}>
                  <View style={[styles.progressFill, { width: '60%', backgroundColor: Colors.warning }]} />
                </View>
              )}
            </View>
            <View style={[styles.badge, { backgroundColor: ts.clockOut ? '#F1F5F9' : '#FEF2F2' }]}>
              <Text style={[styles.badgeText, { color: ts.clockOut ? Colors.textSecondary : Colors.danger }]}>
                {ts.clockOut ? 'Completed' : 'Active'}
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderWageSlips = () => (
    <View style={styles.list}>
      {wageSlips.map((slip, index) => (
        <Animated.View key={slip.id} entering={FadeInDown.delay(index * 50).springify().damping(15)}>
          <View style={styles.card}>
            <View style={[styles.avatarCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash" size={20} color="#D97706" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.staffName}>{slip.staff?.name}</Text>
              <Text style={styles.timeText}>Period: {new Date(slip.periodStart).toLocaleDateString()} - {new Date(slip.periodEnd).toLocaleDateString()}</Text>
              <View style={styles.rateRow}>
                <Ionicons name="time" size={14} color={Colors.textMuted} />
                <Text style={styles.timeText}>{slip.totalHours} hrs @ ₹{slip.hourlyRate}/hr</Text>
              </View>
            </View>
            <View style={styles.slipRight}>
              <Text style={styles.slipAmount}>₹{slip.totalAmount}</Text>
              <TouchableOpacity style={styles.pdfBtn}>
                <Ionicons name="document-text" size={14} color={Colors.primary} />
                <Text style={styles.pdfBtnText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Human Resources</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="person-add" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {['STAFF', 'TIMESHEETS', 'WAGE_SLIPS'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {activeTab === 'STAFF' && renderStaff()}
            {activeTab === 'TIMESHEETS' && renderTimesheets()}
            {activeTab === 'WAGE_SLIPS' && renderWageSlips()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, gap: 12 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: Radius.xl, ...Shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarInitials: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primaryDark },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  cardContent: { flex: 1, marginLeft: 16 },
  staffName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  staffRole: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 3 },
  timesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginLeft: 4 },
  rateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  slipRight: { alignItems: 'flex-end', gap: 8 },
  slipAmount: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryGhost, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 4, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)' },
  pdfBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primaryDark },
});
