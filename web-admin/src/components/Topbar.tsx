import { useAuth } from '../AuthContext';
import { LogOut, Search, Bell } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <div className="topbar glass-panel">
      <div className="search-bar">
        <Search size={18} color="var(--text-muted)" />
        <input placeholder="Press Cmd+K to search..." />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn"><Bell size={20} /></button>
        <div className="user-profile">
          <div className="avatar">{user?.name?.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role badge badge-primary">{user?.role}</span>
          </div>
          <button className="icon-btn text-danger" onClick={logout}><LogOut size={18} /></button>
        </div>
      </div>
    </div>
  );
}