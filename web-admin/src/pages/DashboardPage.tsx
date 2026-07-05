import { useState, useEffect } from 'react';
import { Store, Users, Building, Receipt } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';

const API_BASE = 'http://localhost:3000';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchWithAuth(`${API_BASE}/admin/dashboard`)
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return <div style={{padding: 40}}>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Platform Overview</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--primary-light)', color: 'var(--primary)'}}><Store size={28}/></div>
          <div className="stat-info">
            <h4>Active Stores</h4>
            <div className="value">{stats.totalStores}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(16,185,129,0.1)', color: 'var(--success)'}}><Receipt size={28}/></div>
          <div className="stat-info">
            <h4>Total Orders</h4>
            <div className="value">{stats.totalOrders.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245,158,11,0.1)', color: 'var(--warning)'}}><Users size={28}/></div>
          <div className="stat-info">
            <h4>Vendor Staff</h4>
            <div className="value">{stats.totalVendors}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(239,68,68,0.1)', color: 'var(--danger)'}}><Building size={28}/></div>
          <div className="stat-info">
            <h4>Total Suppliers</h4>
            <div className="value">{stats.totalSuppliers}</div>
          </div>
        </div>
      </div>

      <h3 style={{marginBottom: 20, color: 'var(--text-primary)'}}>Recent Transactions</h3>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Store</th>
              <th>Status</th>
              <th>Value</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map((o: any) => (
              <tr key={o.id}>
                <td>#{o.id.substring(0,8).toUpperCase()}</td>
                <td>{o.store?.name}</td>
                <td><span className="badge badge-primary">{o.status}</span></td>
                <td>₹{o.totalAmount.toFixed(2)}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}