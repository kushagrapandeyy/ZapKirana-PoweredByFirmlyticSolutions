import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Colors, Radius, Shadows } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');

  const handleLogin = async () => {
    if (!identifier) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter your phone or email' });
      return;
    }

    setLoading(true);
    try {
      if (method === 'PHONE') {
        const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: identifier })
        });
        if (res.ok) {
          const data = await res.json();
          setVerificationId(data.verificationId);
          setShowOtp(true);
          Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Please check your phone' });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send OTP' });
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, password })
        });
        if (res.ok) {
          const data = await res.json();
          await AsyncStorage.setItem('@auth_token', data.accessToken);
          router.replace('/');
        } else {
          Toast.show({ type: 'error', text1: 'Login Failed', text2: 'Invalid credentials' });
        }
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please try again later' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier, code: otp, verificationId })
      });
      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem('@auth_token', data.accessToken);
        router.replace('/');
      } else {
        Toast.show({ type: 'error', text1: 'Verification Failed', text2: 'Invalid OTP' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown} style={styles.titleSection}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Kwick</Text>
          </Animated.View>

          {!showOtp ? (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.form}>
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, method === 'PHONE' && styles.toggleBtnActive]}
                  onPress={() => setMethod('PHONE')}
                >
                  <Text style={[styles.toggleText, method === 'PHONE' && styles.toggleTextActive]}>Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, method === 'EMAIL' && styles.toggleBtnActive]}
                  onPress={() => setMethod('EMAIL')}
                >
                  <Text style={[styles.toggleText, method === 'EMAIL' && styles.toggleTextActive]}>Email</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{method === 'PHONE' ? 'Phone Number' : 'Email Address'}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name={method === 'PHONE' ? 'call-outline' : 'mail-outline'} size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder={method === 'PHONE' ? 'Enter 10-digit number' : 'Enter your email'}
                    placeholderTextColor={Colors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType={method === 'PHONE' ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {method === 'EMAIL' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryBtnText}>{method === 'PHONE' ? 'Get OTP' : 'Sign In'}</Text>
                )}
              </TouchableOpacity>

            </Animated.View>
          ) : (
            <Animated.View entering={SlideInRight} style={styles.form}>
              <Text style={styles.otpMessage}>Enter the 4-digit code sent to{'\n'}<Text style={{fontFamily: 'Inter_700Bold'}}>{identifier}</Text></Text>
              
              <View style={styles.inputGroup}>
                <View style={[styles.inputContainer, styles.otpInputContainer]}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="0000"
                    placeholderTextColor={Colors.textMuted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Proceed</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flexGrow: 1, padding: 24 },
  
  header: { alignItems: 'flex-end', marginBottom: 20 },
  closeBtn: { padding: 4 },
  
  titleSection: { marginBottom: 32 },
  title: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  
  form: { flex: 1 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: Colors.bg, padding: 4, borderRadius: Radius.full, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.full },
  toggleBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  toggleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  
  primaryBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', marginTop: 12, ...Shadows.glow },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  
  otpMessage: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 24, lineHeight: 24 },
  otpInputContainer: { justifyContent: 'center', borderColor: Colors.primary, borderWidth: 2 },
  otpInput: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center', letterSpacing: 8 },
  resendBtn: { marginTop: 24, alignItems: 'center' },
  resendText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 32 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
