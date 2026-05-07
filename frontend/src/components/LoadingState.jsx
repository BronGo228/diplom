import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ text = 'Загрузка данных...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
      <Loader2 size={40} className="spinner" style={{ color: 'var(--accent)', marginBottom: '16px' }} />
      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{text}</span>
    </div>
  );
}
