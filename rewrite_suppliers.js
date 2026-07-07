const fs = require('fs');
const path = 'app-vendor/src/app/operations/suppliers.tsx';

const content = `import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, SafeAreaView, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/api';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Shadows, Radius } from '../../constants/theme';

const DUMMY_AVATARS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function SuppliersScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers\`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.contactPhone && s.contactPhone.includes(searchQuery))
  );

  const getInitials = (name: string) => {
    return name.substring(0, 3).toUpperCase();
  };

  const renderSupplier = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(15)}>
      <TouchableOpacity 
        style={styles.supplierCard}
        onPress={() => router.push(\`/operations/supplier/\${item.id}\`)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: DUMMY_AVATARS[index % DUMMY_AVATARS.length] }]}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.phoneText}>{item.contactPhone || '+91 9876543210'}</Text>
          <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.personText} numberOfLines={1}>{item.contactPerson || 'Rahul Kumar'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList 
        data={filteredSuppliers}
        keyExtractor={item => item.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 15,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: Radius.lg,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 16,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  phoneText: {
    color: Colors.primary, // Using primary blue for the phone
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  personText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
`;

fs.writeFileSync(path, content, 'utf8');
console.log('Rewrote suppliers.tsx to Light Mode');
