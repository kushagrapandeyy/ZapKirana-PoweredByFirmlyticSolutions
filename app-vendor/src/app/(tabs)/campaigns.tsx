import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

const ANIMATIONS = [
  { id: 'DEFAULT', name: 'Standard Banner', icon: 'ribbon-outline' },
  { id: 'FLASH_SALE', name: 'Flash Sale (Red Pulsing)', icon: 'flash-outline' },
  { id: 'WEEKEND_BLOWOUT', name: 'Weekend Blowout (Confetti)', icon: 'partly-sunny-outline' },
];

export default function CampaignsScreen() {
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New Campaign Form
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('');
  const [animationType, setAnimationType] = useState('DEFAULT');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns?storeId=${CURRENT_STORE_ID}`);
      if (res.ok) {
        setActiveCampaigns(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!title || !discount) {
      Alert.alert('Missing Info', 'Please enter a title and discount percentage.');
      return;
    }

    setSubmitting(true);
    try {
      // Hardcode some product IDs for testing, or we could fetch all products and apply it
      // Let's fetch all active products for the store and apply this campaign to the top 10
      const prodRes = await fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`);
      const products = await prodRes.json();
      const productIds = products.slice(0, 10).map((p: any) => p.id); // Apply to first 10 products

      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: CURRENT_STORE_ID,
          title,
          discountPercentage: parseFloat(discount),
          animationType,
          productIds
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Campaign Launched Successfully! Animation sequence will now play on Consumer App.');
        setIsCreating(false);
        setTitle('');
        setDiscount('');
        fetchCampaigns();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to launch campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndCampaign = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/campaigns/${id}/end`, { method: 'POST' });
      fetchCampaigns();
    } catch (e) {
      console.error(e);
    }
  };

  if (isCreating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsCreating(false)} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Campaign</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ padding: 20 }}>
          <Text style={styles.label}>Campaign Title</Text>
          <TextInput style={styles.input} placeholder="e.g. Weekend Flash Sale" value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Discount Percentage (%)</Text>
          <TextInput style={styles.input} placeholder="e.g. 20" keyboardType="numeric" value={discount} onChangeText={setDiscount} />

          <Text style={styles.label}>Animation Sequence (Consumer App)</Text>
          <View style={styles.animSelector}>
            {ANIMATIONS.map(anim => (
              <TouchableOpacity 
                key={anim.id} 
                style={[styles.animCard, animationType === anim.id && styles.animCardActive]}
                onPress={() => setAnimationType(anim.id)}
              >
                <Ionicons name={anim.icon as any} size={24} color={animationType === anim.id ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.animText, animationType === anim.id && styles.animTextActive]}>{anim.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.launchBtn} onPress={handleLaunchCampaign} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.launchBtnText}>Launch Campaign</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Marketing & Campaigns</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreating(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>New Campaign</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView style={{ padding: 20 }}>
          {activeCampaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Active Campaigns</Text>
              <Text style={styles.emptySub}>Launch a campaign to boost your sales with automated UI sequences.</Text>
            </View>
          ) : (
            activeCampaigns.map((camp, i) => (
              <Animated.View key={camp.id} entering={FadeInDown.delay(i * 100)} style={styles.campaignCard}>
                <View style={styles.campHeader}>
                  <View style={styles.badge}><Text style={styles.badgeText}>LIVE</Text></View>
                  <Text style={styles.campDiscount}>{camp.discountPercentage}% OFF</Text>
                </View>
                <Text style={styles.campTitle}>{camp.title}</Text>
                <Text style={styles.campAnim}>Sequence: {camp.animationType.replace('_', ' ')}</Text>
                
                <View style={styles.campFooter}>
                  <Text style={styles.campProducts}>{camp.products?.length || 0} Products Attached</Text>
                  <TouchableOpacity style={styles.endBtn} onPress={() => handleEndCampaign(camp.id)}>
                    <Text style={styles.endBtnText}>End Campaign</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  screenTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
  createBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginLeft: 4 },

  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 16, fontSize: 16, fontFamily: 'Inter_500Medium' },

  animSelector: { gap: 12 },
  animCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, padding: 16, borderRadius: Radius.lg, gap: 12 },
  animCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGhost },
  animText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  animTextActive: { color: Colors.primary, fontFamily: 'Inter_700Bold' },

  launchBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 16, alignItems: 'center', marginTop: 32 },
  launchBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },

  campaignCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.primaryGhost, ...Shadows.sm },
  campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { backgroundColor: Colors.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  campDiscount: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.successDark },
  campTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  campAnim: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, textTransform: 'capitalize' },
  
  campFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  campProducts: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  endBtn: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  endBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
});
