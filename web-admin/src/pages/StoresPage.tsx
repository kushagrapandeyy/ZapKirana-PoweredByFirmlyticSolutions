import { useState, useEffect } from 'react';
import { Store, Plus, Copy, CheckCircle2, Edit } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';
import GlassModal from '../components/GlassModal';

const API_BASE = 'http://localhost:3000';

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', location: '', gstin: '', isLive: false });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/stores`);
      setStores(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/stores`, {
        method: 'POST',
        body: JSON.stringify(newStore),
      });
      setShowModal(false);
      fetchStores();
    } catch (e) { console.error(e); }
  };

  const columns = [
    {
      header: 'Store Name',
      accessor: (row: any) => <strong>{row.name}</strong>,
    },
    {
      header: 'Location',
      accessor: 'location',
    },
    {
      header: 'GSTIN',
      accessor: 'gstin',
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-warning'}`}>
          {row.isActive ? 'Active' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      width: '120px',
      accessor: (row: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" title="Copy ID" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.id); }}><Copy size={16}/></button>
          <button className="icon-btn" title="Edit"><Edit size={16}/></button>
        </div>
      ),
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><Store size={28} style={{marginRight: 10}}/> Stores Directory</h2>
        <div style={{display: 'flex', gap: 12}}>
          <button className="btn" style={{background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)'}}>Bulk Upload CSV</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Store
          </button>
        </div>
      </div>

      <DataGrid 
        columns={columns} 
        data={stores} 
        keyExtractor={row => row.id} 
        emptyStateMessage="No stores found in network."
      />

      <GlassModal isOpen={showModal} onClose={() => setShowModal(false)} title="Onboard New Store">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Store Name</label>
            <input required className="form-control" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Location (Area / City)</label>
            <input required className="form-control" value={newStore.location} onChange={e => setNewStore({...newStore, location: e.target.value})} />
          </div>
          <div className="form-group">
            <label>GSTIN</label>
            <input className="form-control" value={newStore.gstin} onChange={e => setNewStore({...newStore, gstin: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 20}}>
            <CheckCircle2 size={18} /> Complete Onboarding
          </button>
        </form>
      </GlassModal>
    </div>
  );
}