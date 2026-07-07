const fs = require('fs');
const path = 'app-vendor/src/app/operations/supplier/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove .slice(0, 10) from the maps
content = content.replace(/DUMMY_TRANSACTIONS\.slice\(0, 10\)\.map/g, 'DUMMY_TRANSACTIONS.map');
content = content.replace(/purchaseOrders\.slice\(0, 10\)\.map/g, 'purchaseOrders.map');
content = content.replace(/supplierProducts\.slice\(0, 10\)\.map/g, 'supplierProducts.map');

// Change maxHeight to 400 to approximate 10 rows
content = content.replace(/maxHeight: 300/g, 'maxHeight: 400');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed scroll logic');
