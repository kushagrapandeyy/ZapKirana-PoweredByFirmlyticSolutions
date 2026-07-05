const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, 'web-admin/src/index.css');
let content = fs.readFileSync(file, 'utf8');

const newCSS = `

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.data-grid-container {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.data-grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-grid th, .data-grid td {
  padding: 16px 24px;
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.data-grid th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}

.data-grid tr:hover td {
  background-color: rgba(99, 102, 241, 0.03);
}

body.dark-mode .data-grid th, body.dark-mode .data-grid td {
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

body.dark-mode .data-grid tr:hover td {
  background-color: rgba(255, 255, 255, 0.02);
}
`;

fs.writeFileSync(file, content + newCSS);
console.log('CSS patched');
