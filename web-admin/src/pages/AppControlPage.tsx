import { useState } from 'react';
import { Activity, Server, Smartphone, AlertTriangle, ShieldAlert, RotateCcw, Megaphone, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function AppControlPage() {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [alertMsg, setAlertMsg] = useState('');
  const [rollbackVersion, setRollbackVersion] = useState('v1.0.4');

  const handleSendAlert = () => {
    if (!alertMsg) return;
    alert(`Global alert broadcasted to all active consumer devices: "${alertMsg}"`);
    setAlertMsg('');
  };

  const handleRollback = () => {
    if (window.confirm(`Are you sure you want to rollback to ${rollbackVersion}? This will toggle feature flags to their previous state.`)) {
      alert(`Rollback to ${rollbackVersion} initiated.`);
    }
  };

  const suspendNetwork = () => {
    if (window.confirm('DANGER: This will put the entire app network into Maintenance Mode. Proceed?')) {
      alert('Network suspended. Users will see a maintenance screen.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><Smartphone size={28} /> App Control Center</h2>
      </div>

      {/* System Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Activity size={20} /> System Health
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1, padding: 20, background: '#f8fafc', borderRadius: 12, textAlign: 'center' }}>
              <Server size={32} color="var(--success)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>100%</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Backend Uptime</div>
            </div>
            <div style={{ flex: 1, padding: 20, background: '#f8fafc', borderRadius: 12, textAlign: 'center' }}>
              <Activity size={32} color="var(--success)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>42ms</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avg API Latency</div>
            </div>
            <div style={{ flex: 1, padding: 20, background: '#f8fafc', borderRadius: 12, textAlign: 'center' }}>
              <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>Sync</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Realtime Engine</div>
            </div>
          </div>
        </div>

        {/* Global Interventions */}
        <div className="card" style={{ borderColor: 'var(--danger)', borderWidth: 2, borderStyle: 'solid' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--danger)' }}>
            <ShieldAlert size={20} /> Emergency Controls
          </h3>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Rollback Application State</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <select 
                className="input-field" 
                value={rollbackVersion}
                onChange={(e) => setRollbackVersion(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="v1.0.4">Stable Release (v1.0.4)</option>
                <option value="v1.0.3">Previous (v1.0.3)</option>
              </select>
              <button className="btn btn-primary" onClick={handleRollback}><RotateCcw size={16} /> Rollback</button>
            </div>
          </div>
          <div>
            <button className="btn" style={{ width: '100%', background: 'var(--danger)', color: 'white' }} onClick={suspendNetwork}>
              <AlertTriangle size={16} /> Suspend Network (Maintenance Mode)
            </button>
          </div>
        </div>
      </div>

      {/* Broadcasting & Campaigns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Megaphone size={20} /> Broadcast User Alert
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 15 }}>Push a realtime notification or alert banner to all active consumer devices.</p>
          <textarea 
            className="input-field" 
            placeholder="Type your emergency alert here..." 
            rows={4}
            value={alertMsg}
            onChange={(e) => setAlertMsg(e.target.value)}
            style={{ marginBottom: 15, width: '100%' }}
          />
          <button className="btn btn-primary" onClick={handleSendAlert}>Push Alert Globally</button>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Activity size={20} /> Active Campaigns (Carousels)
          </h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ paddingBottom: 10 }}>Campaign Name</th>
                <th style={{ paddingBottom: 10 }}>Type</th>
                <th style={{ paddingBottom: 10 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ paddingTop: 10 }}>Summer Grocery Sale</td>
                <td style={{ paddingTop: 10 }}>FESTIVAL</td>
                <td style={{ paddingTop: 10 }}><span className="badge badge-success">Active</span></td>
              </tr>
              <tr>
                <td style={{ paddingTop: 10 }}>Flash Delivery Promo</td>
                <td style={{ paddingTop: 10 }}>FLASH_SALE</td>
                <td style={{ paddingTop: 10 }}><span className="badge badge-success">Active</span></td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }}>Create New Campaign</button>
        </div>

      </div>

    </div>
  );
}
