import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../AuthContext';
import { Users, Smartphone, BarChart3, Plus } from 'lucide-react';

export default function ScannerManagement() {
  const [activeTab, setActiveTab] = useState('STAFF');
  const [staff, setStaff] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', pin: '' });
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ deviceName: '', deviceCode: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, devicesRes, analyticsRes] = await Promise.all([
        fetchWithAuth('https://zapkirana-poweredbyfirmlyticsolutions.onrender.com/api/v1/scanner-management/staff'),
        fetchWithAuth('https://zapkirana-poweredbyfirmlyticsolutions.onrender.com/api/v1/scanner-management/devices'),
        fetchWithAuth('https://zapkirana-poweredbyfirmlyticsolutions.onrender.com/api/v1/scanner-management/analytics')
      ]);
      setStaff(await staffRes.json());
      setDevices(await devicesRes.json());
      setAnalytics(await analyticsRes.json());
    } catch (e) {
      console.error('Failed to load scanner data', e);
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async () => {
    try {
      await fetchWithAuth('https://zapkirana-poweredbyfirmlyticsolutions.onrender.com/api/v1/scanner-management/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      });
      setShowStaffModal(false);
      setStaffForm({ name: '', pin: '' });
      loadData();
    } catch (e) {
      alert('Failed to create staff');
    }
  };

  const createDevice = async () => {
    try {
      await fetchWithAuth('https://zapkirana-poweredbyfirmlyticsolutions.onrender.com/api/v1/scanner-management/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceForm)
      });
      setShowDeviceModal(false);
      setDeviceForm({ deviceName: '', deviceCode: '' });
      loadData();
    } catch (e) {
      alert('Failed to register device');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Scanner Management</h2>
        <div className="flex gap-2">
          <button className={`btn ${activeTab === 'STAFF' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('STAFF')}>
            <Users size={18} className="mr-2" /> Staff
          </button>
          <button className={`btn ${activeTab === 'DEVICES' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('DEVICES')}>
            <Smartphone size={18} className="mr-2" /> Devices
          </button>
          <button className={`btn ${activeTab === 'ANALYTICS' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('ANALYTICS')}>
            <BarChart3 size={18} className="mr-2" /> Analytics
          </button>
        </div>
      </div>

      {activeTab === 'STAFF' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Scanner Staff</h3>
            <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>
              <Plus size={18} className="mr-2"/> Add Staff
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">PIN</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id} className="border-b dark:border-gray-700">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.email}</td>
                  <td className="py-2 font-mono bg-gray-100 dark:bg-gray-800 px-2 rounded inline-block mt-2">{s.pin}</td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-gray-500">No staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'DEVICES' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Registered Devices</h3>
            <button className="btn btn-primary" onClick={() => setShowDeviceModal(true)}>
              <Plus size={18} className="mr-2"/> Register Device
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="pb-2">Device Name</th>
                <th className="pb-2">Device Code</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="border-b dark:border-gray-700">
                  <td className="py-2">{d.deviceName}</td>
                  <td className="py-2 font-mono text-blue-600">{d.deviceCode}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${d.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-gray-500">No devices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Time Spent Today</h3>
              <p className="text-3xl font-bold mt-2">{Math.floor(analytics.totalTimeSpentSeconds / 60)} mins</p>
            </div>
            <div className="card">
              <h3 className="text-gray-500 text-sm font-semibold uppercase">Items Scanned Today</h3>
              <p className="text-3xl font-bold mt-2">{analytics.scansToday}</p>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Recent Sessions</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="pb-2">Staff</th>
                  <th className="pb-2">Device</th>
                  <th className="pb-2">Started At</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentSessions.map((s: any) => (
                  <tr key={s.id} className="border-b dark:border-gray-700">
                    <td className="py-2">{s.staff?.name}</td>
                    <td className="py-2">{s.device?.deviceName}</td>
                    <td className="py-2">{new Date(s.startedAt).toLocaleString()}</td>
                    <td className="py-2">{s.durationSeconds ? `${Math.floor(s.durationSeconds / 60)} mins` : 'Active'}</td>
                  </tr>
                ))}
                {analytics.recentSessions.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No recent sessions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showStaffModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold mb-4">Add Scanner Staff</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={staffForm.name} 
                  onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">4-Digit PIN</label>
                <input 
                  type="text" 
                  className="input" 
                  value={staffForm.pin} 
                  onChange={e => setStaffForm({...staffForm, pin: e.target.value})}
                  placeholder="e.g. 1234"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-outline" onClick={() => setShowStaffModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createStaff}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeviceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold mb-4">Register Device</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={deviceForm.deviceName} 
                  onChange={e => setDeviceForm({...deviceForm, deviceName: e.target.value})}
                  placeholder="e.g. Warehouse Scanner 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Device Code (Unique)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={deviceForm.deviceCode} 
                  onChange={e => setDeviceForm({...deviceForm, deviceCode: e.target.value.toUpperCase()})}
                  placeholder="e.g. DVC-001"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-outline" onClick={() => setShowDeviceModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createDevice}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
