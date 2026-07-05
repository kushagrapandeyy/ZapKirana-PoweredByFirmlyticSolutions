import { useState, useEffect } from 'react';
import { Receipt, Search, Filter } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function MasterOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Currently relying on dashboard stats for demo purposes since we don't have a dedicated /admin/orders endpoint exposed globally yet.
    // In production, this would call /admin/orders
    fetchWithAuth(`${API_BASE}/admin/dashboard`)
      .then(res => res.json())
      .then(data => setOrders(data.recentOrders || []))
      .catch(console.error);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      case 'PENDING': return 'badge-warning';
      default: return 'badge-primary';
    }
  };

  const columns = [
    { header: 'Order ID', accessor: (row: any) => <strong>#{row.id.substring(0,8).toUpperCase()}</strong> },
    { header: 'Store', accessor: (row: any) => row.store?.name || 'Unknown' },
    { header: 'Customer', accessor: (row: any) => row.user?.name || row.user?.phone || 'Guest' },
    { header: 'Amount', accessor: (row: any) => `₹${row.totalAmount.toFixed(2)}` },
    { 
      header: 'Status', 
      accessor: (row: any) => <span className={`badge ${getStatusColor(row.status)}`}>{row.status}</span>
    },
    { header: 'Date', accessor: (row: any) => new Date(row.createdAt).toLocaleString() }
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><Receipt size={28} style={{marginRight: 10}}/> Master Orders</h2>
        <div style={{display: 'flex', gap: 12}}>
          <div className="search-bar" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Search size={16} />
            <input placeholder="Search orders..." />
          </div>
          <button className="btn" style={{background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)'}}>
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <DataGrid 
        columns={columns} 
        data={orders} 
        keyExtractor={row => row.id} 
        emptyStateMessage="No orders found."
      />
    </div>
  );
}