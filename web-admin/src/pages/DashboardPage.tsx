import { useState, useEffect } from 'react';
import { Store, Users, Building, Receipt, TrendingUp, AlertTriangle, CloudRain, ShieldCheck } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth(`${API_BASE}/admin/dashboard`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: 12, fontWeight: 500 }}>Initializing Platform Overview...</span>
      </div>
    );
  }

  if (!stats) return <div style={{padding: 40}}>Failed to load dashboard.</div>;

  return (
    <div style={{ padding: '0 20px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Platform Tower</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15 }}>Monitor your grocery network across all locations.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 16px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <CloudRain size={16} color="#3B82F6" /> Weather Impact
          </button>
          <button style={{ padding: '10px 16px', background: 'var(--primary)', border: 'none', borderRadius: 12, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            <TrendingUp size={16} /> Generate Report
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        {[
          { label: 'Active Stores', value: stats.totalStores, icon: <Store size={24}/>, color: '#10B981', bg: 'rgba(16,185,129,0.1)', trend: '+12% this week' },
          { label: 'Total Orders', value: stats.totalOrders?.toLocaleString() || 0, icon: <Receipt size={24}/>, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', trend: '+45% vs last month' },
          { label: 'Network Staff', value: stats.totalVendors, icon: <Users size={24}/>, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', trend: 'Active across roles' },
          { label: 'Platform Suppliers', value: stats.totalSuppliers, icon: <Building size={24}/>, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', trend: '8 pending approval' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: stat.bg, color: stat.color, padding: 12, borderRadius: 12 }}>
                {stat.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
            <div style={{ fontSize: 13, color: stat.color, fontWeight: 500, background: stat.bg, padding: '4px 8px', borderRadius: 6, alignSelf: 'flex-start' }}>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Orders */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Live Network Transactions</h3>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>View All</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0 0 12px', fontWeight: 600, fontSize: 13 }}>Order ID</th>
                <th style={{ padding: '0 0 12px', fontWeight: 600, fontSize: 13 }}>Store Bucket</th>
                <th style={{ padding: '0 0 12px', fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: '0 0 12px', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders?.map((o: any) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>#{o.id.substring(0,8).toUpperCase()}</td>
                  <td style={{ padding: '16px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Store size={14} color="var(--text-muted)" />
                      {o.store?.name}
                    </div>
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ 
                      background: o.status === 'DELIVERED' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', 
                      color: o.status === 'DELIVERED' ? '#10B981' : '#3B82F6', 
                      padding: '4px 10px', 
                      borderRadius: 20, 
                      fontSize: 12, 
                      fontWeight: 700 
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                    ₹{o.totalAmount?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
              {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    No recent orders across the network.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* System Health / Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="#10B981" /> System Health
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>API Gateway</span>
                <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12 }}>99.99%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Scanner Sync</span>
                <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12 }}>Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Database Load</span>
                <span style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 12 }}>Moderate</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
              <TrendingUp size={120} color="#FFFFFF" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>AI Insights</h3>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Gemini detected an upcoming festival weekend. Suggest store buckets to increase inventory of sweets and gifting items by 35%.
            </p>
            <button style={{ background: '#3B82F6', border: 'none', padding: '10px 16px', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Review Recommendation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}