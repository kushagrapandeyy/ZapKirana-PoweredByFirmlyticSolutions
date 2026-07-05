import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../AuthContext';
import { ShieldAlert, Plus, X } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

export default function AccessControlPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'ORG_ADMIN' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/access-control/staff`);
      setStaff(await res.json());
    } catch (e) { console.error(e); }
  };

  const inviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/access-control/invite`, {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });
      setShowInviteModal(false);
      fetchStaff();
    } catch (e) { console.error(e); }
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      await fetchWithAuth(`${API_BASE}/admin/access-control/staff/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      fetchStaff();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><ShieldAlert size={28} style={{marginRight: 10}}/> Platform Access Control</h2>
        <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
          <Plus size={18} /> Invite Platform Staff
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Platform Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(user => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>
                  <select 
                    className="form-control" 
                    style={{width: 'auto', padding: '6px 12px'}}
                    value={user.role} 
                    onChange={e => updateRole(user.id, e.target.value)}
                  >
                    <option value="ORG_ADMIN">Super Admin (ORG_ADMIN)</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </td>
                <td>
                  <button className="btn" style={{background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '6px 12px'}}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{maxWidth: 400}}>
            <div className="modal-header">
              <h3>Invite Staff</h3>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={inviteStaff}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input required className="form-control" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input required type="email" className="form-control" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-control" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}>
                    <option value="ORG_ADMIN">Super Admin</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 20}}>Send Invite</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}