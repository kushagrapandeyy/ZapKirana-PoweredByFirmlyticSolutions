import { useState, useEffect } from 'react';
import { Building, Plus, CheckCircle2 } from 'lucide-react';
import { fetchWithAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';
import GlassModal from '../components/GlassModal';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contactName: '', contactPhone: '', gstNumber: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/suppliers`);
      setSuppliers(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/suppliers`, {
        method: 'POST',
        body: JSON.stringify(newSupplier),
      });
      setShowModal(false);
      fetchSuppliers();
    } catch (e) { console.error(e); }
  };

  const columns = [
    {
      header: 'Supplier Name',
      accessor: (row: any) => <strong>{row.name}</strong>,
    },
    {
      header: 'Point of Contact',
      accessor: (row: any) => (
        <div>
          <div>{row.contactName || '-'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.contactPhone}</div>
        </div>
      ),
    },
    {
      header: 'GST Number',
      accessor: 'gstNumber',
    },
    {
      header: 'Status',
      accessor: () => <span className="badge badge-success">Verified</span>,
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><Building size={28} style={{marginRight: 10}}/> Supplier Portal</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-primary)' }} onClick={() => window.location.href = '/suppliers/import'}>
            <Plus size={18} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Supplier
          </button>
        </div>
      </div>

      <DataGrid 
        columns={columns} 
        data={suppliers} 
        keyExtractor={row => row.id} 
        emptyStateMessage="No suppliers in the network."
      />

      <GlassModal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Supplier to Network">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Business Name</label>
            <input required className="form-control" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Name</label>
            <input required className="form-control" value={newSupplier.contactName} onChange={e => setNewSupplier({...newSupplier, contactName: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input required className="form-control" value={newSupplier.contactPhone} onChange={e => setNewSupplier({...newSupplier, contactPhone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input className="form-control" value={newSupplier.gstNumber} onChange={e => setNewSupplier({...newSupplier, gstNumber: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 20}}>
            <CheckCircle2 size={18} /> Register Supplier
          </button>
        </form>
      </GlassModal>
    </div>
  );
}