const fs = require('fs');
const path = 'app-vendor/src/app/create-po.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
      if (res.ok) {
        const poData = await res.json();
        
        // Auto-trigger invoice generation (fire and forget or wait if we want to ensure it's generated)
        try {
          // The backend /purchase-orders/:id/pdf generates and uploads the invoice
          await fetch(\`\${API_BASE_URL}/purchase-orders/\${poData.id || poData.poId || poData.PO?.id}/pdf\`);
        } catch (err) {
          console.warn('Invoice generation delayed', err);
        }

        Toast.show({ type: 'success', text1: 'PO Created & Invoiced', text2: 'Purchase order generated successfully' });
        router.back();
      } else {
`;

content = content.replace(/if \(res\.ok\) \{\s*Toast\.show\(\{ type: 'success', text1: 'PO Created', text2: 'Purchase order generated successfully' \}\);\s*router\.back\(\);\s*\} else \{/g, replacement.trim() + " {");

fs.writeFileSync(path, content, 'utf8');
console.log('Updated PO creation flow');
