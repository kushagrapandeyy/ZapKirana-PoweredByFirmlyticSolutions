import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Radius, Shadows } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role: 'CUSTOMER' })
      });
      
      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem('@auth_token', data.accessToken);
        Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Account created successfully' });
        router.replace('/');
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: 'Registration Failed', text2: err.message || 'Something went wrong' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please try again later' });
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Basko to get fresh groceries delivered</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign Up</Text>}
            </TouchableOpacity>

          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Log in</Text>
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
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  
  primaryBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', marginTop: 12, ...Shadows.glow },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
