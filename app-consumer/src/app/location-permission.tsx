import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';
import Toast from 'react-native-toast-message';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const [hasConsent, setHasConsent] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!hasConsent) {
      Toast.show({
        type: 'error',
        text1: 'Consent Required',
        text2: 'Please agree to the Privacy Policy to continue.',
      });
      return;
    }
    // Mappls SDK Integration placeholder
    // 1. Get GPS Location
    // 2. Mappls Reverse Geocoding API -> human readable address
    router.push('/store-selector');
  };

  const handleManualLocation = () => {
    if (!hasConsent) {
      Toast.show({
        type: 'error',
        text1: 'Consent Required',
        text2: 'Please agree to the Privacy Policy to continue.',
      });
      return;
    }
    router.push('/manual-location');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="navigate" size={40} color={Colors.primary} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={styles.title}>Find grocery stores near you</Text>
          <Text style={styles.subtitle}>
            We use your location to show stores that can deliver to your address.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(600)} style={styles.footer}>
        
        {/* Privacy Consent Checkbox */}
        <TouchableOpacity 
          style={styles.consentRow} 
          onPress={() => setHasConsent(!hasConsent)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, hasConsent && styles.checkboxActive]}>
            {hasConsent && <Ionicons name="checkmark" size={14} color={Colors.surface} />}
          </View>
          <Text style={styles.consentText}>
            I consent to Kwick's <Text style={styles.link}>Privacy Policy</Text> and <Text style={styles.link}>Terms of Use</Text>. 
            Personal data is redacted; only usage behavior is tracked for performance improvements.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, !hasConsent && styles.primaryBtnDisabled]}
          onPress={handleUseCurrentLocation}
          activeOpacity={hasConsent ? 0.85 : 1}
        >
          <Ionicons name="location" size={20} color={Colors.surface} />
          <Text style={styles.primaryBtnText}>Use current location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleManualLocation}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Enter address manually</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Warm off-white
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    lineHeight: 16,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.full,
    gap: 8,
    ...Shadows.glow,
    marginBottom: 12,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
