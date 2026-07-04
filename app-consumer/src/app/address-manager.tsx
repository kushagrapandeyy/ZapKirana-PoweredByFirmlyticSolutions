import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5'; // Mock User

export default function AddressManager() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses?userId=${CURRENT_CUSTOMER_ID}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (e) {
      console.error('Failed to fetch addresses', e);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      await fetchAddresses();
      // Wait shortly before routing back to reflect changes
      setTimeout(() => router.back(), 500);
    } catch (e) {
      setLoading(false);
    }
  };

  const getIconForLabel = (label: string) => {
    if (label.toLowerCase().includes('home')) return 'home';
    if (label.toLowerCase().includes('work') || label.toLowerCase().includes('office')) return 'briefcase';
    return 'location';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.addNewCard} 
          activeOpacity={0.8}
          onPress={() => router.push('/address-picker')}
        >
          <View style={styles.addNewIcon}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.addNewTitle}>Add New Address</Text>
            <Text style={styles.addNewSubtitle}>Use precise location</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Saved Addresses</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          addresses.map((addr, index) => (
            <Animated.View key={addr.id} entering={FadeInDown.delay(index * 100).springify()}>
              <TouchableOpacity 
                style={[styles.addressCard, addr.isDefault && styles.addressCardActive]} 
                onPress={() => setDefaultAddress(addr.id)}
              >
                <View style={[styles.iconBox, addr.isDefault && styles.iconBoxActive]}>
                  <Ionicons name={getIconForLabel(addr.label)} size={20} color={addr.isDefault ? '#fff' : Colors.textSecondary} />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{addr.label} {addr.isDefault && <Text style={styles.defaultBadge}> (Default)</Text>}</Text>
                  <Text style={styles.addressText}>{addr.streetAddress ? `${addr.streetAddress}, ` : ''}{addr.address}</Text>
                </View>
                {addr.isDefault && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

        {!loading && addresses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No saved addresses found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: Colors.surface },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginLeft: 8 },
  
  content: { padding: 16 },
  
  addNewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.xl, marginBottom: 24, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  addNewIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  addNewTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  addNewSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.xl, marginBottom: 12, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  addressCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconBoxActive: { backgroundColor: Colors.primary },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  defaultBadge: { color: Colors.primary, fontSize: 13 },
  addressText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, lineHeight: 18 },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 12, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
});
