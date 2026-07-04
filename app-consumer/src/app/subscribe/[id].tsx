import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5';

const FREQUENCIES = [
  { id: 'DAILY', title: 'Daily', desc: 'Every morning' },
  { id: 'WEEKLY', title: 'Weekly', desc: 'Once a week' },
  { id: 'CUSTOM', title: 'Custom Days', desc: 'Pick your days' },
];

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function SubscribeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [freq, setFreq] = useState('DAILY');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`)
      .then(res => res.json())
      .then(data => {
        const current = data.find((p: any) => p.id === id);
        if (current) {
          setProduct({
            id: current.id,
            name: current.name,
            price: current.sellingPrice,
            image: current.imageUrl || 'https://via.placeholder.com/150',
            discount: current.subscriptionDiscount || 0
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleDay = (d: string) => {
    if (customDays.includes(d)) {
      setCustomDays(customDays.filter(x => x !== d));
    } else {
      setCustomDays([...customDays, d]);
    }
  };

  const handleSubscribe = async () => {
    if (freq === 'CUSTOM' && customDays.length === 0) {
      alert("Please select at least one day for custom frequency");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        customerId: CURRENT_CUSTOMER_ID,
        storeId: CURRENT_STORE_ID,
        frequency: freq,
        customDays: freq === 'CUSTOM' ? customDays : undefined,
        discountApplied: product?.discount || 0,
        items: [{
          productId: product.id,
          productName: product.name,
          quantity: 1
        }]
      };
      
      await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      alert("Subscription setup successful!");
      router.back();
    } catch (e) {
      alert("Failed to setup subscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const discountedPrice = (product.price - (product.price * (product.discount / 100))).toFixed(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.productCard}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            {product.discount > 0 ? (
              <View style={styles.priceRow}>
                <Text style={styles.strikethroughPrice}>₹{product.price}</Text>
                <Text style={styles.finalPrice}>₹{discountedPrice}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{product.discount}% OFF</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.finalPrice}>₹{product.price}</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Delivery Frequency</Text>
        
        {FREQUENCIES.map(f => (
          <TouchableOpacity 
            key={f.id} 
            style={[styles.freqCard, freq === f.id && styles.freqCardActive]}
            onPress={() => setFreq(f.id)}
          >
            <View style={styles.freqInfo}>
              <Text style={styles.freqTitle}>{f.title}</Text>
              <Text style={styles.freqDesc}>{f.desc}</Text>
            </View>
            <View style={[styles.radio, freq === f.id && styles.radioActive]}>
              {freq === f.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        {freq === 'CUSTOM' && (
          <View style={styles.customDaysContainer}>
            <Text style={styles.customDaysTitle}>Select Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map(d => {
                const isActive = customDays.includes(d);
                return (
                  <TouchableOpacity 
                    key={d} 
                    style={[styles.dayBtn, isActive && styles.dayBtnActive]}
                    onPress={() => toggleDay(d)}
                  >
                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{d.toUpperCase().substring(0, 1)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>You can pause, modify, or cancel this subscription at any time from the Subscriptions hub.</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubscribe} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Confirm Subscription</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginLeft: 8 },
  
  content: { padding: 16 },
  
  productCard: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 12, borderRadius: Radius.lg, marginBottom: 24, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
  productImage: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, marginRight: 12 },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strikethroughPrice: { fontSize: 13, color: Colors.textMuted, textDecorationLine: 'line-through', fontFamily: 'Inter_400Regular' },
  finalPrice: { fontSize: 16, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  discountBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountBadgeText: { color: Colors.success, fontSize: 10, fontFamily: 'Inter_700Bold' },
  
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 12 },
  
  freqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
  freqCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  freqInfo: { flex: 1 },
  freqTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 2 },
  freqDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  
  customDaysContainer: { backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight },
  customDaysTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 12 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  dayBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  dayTextActive: { color: '#fff' },
  
  infoBox: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, padding: 12, borderRadius: Radius.md, gap: 8, marginTop: 16 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, lineHeight: 18 },
  
  footer: { padding: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
