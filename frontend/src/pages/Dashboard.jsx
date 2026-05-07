import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, Boxes, MapPin, Inbox, ClipboardList, ScanSearch } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px' }}>Обзор склада</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Текущая статистика и важные уведомления</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="glass-panel interactive" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
            <PackageSearch size={32} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>1,204</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Уникальных компонентов</div>
          </div>
        </div>

        <div className="glass-panel interactive" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
            <Boxes size={32} color="#2ed573" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>5,840</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Активных партий (Бабин)</div>
          </div>
        </div>

        <div className="glass-panel interactive" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderColor: 'rgba(255, 165, 2, 0.3)' }}>
          <div style={{ background: 'rgba(255, 165, 2, 0.1)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
            <MapPin size={32} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>12</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Заканчиваются на складе</div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '40px' }}>
         <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Быстрые действия</h2>
         <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/inbound')} className="glass-panel interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '150px', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>
               <Inbox size={36} color="var(--accent)" />
               <span style={{ fontWeight: 500 }}>Приемка</span>
            </button>
            <button onClick={() => navigate('/requests')} className="glass-panel interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '150px', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>
               <ClipboardList size={36} color="var(--success)" />
               <span style={{ fontWeight: 500 }}>Выдача BOM</span>
            </button>
            <button onClick={() => navigate('/audit')} className="glass-panel interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '150px', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>
               <ScanSearch size={36} color="var(--warning)" />
               <span style={{ fontWeight: 500 }}>Аудит</span>
            </button>
         </div>
      </div>
    </div>
  );
}
