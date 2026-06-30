import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('STORES')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-emerald-400 tracking-tight">GrocerOS</h1>
          <p className="text-slate-400 text-sm mt-1">Super Admin Console</p>
        </div>
        
        <nav className="flex-1 mt-6">
          <button 
            onClick={() => setActiveTab('STORES')}
            className={`w-full text-left px-6 py-3 hover:bg-slate-800 transition ${activeTab === 'STORES' ? 'bg-slate-800 border-l-4 border-emerald-400' : 'text-slate-300'}`}
          >
            Onboard Stores
          </button>
          <button 
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`w-full text-left px-6 py-3 hover:bg-slate-800 transition ${activeTab === 'SUPPLIERS' ? 'bg-slate-800 border-l-4 border-emerald-400' : 'text-slate-300'}`}
          >
            Global Suppliers
          </button>
          <button 
            onClick={() => setActiveTab('VENDORS')}
            className={`w-full text-left px-6 py-3 hover:bg-slate-800 transition ${activeTab === 'VENDORS' ? 'bg-slate-800 border-l-4 border-emerald-400' : 'text-slate-300'}`}
          >
            System Users
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            {activeTab === 'STORES' && 'Store Onboarding'}
            {activeTab === 'SUPPLIERS' && 'Supplier Directory'}
            {activeTab === 'VENDORS' && 'User Management'}
          </h2>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
            + Create New
          </button>
        </header>

        {activeTab === 'STORES' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Store Name</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-800">FreshMart Koramangala</td>
                  <td className="px-6 py-4 text-slate-600">Bengaluru, KA</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">Manage</button>
                  </td>
                </tr>
                {/* Placeholder for more rows */}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'SUPPLIERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Metro Cash & Carry</h3>
                  <p className="text-sm text-slate-500">FMCG, Dairy, Staples</p>
                </div>
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center">
                  ★ 4.8
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4">Contact: sales@metro.co.in</p>
              <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition">
                Edit Details
              </button>
            </div>
          </div>
        )}

        {activeTab === 'VENDORS' && (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">User Directory</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Manage Owners, Managers, and Pickers. Assign them to specific stores or revoke access globally.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
