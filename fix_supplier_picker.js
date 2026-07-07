const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for supplierSearch
const stateRegex = /const \[isEditModalVisible, setIsEditModalVisible\] = useState\(false\);/;
content = content.replace(stateRegex, "const [isEditModalVisible, setIsEditModalVisible] = useState(false);\n  const [supplierSearch, setSupplierSearch] = useState('');");

// 2. Replace the horizontal ScrollView with searchable list
const listRegex = /<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{ marginBottom: 20 \}\}>[\s\S]*?<\/ScrollView>/;
const verticalList = `
            <TextInput 
              style={[styles.input, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#1E293B', marginBottom: 12 }]} 
              placeholder="Search suppliers..." 
              value={supplierSearch}
              onChangeText={setSupplierSearch}
            />
            <View style={{ marginBottom: 20, maxHeight: 300 }}>
               {((suppliers || []).filter((s: any) => {
                 const query = supplierSearch.toLowerCase();
                 return (s.businessName || '').toLowerCase().includes(query) || 
                        (s.name || '').toLowerCase().includes(query) ||
                        (s.city || '').toLowerCase().includes(query) ||
                        (s.gstin || '').toLowerCase().includes(query);
               })).map((s: any) => {
                 const isSelected = editForm.supplierId === s.id;
                 return (
                   <TouchableOpacity 
                     key={s.id} 
                     onPress={() => setEditForm({...editForm, supplierId: s.id})}
                     style={{ 
                       padding: 16, 
                       borderRadius: 12, 
                       backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF', 
                       borderWidth: 1,
                       borderColor: isSelected ? Colors.primary : '#E2E8F0',
                       marginBottom: 10 
                     }}
                   >
                     <Text style={{ fontFamily: 'Inter_600SemiBold', color: isSelected ? Colors.primary : '#1E293B', fontSize: 15, marginBottom: 4 }}>
                       {s.businessName || s.name}
                     </Text>
                     
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                       {s.city && (
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                           <Ionicons name="location-outline" size={12} color="#64748B" />
                           <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.city}</Text>
                         </View>
                       )}
                       {s.contactPerson && (
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                           <Ionicons name="person-outline" size={12} color="#64748B" />
                           <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.contactPerson}</Text>
                         </View>
                       )}
                       {s.phone && (
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                           <Ionicons name="call-outline" size={12} color="#64748B" />
                           <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.phone}</Text>
                         </View>
                       )}
                       {s.gstin && (
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                           <Ionicons name="document-text-outline" size={12} color="#64748B" />
                           <Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>GST: {s.gstin}</Text>
                         </View>
                       )}
                     </View>
                   </TouchableOpacity>
                 );
               })}
            </View>
`;
content = content.replace(listRegex, verticalList);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Supplier Picker');
