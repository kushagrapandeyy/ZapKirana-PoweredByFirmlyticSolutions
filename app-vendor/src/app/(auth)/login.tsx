import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth, Role } from '@/context/AuthContext';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const handleSendOTP = () => {
    if (phone.length === 10) {
      setStep('OTP');
    } else {
      alert('Enter a valid 10-digit phone number');
    }
  };

  const handleLogin = async () => {
    if (otp === '1234') {
      // Mock assigning a role based on phone number for testing
      let assignedRole: Role = 'PICKER';
      if (phone === '9999999999') assignedRole = 'OWNER';
      if (phone === '8888888888') assignedRole = 'MANAGER';
      if (phone === '7777777777') assignedRole = 'PARTNER';

      await login(phone, assignedRole);
    } else {
      alert('Invalid OTP. Use 1234');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>GE</Text>
            </View>
            <Text style={styles.title}>GrocerEase OS</Text>
            <Text style={styles.subtitle}>Staff & Partner Portal</Text>
          </View>

          <View style={styles.card}>
            {step === 'PHONE' ? (
              <>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
                <TouchableOpacity style={styles.btn} onPress={handleSendOTP}>
                  <Text style={styles.btnText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter OTP sent to +91 {phone}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 1234"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity style={styles.btn} onPress={handleLogin}>
                  <Text style={styles.btnText}>Login Securely</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep('PHONE')}>
                  <Text style={styles.backBtnText}>Change Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.hints}>
            <Text style={styles.hintTitle}>Test Accounts:</Text>
            <Text style={styles.hintText}>9999999999 (Owner)</Text>
            <Text style={styles.hintText}>8888888888 (Manager)</Text>
            <Text style={styles.hintText}>7777777777 (Partner)</Text>
            <Text style={styles.hintText}>Any other (Picker)</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  logoBox: { width: 60, height: 60, backgroundColor: ROYAL_BLUE, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: ROYAL_BLUE, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  logoText: { color: WHITE, fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold' },
  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', fontFamily: 'Inter_400Regular', marginTop: 5 },
  card: { backgroundColor: WHITE, padding: 25, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1e293b', marginBottom: 10 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 15, fontSize: 16, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  btn: { backgroundColor: ROYAL_BLUE, padding: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  backBtn: { marginTop: 15, alignItems: 'center' },
  backBtnText: { color: '#64748b', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  hints: { marginTop: 40, alignItems: 'center' },
  hintTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#64748b', marginBottom: 10 },
  hintText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#94a3b8', marginBottom: 4 }
});
