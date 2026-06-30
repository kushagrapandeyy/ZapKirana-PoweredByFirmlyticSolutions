import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const MINT_GREEN = '#10b981';
const WHITE = '#FFFFFF';
const DARK_BG = '#0f172a';

export default function HelpScreen() {
  const router = useRouter();
  const [issueText, setIssueText] = useState('');

  const submitIssue = () => {
    if (!issueText.trim()) return;
    
    Toast.show({
      type: 'success',
      text1: 'Support Ticket Created',
      text2: 'Our team will reach out to you shortly!',
    });
    setIssueText('');
    setTimeout(() => router.back(), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.faqCard}>
            <View style={styles.iconBox}>
              <Ionicons name="cube-outline" size={24} color={MINT_GREEN} />
            </View>
            <View style={styles.faqTextContainer}>
              <Text style={styles.faqTitle}>Where is my order?</Text>
              <Text style={styles.faqDesc}>Track your order status live from the Orders tab or delivery screen.</Text>
            </View>
          </View>
          
          <View style={styles.faqCard}>
            <View style={styles.iconBox}>
              <Ionicons name="card-outline" size={24} color={MINT_GREEN} />
            </View>
            <View style={styles.faqTextContainer}>
              <Text style={styles.faqTitle}>Payment failed?</Text>
              <Text style={styles.faqDesc}>Any deducted amount will be refunded within 5-7 working days.</Text>
            </View>
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>Describe your issue and we'll get back to you.</Text>
            
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              placeholder="Tell us what went wrong..."
              value={issueText}
              onChangeText={setIssueText}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.submitBtn, !issueText.trim() && styles.submitBtnDisabled]} 
              onPress={submitIssue}
              disabled={!issueText.trim()}
            >
              <Text style={styles.submitBtnText}>Submit Ticket</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: WHITE },
  backBtn: { padding: 5, marginRight: 15 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0f172a' },
  scrollContent: { padding: 20 },
  faqCard: { flexDirection: 'row', backgroundColor: WHITE, padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  faqTextContainer: { flex: 1 },
  faqTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#1e293b', marginBottom: 4 },
  faqDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b', lineHeight: 20 },
  contactSection: { marginTop: 30, backgroundColor: WHITE, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  contactTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0f172a', marginBottom: 5 },
  contactSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748b', marginBottom: 15 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 15, fontSize: 15, fontFamily: 'Inter_400Regular', minHeight: 120 },
  submitBtn: { backgroundColor: MINT_GREEN, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitBtnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
