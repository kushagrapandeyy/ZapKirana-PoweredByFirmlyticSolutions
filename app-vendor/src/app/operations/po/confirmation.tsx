import { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Colors, Shadows, Radius } from '../../../constants/theme';

export default function POConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const poId = params.poId as string || 'PO-XXXX';
  const displayId = poId.split('-')[0].toUpperCase();
  const totalValue = params.totalValue as string || '0.00';
  const supplierName = params.supplierName as string || 'Supplier';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.animationContainer}>
          <LottieView 
            source={require('../../../../assets/lottie/payment-success.json')}
            autoPlay
            loop={false}
            style={{ width: 180, height: 180 }}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(600).easing(Easing.out(Easing.cubic))} style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>Purchase Order Drafted!</Text>
          <Text style={styles.subtitle}>Your PO has been successfully created and saved to the ledger.</Text>
          
          <Animated.View entering={FadeInDown.delay(500).duration(600).easing(Easing.out(Easing.cubic))} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>PO Number</Text>
                <Text style={styles.detailsValue}>#{displayId}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: Colors.infoLight }]}>
                <Ionicons name="business" size={20} color={Colors.infoDark} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>Supplier</Text>
                <Text style={styles.detailsValue}>{supplierName}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="cash-outline" size={20} color={Colors.successDark} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailsLabel}>Total Value</Text>
                <Text style={styles.detailsValue}>₹{totalValue}</Text>
              </View>
            </View>

          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(800).duration(800)} style={styles.footer}>
        <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace(`/operations/po/${poId}`)}>
          <Ionicons name="eye-outline" size={20} color="#fff" />
          <Text style={styles.trackBtnText}>View Order Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/operations/po')}>
          <Text style={styles.homeBtnText}>Back to PO List</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: '15%' },
  animationContainer: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, marginBottom: 32 },
  detailsCard: { width: '100%', backgroundColor: '#fff', borderRadius: Radius.xl, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  detailInfo: { flex: 1 },
  detailsLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  detailsValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.lg, ...Shadows.sm, marginBottom: 16 },
  trackBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16, marginLeft: 8 },
  homeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.sm },
  homeBtnText: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 16 }
});
