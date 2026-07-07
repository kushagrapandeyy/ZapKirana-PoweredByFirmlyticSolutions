const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// Add the state
const stateRegex = /const \[supplierSearch, setSupplierSearch\] = useState\(''\);/;
content = content.replace(stateRegex, "const [supplierSearch, setSupplierSearch] = useState('');\n  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);");

// Build replacement for lines 347 to 410
const oldListRegex = /<TextInput[\s\S]*?placeholder="Search suppliers..."[\s\S]*?<\/ScrollView>/;

const newList = `
            {/* Selected Supplier Card if not searching */}
            {!isSupplierDropdownOpen && editForm.supplierId && (
              <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: Colors.primary, marginBottom: 12 }}>
                {(() => {
                  const s = suppliers?.find((sup: any) => sup.id === editForm.supplierId);
                  if (!s) return <Text>Selected Supplier</Text>;
                  return (
                    <>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: Colors.primary, fontSize: 15, marginBottom: 4 }}>
                        {s.businessName || s.name}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                        {s.city && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="location-outline" size={12} color="#64748B" /><Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.city}</Text></View>}
                        {s.contactPerson && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="person-outline" size={12} color="#64748B" /><Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>{s.contactPerson}</Text></View>}
                        {s.gstin && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="document-text-outline" size={12} color="#64748B" /><Text style={{ fontFamily: 'Inter_400Regular', color: '#64748B', fontSize: 12 }}>GST: {s.gstin}</Text></View>}
                      </View>
                      <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setIsSupplierDropdownOpen(true)}>
                        <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Change Supplier</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            )}

            {/* Search Input */}
            {(!editForm.supplierId || isSupplierDropdownOpen) && (
              <TextInput 
                style={[styles.input, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#1E293B', marginBottom: 12 }]} 
                placeholder="Search suppliers to tag..." 
                value={supplierSearch}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                onChangeText={(v) => { setSupplierSearch(v); setIsSupplierDropdownOpen(true); }}
              />
            )}

            {/* Active Dropdown List */}
            {isSupplierDropdownOpen && (
              <View style={{ marginBottom: 20, maxHeight: 300 }}>
                 {((suppliers || []).filter((s: any) => {
                   const query = supplierSearch.toLowerCase();
                   return (s.businessName || '').toLowerCase().includes(query) || 
                          (s.name || '').toLowerCase().includes(query) ||
                          (s.city || '').toLowerCase().includes(query) ||
                          (s.gstin || '').toLowerCase().includes(query);
                 }).slice(0, 10)).map((s: any) => {
                   const isSelected = editForm.supplierId === s.id;
                   return (
                     <TouchableOpacity 
                       key={s.id} 
                       onPress={() => {
                         setEditForm({...editForm, supplierId: s.id});
                         setIsSupplierDropdownOpen(false);
                         setSupplierSearch(''); // Clear search after selection
                       }}
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
            )}
`;
content = content.replace(oldListRegex, newList);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Dropdown behavior');
