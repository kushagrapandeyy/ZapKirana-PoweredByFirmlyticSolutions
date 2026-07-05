import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle, AlertTriangle, Info, User } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function AuditLogsPage() {
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    fetchWithAuth(`${API_BASE}/admin/audits?limit=50`)
      .then(res => res.json())
      .then(setAudits)
      .catch(console.error);
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('INVITE') || action.includes('CREATE')) return <CheckCircle size={16} color="var(--success)" />;
    if (action.includes('DELETE') || action.includes('REVOKE')) return <AlertTriangle size={16} color="var(--danger)" />;
    return <Info size={16} color="var(--primary)" />;
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><ShieldCheck size={28} style={{marginRight: 10}}/> Platform Audit Trail</h2>
      </div>

      <div className="card glass-panel" style={{ padding: '24px 40px' }}>
        {audits.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', top: 10, bottom: 10, left: 24, width: 2, background: 'var(--border)', zIndex: 0 }}></div>

            {audits.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                
                {/* Timeline Icon */}
                <div style={{ 
                  width: 50, height: 50, borderRadius: '50%', background: 'var(--surface)', 
                  border: '1px solid var(--border)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow)' 
                }}>
                  {getActionIcon(log.action)}
                </div>

                {/* Log Content */}
                <div style={{ 
                  background: 'var(--surface)', padding: '16px 20px', borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.05)', flex: 1, boxShadow: 'var(--shadow)' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{log.action}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12}/> {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {log.details}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12}/> User ID: {log.userId?.substring(0,8)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Entity: {log.entityType} ({log.entityId?.substring(0,8)})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}