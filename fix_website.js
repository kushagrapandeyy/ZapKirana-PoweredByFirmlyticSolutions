const fs = require('fs');
const path1 = 'app-vendor/src/app/operations/supplier/[id].tsx';
const path2 = 'app-vendor/src/app/operations/suppliers.tsx';

function injectWebsite(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Add state
  content = content.replace(/const \[contactEmail, setContactEmail\] = useState\(''\);/, "const [contactEmail, setContactEmail] = useState('');\n  const [website, setWebsite] = useState('');");
  
  // Add to useEffect
  if (content.includes('setContactEmail(supplier.contactEmail || \'\');')) {
    content = content.replace(/setContactEmail\(supplier\.contactEmail \|\| ''\);/, "setContactEmail(supplier.contactEmail || '');\n      setWebsite(supplier.website || supplier.description || '');");
  }
  
  // Add to mutate
  content = content.replace(/\{ name, contactPerson, contactPhone, contactEmail, address \}/g, "{ name, contactPerson, contactPhone, contactEmail, address, description: website }");
  
  // Add to UI Form
  const websiteInput = `
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput style={styles.input} value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" placeholder="e.g. https://zapkirana.com" />
              </View>
`;
  content = content.replace(/<Text style=\{styles\.label\}>Email<\/Text>[\s\S]*?<\/View>/, '$&' + websiteInput);

  fs.writeFileSync(path, content, 'utf8');
}

injectWebsite(path1);
injectWebsite(path2);

// Fix the button in [id].tsx to use the website
let content1 = fs.readFileSync(path1, 'utf8');
content1 = content1.replace(/'https:\/\/example\.com'/, 'supplier.description || supplier.website || "https://google.com"');
fs.writeFileSync(path1, content1, 'utf8');

console.log('Added website UI correctly');
