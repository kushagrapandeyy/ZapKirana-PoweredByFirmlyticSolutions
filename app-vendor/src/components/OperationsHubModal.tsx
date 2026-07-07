import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface OperationsHubModalProps {
  visible: boolean;
  onClose: () => void;
}

const WHITE = '#ffffff';

const HUB_ITEMS = [
  { title: 'Inventory', icon: 'cube-outline', route: '/operations/inventory', color: '#0284c7', bg: '#e0f2fe', desc: 'Stock & pricing' },
  { title: 'Approvals', icon: 'checkmark-done-circle-outline', route: '/operations/approvals', color: '#059669', bg: '#d1fae5', desc: 'Pending reviews', badge: 2 },
  { title: 'POs & GRNs', icon: 'document-text-outline', route: '/operations/po', color: '#4f46e5', bg: '#e0e7ff', desc: 'Procurement' },
  { title: 'Suppliers', icon: 'business-outline', route: '/operations/suppliers', color: '#0369a1', bg: '#e0f2fe', desc: 'Manage vendors' },
  { title: 'Fleet', icon: 'hardware-chip-outline', route: '/operations/devices', color: '#ea580c', bg: '#ffedd5', desc: 'Devices & Riders' },
  { title: 'Team', icon: 'people-outline', route: '/(tabs)/team', color: '#059669', bg: '#d1fae5', desc: 'Staff roles' },
  { title: 'Campaigns', icon: 'megaphone-outline', route: '/(tabs)/campaigns', color: '#d97706', bg: '#fef3c7', desc: 'Promotions & Offers' },
  { title: 'Subscriptions', icon: 'calendar-outline', route: '/(tabs)/subscriptions', color: '#c026d3', bg: '#fae8ff', desc: 'Recurring orders', badge: 3 },
];

export default function OperationsHubModal({ visible, onClose }: OperationsHubModalProps) {
  const router = useRouter();

  const handleNavigate = (path: any) => {
    onClose();
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Operations Hub</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                  {HUB_ITEMS.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={styles.card} 
                      onPress={() => handleNavigate(item.route)}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                        <Ionicons name={item.icon as any} size={28} color={item.color} />
                        {item.badge ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDesc}>{item.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    // Removed black overlay background completely
  },
  modalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: WHITE,
  },
  badgeText: {
    color: WHITE,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
