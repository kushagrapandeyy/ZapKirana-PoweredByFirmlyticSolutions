import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth, Role } from '@/context/AuthContext';
import { API_BASE_URL } from '../../constants/api';

const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter your phone/email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      await login(data.user.phone || data.user.email, data.user.role, data.access_token, data.user.storeId);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
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
            {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}
            <Text style={styles.label}>Phone or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone or email"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
            
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Login Securely'}</Text>
            </TouchableOpacity>
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
