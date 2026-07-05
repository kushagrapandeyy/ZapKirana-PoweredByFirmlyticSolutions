import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Store, Users, ShieldCheck, Building, LayoutDashboard, AlertTriangle, ShieldAlert, TrendingUp, Calculator, Receipt, } from 'lucide-react';

export default function Sidebar() {
  const { user, } = useAuth();
  const location = useLocation();
  const active = location.pathname;

  const isSuper = user?.role === 'ORG_ADMIN';

  return (
    <aside className="sidebar futuristic-sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title"><Building size={28} /> Zapkirana</h1>
      </div>
      <nav className="nav-links">
        <Link to="/" className={`nav-item ${active === '/' ? 'active' : ''}`}><LayoutDashboard size={20} /> Overview</Link>
        <Link to="/stores" className={`nav-item ${active === '/stores' ? 'active' : ''}`}><Store size={20} /> Stores Directory</Link>
        <Link to="/vendors" className={`nav-item ${active === '/vendors' ? 'active' : ''}`}><Users size={20} /> Vendor Management</Link>
        <Link to="/suppliers" className={`nav-item ${active === '/suppliers' ? 'active' : ''}`}><Building size={20} /> Supplier Portal</Link>
        <Link to="/orders" className={`nav-item ${active === '/orders' ? 'active' : ''}`}><Receipt size={20} /> Master Orders</Link>
        <Link to="/analytics" className={`nav-item ${active === '/analytics' ? 'active' : ''}`}><TrendingUp size={20} /> Network Analytics</Link>
        <Link to="/support" className={`nav-item ${active === '/support' ? 'active' : ''}`}><AlertTriangle size={20} /> Support</Link>
        {isSuper && (
          <>
            <div className="nav-divider">Admin</div>
            <Link to="/access-control" className={`nav-item ${active === '/access-control' ? 'active' : ''}`}><ShieldAlert size={20} /> Access Control</Link>
            <Link to="/audit" className={`nav-item ${active === '/audit' ? 'active' : ''}`}><ShieldCheck size={20} /> Audit Trail</Link>
            <Link to="/gst" className={`nav-item ${active === '/gst' ? 'active' : ''}`}><Calculator size={20} /> GST Manager</Link>
          </>
        )}
      </nav>
    </aside>
  );
}