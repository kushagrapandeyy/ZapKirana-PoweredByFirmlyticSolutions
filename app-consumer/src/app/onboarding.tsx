import React, { useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function BrandWelcomeScreen() {
  const router = useRouter();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, []);

  const heroAnim = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [40, 0]) }],
  }));

  const handleSetLocation = () => {
    router.push('/location-permission');
  };

  const handleManualLocation = () => {
    router.push('/manual-location');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Decorative Premium Background Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="basket" size={42} color={Colors.surface} />
            </View>
            <Text style={styles.brandName}>ZapKirana</Text>
          </Animated.View>

          <Animated.View style={[styles.textContainer, heroAnim]}>
            <Text style={styles.title}>
              Curated groceries from stores around you.
            </Text>
            <Text style={styles.subtitle}>
              Fresh. Local. Fast.
            </Text>
          </Animated.View>

        </View>

        <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSetLocation}
            activeOpacity={0.85}
          >
            <Ionicons name="location" size={20} color={Colors.surface} />
            <Text style={styles.primaryBtnText}>Set my delivery location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleManualLocation}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Browse with manual location</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Warm off-white / soft ivory
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: Colors.primaryGhost,
    opacity: 0.6,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: height * 0.2,
    left: -width * 0.3,
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: Colors.accentLight,
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 36,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  brandContainer: {
    marginBottom: 40,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary, // Deep green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Shadows.md,
  },
  brandName: {
    fontSize: 48,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  textContainer: {
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 42,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: Radius.full,
    gap: 10,
    ...Shadows.glow,
  },
  primaryBtnText: {
    color: Colors.surface,
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});
