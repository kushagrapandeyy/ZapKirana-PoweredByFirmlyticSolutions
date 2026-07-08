import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL, CURRENT_STORE_ID } from '../../constants/api';

type CampaignType = 'BANNER' | 'CAROUSEL' | 'OFFER';

export default function CampaignsScreen() {
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard State
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discount, setDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns?storeId=${CURRENT_STORE_ID}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCampaigns(data);
      }
    } catch (e) {
      console.error('Failed to fetch campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!title) {
      Alert.alert('Missing Info', 'Please enter a campaign title.');
      return;
    }
    if (selectedType === 'OFFER' && !discount) {
      Alert.alert('Missing Info', 'Please enter a discount percentage.');
      return;
    }
    if (selectedType === 'BANNER' && !imageUrl) {
      Alert.alert('Missing Info', 'Please provide an image URL for the banner.');
      return;
    }

    setSubmitting(true);
    try {
      // Mock product selection logic: apply to top 5 products if it's an offer/carousel
      let productIds: string[] = [];
      if (selectedType !== 'BANNER') {
        const prodRes = await fetch(`${API_BASE_URL}/inventory/products?storeId=${CURRENT_STORE_ID}`);
        if (prodRes.ok) {
          const products = await prodRes.json();
          productIds = products.slice(0, 5).map((p: any) => p.id);
        }
      }

      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: CURRENT_STORE_ID,
          title,
          description,
          type: selectedType,
          imageUrl: selectedType === 'BANNER' ? imageUrl : undefined,
          discountPercentage: selectedType === 'OFFER' ? parseFloat(discount) : 0,
          productIds,
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Marketing Campaign Launched! It is now live in the consumer app feed.');
        closeWizard();
        fetchCampaigns();
      } else {
        const errorData = await res.json();
        Alert.alert('Failed', errorData.message || 'Could not create campaign.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Network error while launching campaign');
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

  const closeWizard = () => {
    setIsCreating(false);
    setStep(1);
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setDiscount('');
  };

  // Render Functions
  const banners = activeCampaigns.filter(c => c.type === 'BANNER');
  const carousels = activeCampaigns.filter(c => c.type === 'CAROUSEL');
  const offers = activeCampaigns.filter(c => c.type === 'OFFER');

  if (isCreating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 1 ? closeWizard : () => setStep(1)} style={{ padding: 4 }}>
            <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Campaign Suite</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ padding: 20 }}>
          {step === 1 ? (
            <Animated.View entering={FadeInDown}>
              <Text style={styles.wizardSubtitle}>Select the type of marketing asset to add to your store feed.</Text>
              
              <TouchableOpacity 
                style={[styles.typeCard, selectedType === 'BANNER' && styles.typeCardActive]}
                onPress={() => setSelectedType('BANNER')}
              >
                <View style={styles.typeIconBox}><Ionicons name="image-outline" size={28} color={Colors.primary} /></View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeTitle}>Hero Banner</Text>
                  <Text style={styles.typeDesc}>Large, visually striking image at the top of your feed. (Max 3)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeCard, selectedType === 'CAROUSEL' && styles.typeCardActive]}
                onPress={() => setSelectedType('CAROUSEL')}
              >
                <View style={styles.typeIconBox}><Ionicons name="albums-outline" size={28} color={Colors.primary} /></View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeTitle}>Product Carousel</Text>
                  <Text style={styles.typeDesc}>A horizontal scrollable list of curated products (e.g. "Weekend Essentials").</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeCard, selectedType === 'OFFER' && styles.typeCardActive]}
                onPress={() => setSelectedType('OFFER')}
              >
                <View style={styles.typeIconBox}><Ionicons name="pricetag-outline" size={28} color={Colors.primary} /></View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeTitle}>Flash Offer</Text>
                  <Text style={styles.typeDesc}>Highlight a massive discount across a category to drive urgency.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.launchBtn, !selectedType && { opacity: 0.5 }]} 
                onPress={() => setStep(2)}
                disabled={!selectedType}
              >
                <Text style={styles.launchBtnText}>Next Step</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown}>
              <Text style={styles.wizardSubtitle}>Configure your {selectedType?.toLowerCase()} settings.</Text>

              <Text style={styles.label}>Campaign Title *</Text>
              <TextInput style={styles.input} placeholder={`e.g. ${selectedType === 'BANNER' ? 'Diwali Dhamaka' : 'Fresh Arrivals'}`} value={title} onChangeText={setTitle} />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Add context..." value={description} onChangeText={setDescription} multiline />

              {selectedType === 'BANNER' && (
                <>
                  <Text style={styles.label}>Image URL *</Text>
                  <TextInput style={styles.input} placeholder="https://example.com/banner.jpg" value={imageUrl} onChangeText={setImageUrl} />
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  ) : null}
                </>
              )}

              {selectedType === 'OFFER' && (
                <>
                  <Text style={styles.label}>Discount Percentage (%) *</Text>
                  <TextInput style={styles.input} placeholder="e.g. 50" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
                </>
              )}

              <TouchableOpacity style={styles.launchBtn} onPress={handleLaunchCampaign} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.launchBtnText}>Publish Campaign</Text>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Marketing Center</Text>
          <Text style={styles.subHeaderText}>{activeCampaigns.length}/15 Campaigns Active</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreating(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView style={{ padding: 20 }}>
          {activeCampaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="rocket-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Your feed is empty.</Text>
              <Text style={styles.emptySub}>Transform your store into a curated, engaging experience by launching banners and offers.</Text>
            </View>
          ) : (
            <View style={{ gap: 32, paddingBottom: 60 }}>
              
              {/* BANNERS SECTION */}
              {banners.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hero Banners</Text>
                    <Text style={styles.sectionCount}>{banners.length}/3</Text>
                  </View>
                  {banners.map((camp, i) => (
                    <Animated.View key={camp.id} entering={FadeInDown.delay(i * 100)} style={styles.bannerCard}>
                      {camp.imageUrl ? (
                        <Image source={{ uri: camp.imageUrl }} style={styles.bannerImg} />
                      ) : (
                        <View style={[styles.bannerImg, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="image" size={32} color="#94a3b8" />
                        </View>
                      )}
                      <View style={styles.bannerOverlay}>
                        <View style={styles.badge}><Text style={styles.badgeText}>LIVE</Text></View>
                      </View>
                      <View style={styles.campFooter}>
                        <Text style={styles.campTitle}>{camp.title}</Text>
                        <TouchableOpacity onPress={() => handleEndCampaign(camp.id)}>
                          <Text style={styles.endBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* CAROUSELS SECTION */}
              {carousels.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Product Carousels</Text>
                  </View>
                  {carousels.map((camp, i) => (
                    <Animated.View key={camp.id} entering={FadeInDown.delay(i * 100)} style={styles.carouselCard}>
                      <View style={styles.badge}><Text style={styles.badgeText}>LIVE</Text></View>
                      <Text style={styles.campTitle}>{camp.title}</Text>
                      <Text style={styles.campAnim}>{camp.products?.length || 0} items curated</Text>
                      <TouchableOpacity style={styles.endBtnFloat} onPress={() => handleEndCampaign(camp.id)}>
                        <Text style={styles.endBtnText}>End</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* OFFERS SECTION */}
              {offers.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Flash Offers</Text>
                  </View>
                  {offers.map((camp, i) => (
                    <Animated.View key={camp.id} entering={FadeInDown.delay(i * 100)} style={styles.offerCard}>
                      <View style={styles.offerLeft}>
                        <Text style={styles.offerDiscount}>{camp.discountPercentage}% OFF</Text>
                        <Text style={styles.campTitle}>{camp.title}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleEndCampaign(camp.id)} style={styles.offerEndBtn}>
                        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}

            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, // Premium warm ivory
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: '#fff' },
  screenTitle: { fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold', color: '#111827' },
  subHeaderText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6B7280' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#111827' },
  
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#047857', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full }, // Deep Grocery Green
  createBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold', marginLeft: 6 },

  wizardSubtitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#4B5563', marginBottom: 24, lineHeight: 22 },
  
  typeCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: Radius.xl, marginBottom: 16, borderWidth: 2, borderColor: 'transparent', ...Shadows.sm },
  typeCardActive: { borderColor: '#047857', backgroundColor: '#ECFDF5' },
  typeIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  typeInfo: { flex: 1, justifyContent: 'center' },
  typeTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#111827', marginBottom: 4 },
  typeDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#6B7280', lineHeight: 18 },

  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#111827', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: Radius.lg, padding: 16, fontSize: 16, fontFamily: 'Inter_500Medium' },
  previewImage: { width: '100%', height: 160, borderRadius: Radius.lg, marginTop: 12, resizeMode: 'cover' },

  launchBtn: { flexDirection: 'row', backgroundColor: '#047857', borderRadius: Radius.lg, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 8, ...Shadows.md },
  launchBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#111827', marginTop: 24 },
  emptySub: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#6B7280', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#111827' },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6B7280' },

  // Banners
  bannerCard: { backgroundColor: '#fff', borderRadius: Radius.xl, marginBottom: 16, overflow: 'hidden', ...Shadows.sm },
  bannerImg: { width: '100%', height: 160, resizeMode: 'cover' },
  bannerOverlay: { position: 'absolute', top: 12, right: 12 },
  
  // Carousels
  carouselCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 20, marginBottom: 16, ...Shadows.sm, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  endBtnFloat: { position: 'absolute', right: 20, top: 20, padding: 6 },
  
  // Offers
  offerCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: Radius.xl, padding: 20, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', ...Shadows.sm, borderWidth: 1, borderColor: '#FEE2E2' },
  offerLeft: { flex: 1 },
  offerDiscount: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#DC2626', marginBottom: 4 },
  offerEndBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: Radius.full },

  campTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#111827' },
  campAnim: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280', marginTop: 4 },
  
  campFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  badge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  endBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#DC2626' },
});
