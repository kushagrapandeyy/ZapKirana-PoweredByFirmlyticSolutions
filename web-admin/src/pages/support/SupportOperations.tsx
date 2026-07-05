import { useState, useEffect, } from 'react';
import { fetchWithAuth } from '../../AuthContext';
import { Send, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

export default function SupportOperations({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const res = await fetchWithAuth(`${API_BASE}/support/tickets`);
    const data = await res.json();
    setTickets(data);
  };

  const openTicket = async (id: string) => {
    const res = await fetchWithAuth(`${API_BASE}/support/tickets/${id}`);
    const data = await res.json();
    setSelectedTicket(data);
    setMessages(data.messages || []);
    // Ideally connect to websocket here using socket.io-client
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    
    // In a real app we'd emit via socket.io, here we'll mock an immediate append
    const msg = {
      id: Math.random().toString(),
      text: newMessage,
      sender: { name: user.name || 'Admin' },
      createdAt: new Date().toISOString()
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="support-container" style={{ display: 'flex', gap: 20, height: '80vh' }}>
      <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
        <h3 style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>Live Support Tickets</h3>
        {tickets.map(t => (
          <div key={t.id} onClick={() => openTicket(t.id)} style={{ padding: 16, borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedTicket?.id === t.id ? 'var(--surface-alt)' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{t.title}</strong>
              <span className={`badge badge-${t.priority === 'CRITICAL' ? 'danger' : 'warning'}`}>{t.priority}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t.store?.name} • {t.status}</p>
          </div>
        ))}
      </div>

      {selectedTicket && (
        <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>{selectedTicket.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status: {selectedTicket.status}</p>
            </div>
            {selectedTicket.orderId && (
              <button className="btn btn-danger" style={{ height: 'fit-content' }}>
                <ShieldAlert size={16} /> Intervene Order
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: 'var(--surface-alt)' }}>
            {messages.map(m => (
              <div key={m.id} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: m.sender.name === user.name ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.sender.name}</span>
                <div style={{ background: m.sender.name === user.name ? 'var(--primary)' : '#fff', color: m.sender.name === user.name ? '#fff' : '#000', padding: '8px 12px', borderRadius: 8, marginTop: 4, maxWidth: '70%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <input className="form-control" style={{ flex: 1 }} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type response..." />
            <button type="submit" className="btn btn-primary"><Send size={18}/></button>
          </form>
        </div>
      )}
    </div>
  );
}
