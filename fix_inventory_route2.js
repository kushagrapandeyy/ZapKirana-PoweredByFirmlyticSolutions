const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory/index.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { useRouter } from \'expo-router\'')) {
  content = content.replace("import { Ionicons } from '@expo/vector-icons';", "import { Ionicons } from '@expo/vector-icons';\nimport { useRouter } from 'expo-router';");
}

if (!content.includes('const router = useRouter();')) {
  content = content.replace("export default function InventoryScreen() {", "export default function InventoryScreen() {\n  const router = useRouter();");
}

// Replace the onPress
content = content.replace(/onPress=\{() => openProductDetails\(item\)\}/g, "onPress={() => router.push(`/operations/inventory/${item.productId || item.id}`)}");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed routing properly this time');
