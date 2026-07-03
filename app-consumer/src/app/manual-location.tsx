import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radius } from '../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ManualLocationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectLocation = () => {
    // Mappls integration placeholder
    // Mappls AutoSuggest API will provide suggestions as the user types.
    // When a suggestion is tapped, save the selected location coordinates.
    router.push('/store-selector');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter your area or apartment</Text>
        </View>

        <View style={styles.content}>
          {/* Search Input */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search address, society, or sector..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Current Location Option */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity style={styles.currentLocationRow} onPress={() => router.push('/store-selector')}>
              <Ionicons name="locate" size={20} color={Colors.primary} />
              <Text style={styles.currentLocationText}>Use current location</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Placeholder for Mappls AutoSuggest Results */}
          <ScrollView style={styles.resultsContainer} keyboardShouldPersistTaps="handled">
            {searchQuery.length > 2 && (
              <TouchableOpacity style={styles.resultItem} onPress={handleSelectLocation}>
                <Ionicons name="location-outline" size={20} color={Colors.textSecondary} style={styles.resultIcon} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultTitle}>{searchQuery} (Mock Result)</Text>
                  <Text style={styles.resultSubtitle}>Sector 137, Noida, Uttar Pradesh</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    marginHorizontal: 20,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currentLocationText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
    marginLeft: 12,
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultIcon: {
    marginRight: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
});
