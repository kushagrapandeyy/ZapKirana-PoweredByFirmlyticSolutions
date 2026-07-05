import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import StoresPage from './pages/StoresPage';
import VendorsPage from './pages/VendorsPage';
import SuppliersPage from './pages/SuppliersPage';
import AccessControlPage from './pages/AccessControlPage';
import AuditLogsPage from './pages/AuditLogsPage';
import MasterOrdersPage from './pages/MasterOrdersPage';
import NetworkAnalyticsPage from './pages/NetworkAnalyticsPage';
import GstManagerPage from './pages/GstManagerPage';
import ScannerManagement from './pages/ScannerManagement';
import SupportOperations from './pages/support/SupportOperations';

function MainLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Topbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/orders" element={<MasterOrdersPage />} />
            <Route path="/analytics" element={<NetworkAnalyticsPage />} />
            <Route path="/support" element={<SupportOperations user={null} />} />
            <Route path="/scanner" element={<ScannerManagement />} />
            
            <Route path="/access-control" element={<ProtectedRoute allowedRoles={['ORG_ADMIN']}><AccessControlPage /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute allowedRoles={['ORG_ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
            <Route path="/gst" element={<ProtectedRoute allowedRoles={['ORG_ADMIN']}><GstManagerPage /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <MainLayout />;
}
