import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { ScanBarcode } from 'lucide-react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// Replace with your local machine's IP or actual backend URL
import { API_BASE_URL } from '../../constants/api';
const BASE_URL = API_BASE_URL;

export default function LoginScreen() {
  const [deviceCode, setDeviceCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!deviceCode || !pin) {
      setError('Please enter device code and pin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Stubbing the login call for the scanner
      // The real backend would expect POST /auth/login or a specific /scanner/login
      const response = await axios.post(`${BASE_URL}/auth/scanner/login`, {
        deviceCode,
        pin,
      });

      const { token, storeId, deviceId, staffId, sessionId, role } = response.data;
      await login(token, storeId, deviceId, staffId, sessionId, role || 'STAFF');
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <ScanBarcode size={64} color="#0EA5E9" />
        <Text style={styles.title}>Kwick Scanner</Text>
        <Text style={styles.subtitle}>Kirana Operating System</Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="Device Code (e.g. DVC-001)"
          value={deviceCode}
          onChangeText={setDeviceCode}
          autoCapitalize="characters"
        />

        <TextInput
          style={styles.input}
          placeholder="Staff PIN"
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Authenticate Device</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0EA5E9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#7DD3FC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
