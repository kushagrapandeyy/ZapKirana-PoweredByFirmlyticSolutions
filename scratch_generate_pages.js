const fs = require('fs');
const path = require('path');

const pages = {
  'DashboardPage.tsx': `import React from 'react';\n\nexport default function DashboardPage({ stats }: { stats: any }) {\n  return <div>Dashboard Page</div>;\n}`,
  'StoresPage.tsx': `import React from 'react';\n\nexport default function StoresPage({ stores }: { stores: any[] }) {\n  return <div>Stores Page</div>;\n}`,
  'VendorsPage.tsx': `import React from 'react';\n\nexport default function VendorsPage({ vendors }: { vendors: any[] }) {\n  return <div>Vendors Page</div>;\n}`,
  'SuppliersPage.tsx': `import React from 'react';\n\nexport default function SuppliersPage({ suppliers }: { suppliers: any[] }) {\n  return <div>Suppliers Page</div>;\n}`,
  'AccessControlPage.tsx': `import React from 'react';\n\nexport default function AccessControlPage() {\n  return <div>Access Control Page</div>;\n}`,
  'AuditLogsPage.tsx': `import React from 'react';\n\nexport default function AuditLogsPage({ audits }: { audits: any[] }) {\n  return <div>Audit Logs Page</div>;\n}`,
  'GstManagerPage.tsx': `import React from 'react';\n\nexport default function GstManagerPage() {\n  return <div>GST Manager Page</div>;\n}`,
  'MasterOrdersPage.tsx': `import React from 'react';\n\nexport default function MasterOrdersPage() {\n  return <div>Master Orders Page</div>;\n}`,
  'NetworkAnalyticsPage.tsx': `import React from 'react';\n\nexport default function NetworkAnalyticsPage({ analytics }: { analytics: any }) {\n  return <div>Network Analytics Page</div>;\n}`,
};

const components = {
  'Sidebar.tsx': `import React from 'react';\nimport { Link, useLocation } from 'react-router-dom';\nimport { useAuth } from '../AuthContext';\nimport { Store, Users, ShieldCheck, Building, LayoutDashboard, AlertTriangle, ShieldAlert, TrendingUp, Calculator, Receipt, Smartphone } from 'lucide-react';\n\nexport default function Sidebar() {\n  const { user, logout } = useAuth();\n  const location = useLocation();\n  const active = location.pathname;\n\n  const isSuper = user?.role === 'ORG_ADMIN';\n\n  return (\n    <aside className="sidebar futuristic-sidebar">\n      <div className="sidebar-header">\n        <h1 className="sidebar-title"><Building size={28} /> Zapkirana</h1>\n      </div>\n      <nav className="nav-links">\n        <Link to="/" className={\`nav-item \${active === '/' ? 'active' : ''}\`}><LayoutDashboard size={20} /> Overview</Link>\n        <Link to="/stores" className={\`nav-item \${active === '/stores' ? 'active' : ''}\`}><Store size={20} /> Stores Directory</Link>\n        <Link to="/vendors" className={\`nav-item \${active === '/vendors' ? 'active' : ''}\`}><Users size={20} /> Vendor Management</Link>\n        <Link to="/suppliers" className={\`nav-item \${active === '/suppliers' ? 'active' : ''}\`}><Building size={20} /> Supplier Portal</Link>\n        <Link to="/orders" className={\`nav-item \${active === '/orders' ? 'active' : ''}\`}><Receipt size={20} /> Master Orders</Link>\n        <Link to="/analytics" className={\`nav-item \${active === '/analytics' ? 'active' : ''}\`}><TrendingUp size={20} /> Network Analytics</Link>\n        <Link to="/support" className={\`nav-item \${active === '/support' ? 'active' : ''}\`}><AlertTriangle size={20} /> Support</Link>\n        {isSuper && (\n          <>\n            <div className="nav-divider">Admin</div>\n            <Link to="/access-control" className={\`nav-item \${active === '/access-control' ? 'active' : ''}\`}><ShieldAlert size={20} /> Access Control</Link>\n            <Link to="/audit" className={\`nav-item \${active === '/audit' ? 'active' : ''}\`}><ShieldCheck size={20} /> Audit Trail</Link>\n            <Link to="/gst" className={\`nav-item \${active === '/gst' ? 'active' : ''}\`}><Calculator size={20} /> GST Manager</Link>\n          </>\n        )}\n      </nav>\n    </aside>\n  );\n}`,
  'Topbar.tsx': `import React from 'react';\nimport { useAuth } from '../AuthContext';\nimport { LogOut, Search, Bell } from 'lucide-react';\n\nexport default function Topbar() {\n  const { user, logout } = useAuth();\n  return (\n    <div className="topbar glass-panel">\n      <div className="search-bar">\n        <Search size={18} color="var(--text-muted)" />\n        <input placeholder="Press Cmd+K to search..." />\n      </div>\n      <div className="topbar-actions">\n        <button className="icon-btn"><Bell size={20} /></button>\n        <div className="user-profile">\n          <div className="avatar">{user?.name?.charAt(0)}</div>\n          <div className="user-info">\n            <span className="user-name">{user?.name}</span>\n            <span className="user-role badge badge-primary">{user?.role}</span>\n          </div>\n          <button className="icon-btn text-danger" onClick={logout}><LogOut size={18} /></button>\n        </div>\n      </div>\n    </div>\n  );\n}`,
  'ProtectedRoute.tsx': `import React from 'react';\nimport { Navigate } from 'react-router-dom';\nimport { useAuth } from '../AuthContext';\n\nexport default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {\n  const { user } = useAuth();\n  \n  if (!user) return <Navigate to="/login" replace />;\n  \n  if (allowedRoles && !allowedRoles.includes(user.role)) {\n    return <Navigate to="/" replace />;\n  }\n  \n  return <>{children}</>;\n}`
};

const pagesDir = path.resolve(__dirname, 'web-admin/src/pages');
const compDir = path.resolve(__dirname, 'web-admin/src/components');

fs.mkdirSync(pagesDir, { recursive: true });
fs.mkdirSync(compDir, { recursive: true });

Object.entries(pages).forEach(([name, content]) => {
  fs.writeFileSync(path.join(pagesDir, name), content, 'utf8');
});
Object.entries(components).forEach(([name, content]) => {
  fs.writeFileSync(path.join(compDir, name), content, 'utf8');
});
console.log('Pages and Components created.');
