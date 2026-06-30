import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Animated, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const ROYAL_BLUE = '#1D4ED8';
const WHITE = '#FFFFFF';

const SLIDES = [
  {
    id: '1',
    title: 'Fresh Groceries\nat your door',
    description: 'Get the freshest produce, dairy, and household essentials delivered straight to your home.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  },
  {
    id: '2',
    title: 'Fast & Reliable\nDelivery',
    description: 'Our delivery partners ensure your order reaches you in under 30 minutes safely.',
    image: 'https://images.unsplash.com/photo-1626081442436-6133ff0217dc?w=800&q=80',
  },
  {
    id: '3',
    title: 'Exclusive Deals\n& Offers',
    description: 'Enjoy daily discounts, combo offers, and loyalty rewards on your everyday purchases.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

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
        router.replace('/(tabs)');
      } catch (err) {
        console.error('Failed to save onboarding state', err);
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.slide}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginator}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i.toString()} />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 3 }}>
        <FlatList
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <Paginator />
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  slide: {
    width,
    alignItems: 'center',
  },
  image: {
    width,
    height: height * 0.55,
    resizeMode: 'cover',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    width: '100%',
  },
  title: {
    fontSize: 32,
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginator: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: ROYAL_BLUE,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: ROYAL_BLUE,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
