const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for edit modal
const stateRegex = /const \[stockAmount, setStockAmount\] = useState\(''\);/;
const stateReplacement = `const [stockAmount, setStockAmount] = useState('');
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    barcode: '',
    name: '',
    category: '',
    imageUrl: '',
    price: '',
    supplierLink: ''
  });
  
  const openEditModal = () => {
    setEditForm({
      barcode: product.barcode || product.id || '',
      name: product.name || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      price: product.price?.toString() || '',
      supplierLink: supplierProductInfo?.supplierId ? \`https://zapkirana.com/supplier/\${supplierProductInfo.supplierId}\` : ''
    });
    setIsEditModalVisible(true);
  };
  
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      Alert.alert('Success', 'Product updated successfully!');
      setIsEditModalVisible(false);
    }
  });
`;
content = content.replace(stateRegex, stateReplacement);

// 2. Add onPress to Edit button
content = content.replace(/<TouchableOpacity style=\{styles\.actionBtn\}>/, '<TouchableOpacity style={styles.actionBtn} onPress={openEditModal}>');

// 3. Add Modal UI
const modalRegex = /<\/SafeAreaView>/;
const editModalUI = `
      {/* Edit Product Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}></Text>
              <TouchableOpacity onPress={() => updateProductMutation.mutate(editForm)}>
                <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold' }}>Submit</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Barcode/ID</Text>
              <TextInput style={styles.input} value={editForm.barcode} onChangeText={(v) => setEditForm({...editForm, barcode: v})} />
              
              <Text style={styles.label}>Name</Text>
              <TextInput style={[styles.input, { borderColor: Colors.primary }]} value={editForm.name} onChangeText={(v) => setEditForm({...editForm, name: v})} />
              
              <Text style={styles.label}>Category</Text>
              <TextInput style={[styles.input, { borderColor: Colors.primary }]} value={editForm.category} onChangeText={(v) => setEditForm({...editForm, category: v})} />
              
              <Text style={styles.label}>Image</Text>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image source={{ uri: editForm.imageUrl || 'https://via.placeholder.com/40' }} style={{ width: 30, height: 30, borderRadius: 4 }} />
                  <Text style={{ fontFamily: 'Inter_400Regular', color: Colors.textSecondary, width: 200 }} numberOfLines={1}>{editForm.imageUrl || 'No image selected'}</Text>
                </View>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </View>

              <Text style={styles.label}>Current Stock</Text>
              <TextInput style={styles.input} value={productWrapper?.quantity?.toString() || '0'} editable={false} />
              
              <Text style={styles.label}>Price</Text>
              <TextInput style={styles.input} value={editForm.price} onChangeText={(v) => setEditForm({...editForm, price: v})} keyboardType="numeric" />
              
              <Text style={styles.label}>Supplier Link</Text>
              <TextInput style={styles.input} value={editForm.supplierLink} onChangeText={(v) => setEditForm({...editForm, supplierLink: v})} keyboardType="url" autoCapitalize="none" />
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
</SafeAreaView>
`;
content = content.replace(modalRegex, editModalUI);

fs.writeFileSync(path, content, 'utf8');
console.log('Added Edit Modal matching Screenshot 3');
