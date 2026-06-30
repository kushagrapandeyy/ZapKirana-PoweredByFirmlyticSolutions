import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, Dimensions, Animated as RNAnimated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay,
  interpolate, Extrapolation, FadeIn, FadeInDown, SlideInRight,
} from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'leaf-outline' as const,
    iconBg: Colors.successLight,
    iconColor: Colors.success,
    title: 'Fresh from\nyour neighbourhood',
    description: 'Get the freshest produce, dairy, and essentials delivered from your local grocery store within 3 km.',
    accent: Colors.success,
  },
  {
    id: '2',
    icon: 'flash-outline' as const,
    iconBg: Colors.accentLight,
    iconColor: Colors.accent,
    title: 'Lightning-fast\ndelivery',
    description: 'Our delivery partners ensure your order reaches you in under 30 minutes — guaranteed fresh.',
    accent: Colors.accent,
  },
  {
    id: '3',
    icon: 'calendar-outline' as const,
    iconBg: Colors.primaryGhost,
    iconColor: Colors.primary,
    title: 'Subscribe &\nnever run out',
    description: 'Set daily milk, bread or monthly essentials on auto-pilot. Pause or cancel anytime.',
    accent: Colors.primary,
  },
  {
    id: '4',
    icon: 'location-outline' as const,
    iconBg: '#fef2f2',
    iconColor: Colors.danger,
    title: 'Find your\nlocal store',
    description: 'We\'ll use your location to find the nearest stores that deliver to your door.',
    accent: Colors.danger,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 800 });
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await AsyncStorage.setItem('@has_onboarded', 'true');
        router.replace('/store-selector');
      } catch (err) {
        console.error('Failed to save onboarding state', err);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('@has_onboarded', 'true');
      router.replace('/store-selector');
    } catch (err) {
      console.error('Failed to save onboarding state', err);
    }
  };

  const heroAnim = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [30, 0]) }],
  }));

  const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Large Icon Circle */}
        <View style={styles.iconSection}>
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.iconCircle, { backgroundColor: item.iconBg }]}
          >
            <Ionicons name={item.icon} size={64} color={item.iconColor} />
          </Animated.View>
          
          {/* Decorative floating dots */}
          <View style={[styles.floatingDot, styles.dot1, { backgroundColor: item.accent + '30' }]} />
          <View style={[styles.floatingDot, styles.dot2, { backgroundColor: item.accent + '20' }]} />
          <View style={[styles.floatingDot, styles.dot3, { backgroundColor: item.accent + '15' }]} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        style={{ flex: 1 }}
      />

      {/* Footer */}
      <Animated.View style={[styles.footer, heroAnim]}>
        {/* Paginator */}
        <View style={styles.paginator}>
          {SLIDES.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: isActive ? 28 : 8,
                    backgroundColor: isActive ? SLIDES[currentIndex].accent : Colors.border,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Next/Get Started button */}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: SLIDES[currentIndex].accent },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          {isLastSlide ? (
            <>
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.nextBtnText}>Find My Store</Text>
            </>
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  slide: {
    width,
    flex: 1,
    paddingTop: 100,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.35,
    position: 'relative',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  floatingDot: {
    position: 'absolute',
    borderRadius: 100,
  },
  dot1: { width: 60, height: 60, top: '15%', left: '15%' },
  dot2: { width: 40, height: 40, top: '25%', right: '18%' },
  dot3: { width: 80, height: 80, bottom: '10%', right: '25%' },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  title: {
    fontSize: 36,
    color: Colors.textPrimary,
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    lineHeight: 44,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingBottom: 50,
    paddingTop: 20,
  },
  paginator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: Radius.full,
    gap: 8,
    ...Shadows.glow,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
