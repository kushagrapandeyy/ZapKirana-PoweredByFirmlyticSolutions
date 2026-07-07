import { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { fetchWithAuth, useAuth } from '../AuthContext';
import DataGrid from '../components/DataGrid';

const API_BASE = 'https://zapkirana-poweredbyfirmlyticsolutions.onrender.com';

function parseCSV(text: string) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] || '';
    });
    rows.push(obj);
  }
  return rows;
}

export default function SupplierImportPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batch, setBatch] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file || !user?.storeId) return;
    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        alert('File is empty or invalid.');
        setUploading(false);
        return;
      }

      const uploadRes = await fetchWithAuth(`${API_BASE}/admin/suppliers/import/upload`, {
        method: 'POST',
        body: JSON.stringify({ storeId: user.storeId, rows }),
      });
      const uploadData = await uploadRes.json();

      // Fetch preview
      const previewRes = await fetchWithAuth(`${API_BASE}/admin/suppliers/import/${uploadData.id}/preview`);
      const previewData = await previewRes.json();
      setBatch(previewData);
    } catch (e) {
      console.error(e);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!batch) return;
    try {
      await fetchWithAuth(`${API_BASE}/admin/suppliers/import/${batch.id}/confirm`, {
        method: 'POST',
      });
      alert('Suppliers imported successfully!');
      window.location.href = '/suppliers';
    } catch (e) {
      console.error(e);
      alert('Error confirming import');
    }
  };

  const handleCancel = async () => {
    if (!batch) return;
    try {
      await fetchWithAuth(`${API_BASE}/admin/suppliers/import/${batch.id}/cancel`, {
        method: 'POST',
      });
      window.location.href = '/suppliers';
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'Row', accessor: 'rowNumber' },
    { header: 'Supplier Name', accessor: (row: any) => row.parsedData.supplier_name || '-' },
    { header: 'GSTIN', accessor: (row: any) => row.parsedData.gstin || '-' },
    { 
      header: 'Status', 
      accessor: (row: any) => {
        if (row.validationStatus === 'VALID') return <span className="badge badge-success">VALID</span>;
        if (row.validationStatus === 'DUPLICATE') return <span className="badge badge-warning">DUPLICATE</span>;
        return <span className="badge badge-error">INVALID</span>;
      }
    },
    { 
      header: 'Errors', 
      accessor: (row: any) => row.validationErrors ? row.validationErrors.join(', ') : '-' 
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><Upload size={28} style={{marginRight: 10}}/> Import Suppliers</h2>
        <button className="btn" style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-primary)' }} onClick={() => window.location.href = '/suppliers'}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {!batch ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Upload size={48} color="var(--primary)" style={{ marginBottom: 20 }} />
          <h3>Upload Supplier CSV</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Ensure your CSV contains columns: supplier_name, gstin, pan, mobile, address, etc.
          </p>
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ marginBottom: 20 }} />
          <br />
          <button className="btn btn-primary" onClick={processFile} disabled={!file || uploading}>
            {uploading ? 'Processing...' : 'Upload & Preview'}
          </button>
        </div>
      ) : (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div className="stat-card" style={{ flex: 1, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <h3 style={{ color: '#22c55e' }}>Valid</h3>
                <div className="stat-value">{batch.validRows}</div>
              </div>
              <div className="stat-card" style={{ flex: 1, backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                <h3 style={{ color: '#eab308' }}>Duplicates (Skipped)</h3>
                <div className="stat-value">{batch.duplicateRows}</div>
              </div>
              <div className="stat-card" style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <h3 style={{ color: '#ef4444' }}>Invalid</h3>
                <div className="stat-value">{batch.invalidRows}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={handleCancel}>Cancel Import</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={batch.validRows === 0}>
                <CheckCircle2 size={18} /> Confirm Import ({batch.validRows} rows)
              </button>
            </div>
          </div>

          <DataGrid 
            columns={columns} 
            data={batch.rows} 
            keyExtractor={row => row.id} 
            emptyStateMessage="No rows found."
          />
        </div>
      )}
    </div>
  );
}
