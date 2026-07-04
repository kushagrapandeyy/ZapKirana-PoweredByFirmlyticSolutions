import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Shadows, Radius } from '../constants/theme';
import { API_BASE_URL } from '../constants/api';

const CURRENT_CUSTOMER_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5';

export default function AddressPicker() {
  const router = useRouter();
  const [locationStr, setLocationStr] = useState('Detecting location...');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(true);
  
  const [form, setForm] = useState({
    streetAddress: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    label: 'Home'
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStr('Permission to access location was denied');
        setLocating(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
        
        // Reverse geocoding
        let geo = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (geo && geo.length > 0) {
          const g = geo[0];
          setLocationStr(`${g.name || g.street || ''}, ${g.city || g.subregion || ''}`);
          setForm(prev => ({
            ...prev,
            city: g.city || g.subregion || prev.city,
            state: g.region || prev.state,
            pincode: g.postalCode || prev.pincode,
          }));
        } else {
          setLocationStr(`Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`);
        }
      } catch (e) {
        setLocationStr('Unable to fetch precise location');
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.streetAddress || !form.pincode) {
      alert("Please enter House/Flat No. and Pincode");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        userId: CURRENT_CUSTOMER_ID,
        label: form.label,
        streetAddress: form.streetAddress,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        address: locationStr, // raw summary
        latitude: coords?.lat || 12.9716,
        longitude: coords?.lng || 77.5946,
        isDefault: true // newly added addresses become default automatically
      };

      await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      router.back();
    } catch (e) {
      console.error(e);
      alert("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Address</Text>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Mock Map View Area */}
          <View style={styles.mapMock}>
            <Ionicons name="map" size={60} color={Colors.surfaceAlt} style={styles.mapIconBg} />
            <View style={styles.pinContainer}>
              {locating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="location" size={40} color={Colors.danger} style={styles.pin} />
              )}
            </View>
          </View>
          
          <View style={styles.locationSummary}>
            <View style={styles.locIconBox}>
              <Ionicons name="locate" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locTitle}>Detected Location</Text>
              <Text style={styles.locText} numberOfLines={2}>{locationStr}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Flat / House No. / Building *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Flat 402, Sunshine Resi" 
              placeholderTextColor={Colors.textMuted}
              value={form.streetAddress}
              onChangeText={t => setForm({...form, streetAddress: t})}
            />

            <Text style={styles.formLabel}>Landmark (Optional)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Near Apollo Pharmacy" 
              placeholderTextColor={Colors.textMuted}
              value={form.landmark}
              onChangeText={t => setForm({...form, landmark: t})}
            />
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>City</Text>
                <TextInput style={styles.input} value={form.city} onChangeText={t => setForm({...form, city: t})} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.formLabel}>Pincode *</Text>
                <TextInput style={styles.input} value={form.pincode} keyboardType="numeric" onChangeText={t => setForm({...form, pincode: t})} />
              </View>
            </View>
            
            <Text style={styles.formLabel}>Save As</Text>
            <View style={styles.chipRow}>
              {['Home', 'Work', 'Other'].map(lbl => (
                <TouchableOpacity 
                  key={lbl} 
                  style={[styles.chip, form.label === lbl && styles.chipActive]}
                  onPress={() => setForm({...form, label: lbl})}
                >
                  <Text style={[styles.chipText, form.label === lbl && styles.chipTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving || locating}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, zIndex: 10 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginLeft: 8 },
  
  content: { flex: 1 },
  
  mapMock: { height: 180, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  mapIconBg: { position: 'absolute', opacity: 0.5 },
  pinContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  pin: { marginTop: -20 },
  
  locationSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  locIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  locTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 2 },
  locText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  
  formContainer: { padding: 16, paddingBottom: 40 },
  formLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  chipRow: { flexDirection: 'row', gap: 12 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  
  footer: { padding: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
