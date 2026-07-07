const fs = require('fs');
const path = 'backend/src/subscriptions/subscriptions.cron.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("paymentMode: 'CASH', // Defaulting to Cash/Wallet", "");
content = content.replace("type: 'DELIVERY',", "");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed cron schema error');
