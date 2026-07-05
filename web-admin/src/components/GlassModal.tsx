import React from 'react';
import { X } from 'lucide-react';

export default function GlassModal({ isOpen, onClose, title, children, maxWidth = 560 }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, maxWidth?: number }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal-content glass-panel" style={{ maxWidth, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h3>
          <button className="icon-btn close-btn" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="modal-body" style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
