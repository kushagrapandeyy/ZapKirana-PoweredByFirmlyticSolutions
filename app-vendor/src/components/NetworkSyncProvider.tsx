import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueueService } from '../services/OfflineQueueService';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function NetworkSyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        // Trigger sync when back online
        syncOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  const syncOfflineQueue = async () => {
    setIsSyncing(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      await OfflineQueueService.flush();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setIsSyncing(false));
      }, 2000); // keep "Sync Complete" visible briefly
    }
  };

  return (
    <>
      {children}
      {isSyncing && (
        <Animated.View style={[styles.syncBanner, { opacity: fadeAnim }]}>
          <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.syncText}>Syncing Offline Changes...</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  syncBanner: {
    position: 'absolute',
    bottom: 100, // above tab bar
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  syncText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  }
});
