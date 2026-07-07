const fs = require('fs');
const path = 'app-vendor/src/app/operations/supplier/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// Add handleSafeLink
const safeLinkFn = `
  const handleSafeLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Action Unavailable', \`Your device cannot open this link: \${url}\`);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong opening the link.');
    }
  };
`;

content = content.replace('const handleOpenPDF', safeLinkFn + '\n  const handleOpenPDF');

// Replace onPress in Action Buttons
content = content.replace(
  /onPress=\{\(\) => Linking\.openURL\(\`tel:\$\{supplier\.contactPhone\}\`\)\}/,
  "onPress={() => handleSafeLink(`tel:${supplier.contactPhone?.replace(/\\s/g, '')}`)}"
);
content = content.replace(
  /onPress=\{\(\) => Linking\.openURL\(\`mailto:\$\{supplier\.contactEmail\}\`\)\}/,
  "onPress={() => handleSafeLink(`mailto:${supplier.contactEmail}`)}"
);

// Add Website action button
const websiteBtn = `
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSafeLink('https://example.com')}>
            <Ionicons name="globe-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
`;

// Insert the website button after the email button
content = content.replace(
  /<Text style=\{styles\.actionText\}>Email<\/Text>\n\s*<\/TouchableOpacity>/,
  '<Text style={styles.actionText}>Email</Text>\n          </TouchableOpacity>' + websiteBtn
);


fs.writeFileSync(path, content, 'utf8');
console.log('Fixed linking and added website button.');
