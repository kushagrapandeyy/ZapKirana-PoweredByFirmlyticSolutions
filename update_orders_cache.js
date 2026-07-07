const fs = require('fs');
const path = 'app-vendor/src/app/(tabs)/orders.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      .on('broadcast', { event: 'order_update' }, (payload) => {
        console.log('Realtime order update received:', payload);
        queryClient.invalidateQueries({ queryKey: ['orders', CURRENT_STORE_ID] });
      })`;

const replacement = `      .on('broadcast', { event: 'order_update' }, ({ payload }) => {
        console.log('Realtime order update received:', payload);
        
        queryClient.setQueryData(['orders', CURRENT_STORE_ID], (old: any[]) => {
          if (!old) return [payload];
          const exists = old.find((o) => o.id === payload.id);
          if (exists) {
            return old.map((o) => (o.id === payload.id ? payload : o));
          } else {
            // New order
            return [payload, ...old].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        });
      })`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Done updating orders cache');
