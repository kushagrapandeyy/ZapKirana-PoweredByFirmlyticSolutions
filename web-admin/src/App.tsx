import React, { useState, useEffect } from 'react';
import { Store, Users, Activity, Plus, X, Building, ShieldCheck, LogOut, LayoutDashboard, Calculator, Receipt, Moon, Sun } from 'lucide-react';
import { useAuth, fetchWithAuth } from './AuthContext';
import Login from './Login';

const API_BASE = 'http://localhost:3000';

function AdminDashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  
  const [stats, setStats] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Forms
  const [storeForm, setStoreForm] = useState({ name: '', address: '', operatingRadiusKm: '5', bankAccountNumber: '', bankRoutingNumber: '', taxId: '' });
  const [vendorForm, setVendorForm] = useState({ name: '', email: '', phone: '', password: '', storeId: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', contactEmail: '', contactPhone: '', paymentTerms: 'Net 30' });

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'DASHBOARD') {
        const res = await fetchWithAuth(`${API_BASE}/admin/dashboard`);
        setStats(await res.json());
      } else if (activeTab === 'STORES') {
        const res = await fetchWithAuth(`${API_BASE}/admin/stores`);
        setStores(await res.json());
      } else if (activeTab === 'VENDORS') {
        const res = await fetchWithAuth(`${API_BASE}/admin/vendors`);
        setVendors(await res.json());
        const sRes = await fetchWithAuth(`${API_BASE}/admin/stores`);
        setStores(await sRes.json());
      } else if (activeTab === 'SUPPLIERS') {
        const res = await fetchWithAuth(`${API_BASE}/admin/suppliers`);
        setSuppliers(await res.json());
      } else if (activeTab === 'AUDIT') {
        const res = await fetchWithAuth(`${API_BASE}/admin/audits`);
        setAudits(await res.json());
      }
    } catch(e) {
      console.error(e);
    }
  };

  const submitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/stores`, { method: 'POST', body: JSON.stringify(storeForm) });
      setShowStoreModal(false);
      fetchData();
    } catch(e) { console.error(e); }
  };

  const submitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/vendors`, { method: 'POST', body: JSON.stringify(vendorForm) });
      setShowVendorModal(false);
      fetchData();
    } catch(e) { console.error(e); }
  };

  const submitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_BASE}/admin/suppliers`, { method: 'POST', body: JSON.stringify(supplierForm) });
      setShowSupplierModal(false);
      fetchData();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            <Building size={28} />
            Basko Admin
          </h1>
        </div>
        <nav className="nav-links">
          <button className={`nav-item ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
            <LayoutDashboard size={20} /> Overview Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'STORES' ? 'active' : ''}`} onClick={() => setActiveTab('STORES')}>
            <Store size={20} /> Stores Directory
          </button>
          <button className={`nav-item ${activeTab === 'VENDORS' ? 'active' : ''}`} onClick={() => setActiveTab('VENDORS')}>
            <Users size={20} /> Vendor Management
          </button>
          <button className={`nav-item ${activeTab === 'SUPPLIERS' ? 'active' : ''}`} onClick={() => setActiveTab('SUPPLIERS')}>
            <Building size={20} /> Supplier Portal
          </button>
          <button className={`nav-item ${activeTab === 'GST' ? 'active' : ''}`} onClick={() => setActiveTab('GST')}>
            <Calculator size={20} /> GST Manager
          </button>
          <button className={`nav-item ${activeTab === 'ORDERS' ? 'active' : ''}`} onClick={() => setActiveTab('ORDERS')}>
            <Receipt size={20} /> Master Orders
          </button>
          <button className={`nav-item ${activeTab === 'AUDIT' ? 'active' : ''}`} onClick={() => setActiveTab('AUDIT')}>
            <ShieldCheck size={20} /> Audit Trail
          </button>
        </nav>
        
        <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Theme</span>
            <button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <div style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Logged in as:<br/><strong>{user?.name}</strong>
          </div>
          <button className="nav-item" style={{color: 'var(--danger)', padding: 0}} onClick={logout}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        
        {/* DASHBOARD VIEW */}
        {activeTab === 'DASHBOARD' && stats && (
          <div>
            <div className="page-header">
              <h2 className="page-title">Platform Overview</h2>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{background: 'var(--primary-light)', color: 'var(--primary)'}}><Store size={28}/></div>
                <div className="stat-info">
                  <h4>Active Stores</h4>
                  <div className="value">{stats.totalStores}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background: 'rgba(16,185,129,0.1)', color: 'var(--success)'}}><Receipt size={28}/></div>
                <div className="stat-info">
                  <h4>Total Orders</h4>
                  <div className="value">{stats.totalOrders.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background: 'rgba(245,158,11,0.1)', color: 'var(--warning)'}}><Users size={28}/></div>
                <div className="stat-info">
                  <h4>Vendor Staff</h4>
                  <div className="value">{stats.totalVendors}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background: 'rgba(239,68,68,0.1)', color: 'var(--danger)'}}><Building size={28}/></div>
                <div className="stat-info">
                  <h4>Total Suppliers</h4>
                  <div className="value">{stats.totalSuppliers}</div>
                </div>
              </div>
            </div>

            <h3 style={{marginBottom: 20, color: 'var(--text-primary)'}}>Recent Transactions</h3>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Store</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td>#{o.id.substring(0,8).toUpperCase()}</td>
                      <td>{o.store?.name}</td>
                      <td><span className="badge badge-primary">{o.status}</span></td>
                      <td>₹{o.totalAmount.toFixed(2)}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STORES VIEW */}
        {activeTab === 'STORES' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">Stores Directory</h2>
              <button className="btn btn-primary" onClick={() => setShowStoreModal(true)}>
                <Plus size={18} /> Add New Store
              </button>
            </div>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>Address</th>
                    <th>Radius</th>
                    <th>Tax ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store.id}>
                      <td><strong>{store.name}</strong></td>
                      <td>{store.address || store.location}</td>
                      <td>{store.operatingRadiusKm} km</td>
                      <td>{store.taxId || 'N/A'}</td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))}
                  {stores.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign:'center', color: 'var(--text-muted)'}}>No stores found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VENDORS VIEW */}
        {activeTab === 'VENDORS' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">Vendor Management</h2>
              <button className="btn btn-primary" onClick={() => setShowVendorModal(true)}>
                <Plus size={18} /> Onboard Vendor
              </button>
            </div>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Store</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.name}</strong></td>
                      <td>{v.email}</td>
                      <td>{v.phone}</td>
                      <td>{v.store?.name}</td>
                      <td><span className="badge badge-primary">{v.role}</span></td>
                    </tr>
                  ))}
                  {vendors.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign:'center', color: 'var(--text-muted)'}}>No vendors found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUPPLIERS VIEW */}
        {activeTab === 'SUPPLIERS' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">Supplier Portal</h2>
              <button className="btn btn-primary" onClick={() => setShowSupplierModal(true)}>
                <Plus size={18} /> Onboard Supplier
              </button>
            </div>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Payment Terms</th>
                    <th>POs Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(sup => (
                    <tr key={sup.id}>
                      <td><strong>{sup.name}</strong></td>
                      <td>{sup.contactEmail || 'N/A'}</td>
                      <td>{sup.contactPhone || 'N/A'}</td>
                      <td>{sup.paymentTerms}</td>
                      <td>{sup._count?.purchaseOrders || 0}</td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign:'center', color: 'var(--text-muted)'}}>No suppliers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GST MANAGER VIEW */}
        {activeTab === 'GST' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">GST Classification Engine</h2>
            </div>
            <div className="card" style={{padding: 40, textAlign: 'center'}}>
              <Calculator size={64} color="var(--primary)" style={{marginBottom: 20}} />
              <h3>Automated GST Rules</h3>
              <p style={{color: 'var(--text-secondary)', marginTop: 10, maxWidth: 600, margin: '10px auto'}}>
                Basko's backend engine automatically classifies products based on over 40 Indian FMCG rules.
                Generate compliant GSTR-1 & GSTR-3B reports directly from here at month-end.
              </p>
              <button className="btn btn-primary" style={{marginTop: 20}}>Generate Monthly GST Report</button>
            </div>
          </div>
        )}

        {/* ORDERS VIEW */}
        {activeTab === 'ORDERS' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">Master Orders View</h2>
            </div>
            <div className="card" style={{padding: 40, textAlign: 'center'}}>
              <Receipt size={64} color="var(--primary)" style={{marginBottom: 20}} />
              <h3>All Platform Orders</h3>
              <p style={{color: 'var(--text-secondary)', marginTop: 10}}>View and track all active orders across all stores.</p>
              <button className="btn btn-primary" style={{marginTop: 20}} onClick={() => setActiveTab('DASHBOARD')}>Go to Dashboard</button>
            </div>
          </div>
        )}

        {/* AUDIT VIEW */}
        {activeTab === 'AUDIT' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">System Audit Trail</h2>
            </div>
            <div className="card">
              <div style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 16}}>
                {audits.map(log => (
                  <div key={log.id} style={{display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid var(--border)'}}>
                    <div style={{width: 40, height: 40, borderRadius: 8, background: 'var(--surface-alt)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                      <Activity size={20} color="var(--text-muted)" />
                    </div>
                    <div>
                      <h4 style={{fontSize: 15, color: 'var(--text-primary)', marginBottom: 4}}>{log.details || log.action}</h4>
                      <span style={{fontSize: 12, color: 'var(--text-muted)'}}>
                        {new Date(log.createdAt).toLocaleString()} • {log.entityType} ({log.entityId})
                      </span>
                    </div>
                  </div>
                ))}
                {audits.length === 0 && <p style={{color: 'var(--text-muted)'}}>No logs found.</p>}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* STORE MODAL */}
      {showStoreModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Onboard New Store</h3>
              <button className="close-btn" onClick={() => setShowStoreModal(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitStore}>
                <div className="form-group">
                  <label>Store Name</label>
                  <input required className="form-control" value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} placeholder="e.g. Basko Supermart" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input required className="form-control" value={storeForm.address} onChange={e => setStoreForm({...storeForm, address: e.target.value})} placeholder="Full address" />
                </div>
                
                <h4 style={{marginTop: 30, marginBottom: 15, fontSize: 16}}>Payment Details (Banking)</h4>
                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input required className="form-control" value={storeForm.bankAccountNumber} onChange={e => setStoreForm({...storeForm, bankAccountNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bank Routing Number / IFSC</label>
                  <input required className="form-control" value={storeForm.bankRoutingNumber} onChange={e => setStoreForm({...storeForm, bankRoutingNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Tax ID / GSTIN</label>
                  <input required className="form-control" value={storeForm.taxId} onChange={e => setStoreForm({...storeForm, taxId: e.target.value})} />
                </div>

                <div style={{marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 10}}>
                  <button type="button" className="btn" style={{background: 'var(--surface-alt)', color: 'var(--text-primary)'}} onClick={() => setShowStoreModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Store</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VENDOR MODAL */}
      {showVendorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Onboard Vendor (Staff)</h3>
              <button className="close-btn" onClick={() => setShowVendorModal(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitVendor}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input required className="form-control" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input required type="email" className="form-control" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input required className="form-control" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Temporary Password</label>
                  <input required type="password" className="form-control" value={vendorForm.password} onChange={e => setVendorForm({...vendorForm, password: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Assign to Store</label>
                  <select required className="form-control" value={vendorForm.storeId} onChange={e => setVendorForm({...vendorForm, storeId: e.target.value})}>
                    <option value="">Select a store...</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 10}}>
                  <button type="button" className="btn" style={{background: 'var(--surface-alt)', color: 'var(--text-primary)'}} onClick={() => setShowVendorModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Vendor</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Onboard Supplier</h3>
              <button className="close-btn" onClick={() => setShowSupplierModal(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitSupplier}>
                <div className="form-group">
                  <label>Supplier / Distributor Name</label>
                  <input required className="form-control" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" className="form-control" value={supplierForm.contactEmail} onChange={e => setSupplierForm({...supplierForm, contactEmail: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input className="form-control" value={supplierForm.contactPhone} onChange={e => setSupplierForm({...supplierForm, contactPhone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <select className="form-control" value={supplierForm.paymentTerms} onChange={e => setSupplierForm({...supplierForm, paymentTerms: e.target.value})}>
                    <option value="CIA">CIA (Cash in Advance)</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div style={{marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 10}}>
                  <button type="button" className="btn" style={{background: 'var(--surface-alt)', color: 'var(--text-primary)'}} onClick={() => setShowSupplierModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Onboard Supplier</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  
  if (!user) {
    return <Login />;
  }

  return <AdminDashboard />;
}
