const fs = require('fs');
const path = 'app-vendor/src/app/operations/inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace onPress in renderItem
content = content.replace(/onPress=\{() => openProduct\(item\)\}/g, "onPress={() => router.push(`/operations/inventory/${item.productId || item.id}`)}");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed routing in inventory.tsx');
