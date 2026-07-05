import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat, withSequence, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Colors, Shadows, Radius } from '../constants/theme';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId || '#ORD-8924';

  // Glow animation for the success ring
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const displayOrderId = (Array.isArray(orderId) ? orderId[0] : orderId)?.replace(/-/g, '').substring(0, 8).toUpperCase() || '12345678';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Creative Animation Container */}
        <View style={styles.animationContainer}>
          <LottieView 
            source={require('../../assets/lottie/payment-success.json')}
            autoPlay
            loop={false}
            style={{ width: 160, height: 160 }}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(600).easing(Easing.out(Easing.cubic))} style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>Order Confirmed</Text>
          <Text style={styles.subtitle}>Your groceries are being packed and will arrive in approx. 15 minutes.</Text>
          
          <Animated.View entering={FadeInDown.delay(500).duration(600).easing(Easing.out(Easing.cubic))} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>Order ID</Text>
                <Text style={styles.detailsValue}>{displayOrderId}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="flash-outline" size={20} color={Colors.successDark} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>Delivery Type</Text>
                <Text style={styles.detailsValue}>Priority Express</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(800).duration(800)} style={styles.footer}>
        <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace(`/delivery-tracking?orderId=${displayOrderId}`)}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={styles.trackBtnText}>Track Live Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  
  animationContainer: { position: 'relative', width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  glowRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.primaryLight, opacity: 0.5 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.glow },
  
  title: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22, paddingHorizontal: 20 },
  
  detailsCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 20, width: '100%', borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailIconBox: { width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailsLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 4 },
  detailsValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.borderLight, width: '100%', marginVertical: 16 },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  trackBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.full, marginBottom: 16, gap: 10, ...Shadows.md },
  trackBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  homeBtn: { backgroundColor: Colors.surfaceAlt, padding: 16, borderRadius: Radius.full, alignItems: 'center' },
  homeBtnText: { color: Colors.textPrimary, fontSize: 16, fontFamily: 'Inter_700Bold' }
});
