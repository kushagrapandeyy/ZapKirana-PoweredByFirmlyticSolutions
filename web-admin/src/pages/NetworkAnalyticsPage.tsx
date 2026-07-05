import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Activity } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';

const API_BASE = 'http://localhost:3000';

export default function NetworkAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchWithAuth(`${API_BASE}/admin/dashboard`)
      .then(res => res.json())
      .then(setAnalytics)
      .catch(console.error);
  }, []);

  if (!analytics) return <div style={{padding: 40}}>Loading Network Analytics...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'var(--success)';
      case 'CANCELLED': return 'var(--danger)';
      default: return 'var(--warning)';
    }
  };

  const columns = [
    { header: 'Order ID', accessor: (row: any) => <strong>#{row.id.substring(0,8).toUpperCase()}</strong> },
    { header: 'Store', accessor: (row: any) => row.store?.name || 'Unknown' },
    { header: 'Amount', accessor: (row: any) => `₹${row.totalAmount.toFixed(2)}` },
    { 
      header: 'Status', 
      accessor: (row: any) => (
        <span style={{ color: getStatusColor(row.status), fontWeight: 600 }}>{row.status}</span>
      )
    },
    { header: 'Time', accessor: (row: any) => new Date(row.createdAt).toLocaleTimeString() }
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><TrendingUp size={28} style={{marginRight: 10}}/> Network Analytics</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05))' }}>
          <div className="stat-icon" style={{background: 'var(--primary)', color: '#fff'}}><DollarSign size={28}/></div>
          <div className="stat-info">
            <h4>Total Platform Volume</h4>
            <div className="value">₹{analytics.recentOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'var(--success)', color: '#fff'}}><ShoppingCart size={28}/></div>
          <div className="stat-info">
            <h4>Orders Processed</h4>
            <div className="value">{analytics.totalOrders}</div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{background: 'var(--accent)', color: '#fff'}}><Activity size={28}/></div>
          <div className="stat-info">
            <h4>Active Stores</h4>
            <div className="value">{analytics.totalStores}</div>
          </div>
        </div>
      </div>

      <h3 style={{ margin: '32px 0 20px', color: 'var(--text-primary)' }}>Live Order Stream</h3>
      <DataGrid 
        columns={columns} 
        data={analytics.recentOrders} 
        keyExtractor={row => row.id} 
        emptyStateMessage="No recent orders."
      />
    </div>
  );
}