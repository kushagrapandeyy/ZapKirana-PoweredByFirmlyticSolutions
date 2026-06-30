import React, { createContext, useState, useContext } from 'react';

export type LedgerEventType = 'PAYMENT_RX' | 'STOCK_ADJ' | 'REFUND_TX';

export interface LedgerEntry {
  id: string;
  type: LedgerEventType;
  time: string;
  actor: string;
  amount?: number;
  method?: string;
  reason?: string;
  timestamp: number;
}

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: 'LDG-001', type: 'PAYMENT_RX', time: '10:30 AM', amount: 450, method: 'UPI', actor: 'System', timestamp: Date.now() - 3600000 },
  { id: 'LDG-002', type: 'STOCK_ADJ', time: '10:45 AM', reason: 'Count Correction', actor: 'Store Mgr', timestamp: Date.now() - 3000000 },
  { id: 'LDG-003', type: 'PAYMENT_RX', time: '11:15 AM', amount: 890, method: 'Card', actor: 'System', timestamp: Date.now() - 2000000 },
];

interface LedgerContextType {
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'time' | 'timestamp'>) => void;
}

const LedgerContext = createContext<LedgerContextType>({
  ledger: [],
  addLedgerEntry: () => {},
});

export function useLedger() {
  return useContext(LedgerContext);
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);

  const addLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'time' | 'timestamp'>) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newEntry: LedgerEntry = {
      ...entry,
      id: `LDG-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      time: timeString,
      timestamp: Date.now(),
    };
    
    setLedger(prev => [newEntry, ...prev]);
  };

  return (
    <LedgerContext.Provider value={{ ledger, addLedgerEntry }}>
      {children}
    </LedgerContext.Provider>
  );
}
