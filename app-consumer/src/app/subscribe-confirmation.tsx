import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat, withSequence, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../constants/theme';

export default function SubscribeConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.productId as string;
  const frequency = (params.frequency as string) || 'DAILY';

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

  const displaySubId = '#SUB-' + Math.floor(Math.random() * 1000000);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Creative Animation Container */}
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.glowRing, animatedRingStyle]} />
          <Animated.View entering={ZoomIn.duration(800).easing(Easing.out(Easing.back(1.5)))} style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(600).easing(Easing.out(Easing.cubic))} style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>Subscription Active</Text>
          <Text style={styles.subtitle}>You have successfully subscribed to auto-deliveries. You can manage this anytime.</Text>
          
          <Animated.View entering={FadeInDown.delay(500).duration(600).easing(Easing.out(Easing.cubic))} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>Subscription ID</Text>
                <Text style={styles.detailsValue}>{displaySubId}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="flash-outline" size={20} color={Colors.successDark} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>Frequency</Text>
                <Text style={styles.detailsValue}>{frequency}</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(800).duration(800)} style={styles.footer}>
        <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace('/subscriptions')}>
          <Ionicons name="repeat-outline" size={20} color="#fff" />
          <Text style={styles.trackBtnText}>Manage Subscriptions</Text>
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
