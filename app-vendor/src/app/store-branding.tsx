import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function StoreBrandingScreen() {
  const router = useRouter();
  const { tenantId } = useAuth();
  
  const [storeName, setStoreName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stores/${tenantId}`)
      .then(res => res.json())
      .then(data => {
        setStoreName(data.name || '');
        setLogoUrl(data.logoUrl || '');
        setBannerUrl(data.bannerUrl || '');
        setDescription(data.description || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  const pickImage = async (type: 'logo' | 'banner') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'banner' ? [16, 6] : [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      if (type === 'logo') setLogoUrl(result.assets[0].uri);
      if (type === 'banner') setBannerUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const qs = new URLSearchParams({
        name: storeName,
        logoUrl: logoUrl,
        bannerUrl: bannerUrl,
      });
      const res = await fetch(`${API_BASE_URL}/stores/${tenantId}?${qs.toString()}`, {
        method: 'POST'
      });
      if (res.ok) {
        Alert.alert("Success", "Store branding updated!");
      } else {
        Alert.alert("Error", "Failed to update branding.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 50}} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Store Branding</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.section}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput 
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="e.g. ZapKirana Main Store"
          />
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.label}>Logo Image URL</Text>
            <TouchableOpacity onPress={() => pickImage('logo')} style={styles.pickBtn}>
              <Ionicons name="image-outline" size={16} color={ROYAL_BLUE} />
              <Text style={styles.pickBtnText}>Pick & Crop</Text>
            </TouchableOpacity>
          </View>
          <TextInput 
            style={styles.input}
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="https://..."
          />
          {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logoPreview} /> : null}
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.label}>Banner Image URL</Text>
            <TouchableOpacity onPress={() => pickImage('banner')} style={styles.pickBtn}>
              <Ionicons name="image-outline" size={16} color={ROYAL_BLUE} />
              <Text style={styles.pickBtnText}>Pick & Crop</Text>
            </TouchableOpacity>
          </View>
          <TextInput 
            style={styles.input}
            value={bannerUrl}
            onChangeText={setBannerUrl}
            placeholder="https://..."
          />
        </View>

        {/* Consumer Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Consumer App Preview</Text>
          <Text style={styles.helpText}>This is exactly how your store will appear to customers on the ZapKirana app landing page.</Text>
          
          <View style={styles.previewCard}>
            <Image source={{ uri: bannerUrl || `https://placehold.co/800x300/1D4ED8/FFFFFF?text=${encodeURIComponent(storeName || 'Store')}` }} style={styles.previewBanner} />
            <View style={styles.previewOverlay} />
            <View style={styles.previewContent}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.previewLogo} />
              ) : (
                <View style={[styles.previewLogo, { justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE }]}>
                  <Ionicons name="storefront" size={20} color={ROYAL_BLUE} />
                </View>
              )}
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewName}>{storeName || 'Store Name'}</Text>
                <View style={styles.previewRating}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={styles.previewRatingText}>4.5 Rating</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 20, color: '#0f172a', fontFamily: 'Inter_700Bold' },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  logoPreview: { width: 60, height: 60, borderRadius: 30, marginTop: 12, backgroundColor: '#e2e8f0' },
  
  previewSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 8 },
  helpText: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  
  previewCard: { borderRadius: 16, backgroundColor: WHITE, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  previewBanner: { width: '100%', height: 70, resizeMode: 'cover' },
  previewOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', height: 70 },
  previewContent: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: -25, marginBottom: 12 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  pickBtnText: { color: ROYAL_BLUE, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  previewLogo: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: WHITE, backgroundColor: WHITE },
  previewTextContainer: { marginLeft: 12, flex: 1, paddingBottom: 2 },
  previewName: { fontSize: 16, fontFamily: 'PlayfairDisplay_700Bold', color: '#0f172a' },
  previewRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  previewRatingText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748b' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: WHITE, padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  saveBtn: { backgroundColor: ROYAL_BLUE, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_700Bold' }
});
