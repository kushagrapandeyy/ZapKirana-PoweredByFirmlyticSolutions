import { useState, useEffect } from 'react';
import { Store, Plus, Copy, Edit } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';
import GlassModal from '../components/GlassModal';
import OnboardingWizard from '../components/OnboardingWizard';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/stores`);
      setStores(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (data: any) => {
    try {
      await fetchWithAuth(`${API_BASE}/admin/stores`, {
        method: 'POST',
        body: JSON.stringify(data),
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
        <OnboardingWizard 
          onSubmit={handleCreate} 
          onCancel={() => setShowModal(false)} 
        />
      </GlassModal>
    </div>
  );
}