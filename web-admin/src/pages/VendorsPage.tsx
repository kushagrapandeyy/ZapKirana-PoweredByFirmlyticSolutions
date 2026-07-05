import { useState, useEffect } from 'react';
import { Users, Plus, CheckCircle2 } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';
import GlassModal from '../components/GlassModal';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', storeId: '', role: 'MANAGER' });

  useEffect(() => {
    fetchVendors();
    fetchStores();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/vendors`);
      setVendors(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchStores = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/stores`);
      setStores(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/vendors`, {
        method: 'POST',
        body: JSON.stringify(newVendor),
      });
      setShowModal(false);
      fetchVendors();
    } catch (e) { console.error(e); }
  };

  const columns = [
    {
      header: 'Vendor Name',
      accessor: (row: any) => <strong>{row.name || 'Unnamed Vendor'}</strong>,
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Role',
      accessor: (row: any) => <span className="badge badge-primary">{row.role}</span>,
    },
    {
      header: 'Assigned Store',
      accessor: (row: any) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {row.store?.name || <span style={{ opacity: 0.5 }}>Unassigned</span>}
        </span>
      ),
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><Users size={28} style={{marginRight: 10}}/> Vendor Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Register Vendor
        </button>
      </div>

      <DataGrid 
        columns={columns} 
        data={vendors} 
        keyExtractor={row => row.id} 
        emptyStateMessage="No vendors found."
      />

      <GlassModal isOpen={showModal} onClose={() => setShowModal(false)} title="Register New Vendor">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Full Name</label>
            <input required className="form-control" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input required className="form-control" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Assign to Store</label>
            <select className="form-control" value={newVendor.storeId} onChange={e => setNewVendor({...newVendor, storeId: e.target.value})}>
              <option value="">-- Select Store --</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Vendor Role</label>
            <select className="form-control" value={newVendor.role} onChange={e => setNewVendor({...newVendor, role: e.target.value})}>
              <option value="MANAGER">Store Manager</option>
              <option value="OWNER">Franchise Owner</option>
              <option value="STAFF">General Staff</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 20}}>
            <CheckCircle2 size={18} /> Register Vendor
          </button>
        </form>
      </GlassModal>
    </div>
  );
}