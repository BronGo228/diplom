import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useStore } from '../store/useStore';
import { Search, Bell, QrCode } from 'lucide-react';
import GlobalScanner from './GlobalScanner';

export default function Layout() {
  const user = useStore(state => state.user);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showQrPopup, setShowQrPopup] = useState(false);
  const [showBellPopup, setShowBellPopup] = useState(false);
  
  const headerRef = useRef(null);

  // Close popups on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowQrPopup(false);
        setShowBellPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        navigate(`/components?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate('/components');
      }
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', padding: '16px', gap: '16px' }}>
      <GlobalScanner />
      <Sidebar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <header className="glass-panel" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, position: 'relative', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '400px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '0 16px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Поиск по партномеру или названию (нажмите Enter)..." 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', padding: '12px 0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', position: 'relative' }} ref={headerRef}>
            <button 
              className="btn-icon" 
              onClick={() => { setShowQrPopup(!showQrPopup); setShowBellPopup(false); }} 
              title="Сканировать Штрихкод"
            >
              <QrCode size={22} />
            </button>
            <button 
              className="btn-icon" 
              onClick={() => { setShowBellPopup(!showBellPopup); setShowQrPopup(false); }} 
              title="Уведомления"
            >
              <Bell size={22} />
            </button>

            {showQrPopup && (
              <div className="glass-panel" style={{ position: 'absolute', top: '50px', right: '40px', width: '300px', padding: '20px', zIndex: 50, animation: 'fadeIn 0.2s ease', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                  <QrCode size={18} color="var(--accent)" /> Сканирование
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Подключите аппаратный USB-сканер штрихкодов в режиме "клавиатуры".<br/><br/>
                  Система автоматически перехватит сканирование, находясь в <b>любом разделе</b> интерфейса!
                </p>
              </div>
            )}

            {showBellPopup && (
              <div className="glass-panel" style={{ position: 'absolute', top: '50px', right: '0', width: '280px', minHeight: '150px', padding: '0', zIndex: 50, animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>
                  Уведомления
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                  <Bell size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <span style={{ fontSize: '0.9rem' }}>Нет новых уведомлений</span>
                </div>
              </div>
            )}
          </div>
        </header>
        
        <main style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
