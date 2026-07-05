import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VendorSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    storeName: '',
    storeLocation: '',
    fssai: '',
    gstin: '',
  });

  const handleNext = () => {
    if (step === 1 && (!form.ownerName || !form.ownerEmail || !form.ownerPhone)) {
      Alert.alert('Missing Fields', 'Please fill in all personal details.');
      return;
    }
    if (step === 2 && (!form.storeName || !form.storeLocation)) {
      Alert.alert('Missing Fields', 'Please fill in required store details.');
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitOnboarding();
    }
  };

  const submitOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/platform/vendors/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Onboarding failed. Please try again.');
      }

      const data = await res.json();
      
      // Store the newly created store info locally for testing
      await AsyncStorage.setItem('@store_id', data.store.id);
      
      Alert.alert(
        'Welcome to Zapkirana!',
        'Your store has been created successfully. You can now access your Command Center.',
        [{ text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)/dashboard') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Zapkirana Network</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        <Animated.View key={step} entering={FadeInDown.duration(400)}>
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Personal Details</Text>
              <Text style={styles.stepSubtitle}>Let's start with who you are.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="John Doe" value={form.ownerName} onChangeText={t => setForm({...form, ownerName: t})} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" value={form.ownerEmail} onChangeText={t => setForm({...form, ownerEmail: t})} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} placeholder="9876543210" keyboardType="phone-pad" value={form.ownerPhone} onChangeText={t => setForm({...form, ownerPhone: t})} />
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Store Profile</Text>
              <Text style={styles.stepSubtitle}>Tell us about your grocery store.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Name</Text>
                <TextInput style={styles.input} placeholder="John's Fresh Mart" value={form.storeName} onChangeText={t => setForm({...form, storeName: t})} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Location (City/Area)</Text>
                <TextInput style={styles.input} placeholder="Koramangala, Bangalore" value={form.storeLocation} onChangeText={t => setForm({...form, storeLocation: t})} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Compliance & Tax</Text>
              <Text style={styles.stepSubtitle}>To enable online payments & GST billing.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FSSAI License Number (Optional)</Text>
                <TextInput style={styles.input} placeholder="Optional for testing" value={form.fssai} onChangeText={t => setForm({...form, fssai: t})} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>GSTIN (Optional)</Text>
                <TextInput style={styles.input} placeholder="Optional for testing" autoCapitalize="characters" value={form.gstin} onChangeText={t => setForm({...form, gstin: t})} />
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{step === 3 ? 'Launch Store' : 'Next Step'}</Text>
          )}
        </TouchableOpacity>
        
        {step === 1 && (
          <View style={styles.loginLink}>
            <Text style={{ color: Colors.textSecondary }}>Already have a store? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Login here</Text></TouchableOpacity>
            </Link>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  
  progressContainer: { height: 4, backgroundColor: Colors.borderLight, width: '100%' },
  progressBar: { height: '100%', backgroundColor: Colors.primary },

  content: { flex: 1 },
  stepTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  stepSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 24 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },

  footer: { padding: 20, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadows.sm },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
});
