const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the wrongly placed modal
const wrongModalRegex = /\{\/\* Edit Product Modal \*\/\}[\s\S]*?<\/Modal>/;
content = content.replace(wrongModalRegex, '');

// 2. Insert suppliers query
const queryInsertPoint = "const supplierId = supplierProductInfo?.supplierId;";
const suppliersQuery = `
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/admin/suppliers\`);
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    }
  });
`;
content = content.replace(queryInsertPoint, queryInsertPoint + '\n' + suppliersQuery);

// 3. Fix updateProductMutation to actually hit the new PATCH endpoint
const mutationRegex = /const updateProductMutation = useMutation\(\{[\s\S]*?\}\);/;
const realMutation = `const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(\`\${API_BASE_URL}/inventory/products/\${product.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: CURRENT_STORE_ID,
          name: data.name,
          category: data.category,
          price: parseFloat(data.price),
          imageUrl: data.imageUrl,
          supplierId: data.supplierId
        })
      });
      if (!res.ok) throw new Error('Failed to update product');
      
      // If stock changed, adjust it
      const currentQty = productWrapper?.quantity || 0;
      const newQty = parseInt(data.stock);
      if (!isNaN(newQty) && newQty !== currentQty) {
         await fetch(\`\${API_BASE_URL}/inventory/adjust\`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             storeId: CURRENT_STORE_ID,
             productId: product.id,
             quantityChange: newQty - currentQty,
             reason: 'Manual Edit from Product Page',
             staffId: 'system'
           })
         });
      }
      return res.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory', CURRENT_STORE_ID] });
      setIsEditModalVisible(false);
    }
  });`;
content = content.replace(mutationRegex, realMutation);

// 4. Update the openEditModal to include stock and actual supplierId
const openEditRegex = /const openEditModal = \(\) => \{[\s\S]*?\};/;
const realOpenEdit = `const openEditModal = () => {
    setEditForm({
      barcode: product.barcode || product.id || '',
      name: product.name || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      price: product.price?.toString() || '',
      supplierLink: '', // Not used anymore
      supplierId: supplierProductInfo?.supplierId || '',
      stock: (productWrapper?.quantity || 0).toString()
    });
    setIsEditModalVisible(true);
  };`;
content = content.replace(openEditRegex, realOpenEdit);

// 5. Append the beautiful native modal at the end of the component
const modalUI = `
      {/* Light Theme Native PageSheet Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#FAF9F6' }}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 20 : 20, paddingBottom: 15 }]}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1E293B' }}>Edit Product</Text>
            <TouchableOpacity onPress={() => updateProductMutation.mutate(editForm)}>
              <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Submit</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            
            <Text style={[styles.label, { color: '#64748B' }]}>Barcode/ID</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#1E293B' }]} value={editForm.barcode} editable={false} />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Name</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.name} onChangeText={(v) => setEditForm({...editForm, name: v})} />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Category</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.category} onChangeText={(v) => setEditForm({...editForm, category: v})} />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Image URL</Text>
            <View style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Image source={{ uri: editForm.imageUrl || 'https://via.placeholder.com/40' }} style={{ width: 30, height: 30, borderRadius: 4 }} />
                <TextInput style={{ flex: 1, fontFamily: 'Inter_400Regular', color: '#1E293B' }} value={editForm.imageUrl} onChangeText={(v) => setEditForm({...editForm, imageUrl: v})} placeholder="https://..." />
              </View>
            </View>

            <Text style={[styles.label, { color: '#64748B' }]}>Current Stock</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.stock} onChangeText={(v) => setEditForm({...editForm, stock: v})} keyboardType="numeric" />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Retail Price (₹)</Text>
            <TextInput style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: Colors.primary, borderWidth: 1, color: '#1E293B' }]} value={editForm.price} onChangeText={(v) => setEditForm({...editForm, price: v})} keyboardType="numeric" />
            
            <Text style={[styles.label, { color: '#64748B' }]}>Supplier</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
               {(suppliers || []).map((s: any) => (
                 <TouchableOpacity 
                   key={s.id} 
                   onPress={() => setEditForm({...editForm, supplierId: s.id})}
                   style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: editForm.supplierId === s.id ? Colors.primary : '#E2E8F0', marginRight: 10 }}
                 >
                   <Text style={{ fontFamily: 'Inter_600SemiBold', color: editForm.supplierId === s.id ? '#FFF' : '#475569' }}>{s.businessName || s.name}</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
`;
content = content.replace(/<\/SafeAreaView>\s*?\);\s*?\}/, modalUI);

// Fix initial state missing stock and supplierId
content = content.replace("supplierLink: ''", "supplierLink: '', supplierId: '', stock: ''");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Modal');
