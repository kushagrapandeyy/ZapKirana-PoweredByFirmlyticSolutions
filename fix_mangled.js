const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the mangled boundary:
const boundaryRegex = /(<Text style=\{styles\.label\}>\{isManagerOrOwner \? 'New Stock Quantity' : 'Requested Stock Amount'\}<\/Text>\s+)({[^}]*Selected Supplier Card if not searching)/;

const fixedContent = `$1<TextInput style={styles.input} value={stockAmount} onChangeText={setStockAmount} keyboardType="numeric" placeholder="e.g. 100" />
              <TouchableOpacity style={[styles.submitBtn, !stockAmount.trim() && { opacity: 0.5 }]} onPress={handleStockAction} disabled={!stockAmount.trim()}>
                <Text style={styles.submitBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
$2`;

content = content.replace(boundaryRegex, fixedContent);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed completely mangled JSX');
