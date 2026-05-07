import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Cpu, 
  Warehouse, 
  PackagePlus, 
  FileText, 
  ScanSearch,
  LogOut,
  Package,
  Users,
  ShoppingCart,
  BarChart2,
  FileMinus,
  ArrowRightLeft,
  Printer
} from 'lucide-react';

export default function Sidebar() {
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Дашборд', roles: ['admin', 'storekeeper', 'buyer', 'seller', 'auditor', 'director'] },
    { path: '/components', icon: <Cpu size={20} />, label: 'Номенклатура', roles: ['admin', 'storekeeper', 'buyer', 'seller', 'auditor', 'director'] },
    { path: '/locations', icon: <Warehouse size={20} />, label: 'Склад и Ячейки', roles: ['admin', 'storekeeper', 'auditor'] },
    { path: '/inbound', icon: <PackagePlus size={20} />, label: 'Приемка', roles: ['admin', 'storekeeper'] },
    { path: '/requests', icon: <FileText size={20} />, label: 'Заявки (BOM)', roles: ['admin', 'storekeeper', 'seller', 'director'] },
    { path: '/audit', icon: <ScanSearch size={20} />, label: 'Аудит', roles: ['admin', 'auditor'] },
    { path: '/write-offs', icon: <FileMinus size={20} />, label: 'Списания', roles: ['admin', 'storekeeper', 'director'] },
    { path: '/transfers', icon: <ArrowRightLeft size={20} />, label: 'Перемещения', roles: ['admin', 'storekeeper'] },
    { path: '/print-labels', icon: <Printer size={20} />, label: 'Печать этикеток', roles: ['admin', 'storekeeper', 'auditor'] },
    { path: '/users', icon: <Users size={20} />, label: 'Пользователи', roles: ['admin'] },
    { path: '/purchases', icon: <ShoppingCart size={20} />, label: 'Закупки', roles: ['admin', 'buyer'] },
    { path: '/reports', icon: <BarChart2 size={20} />, label: 'Отчеты', roles: ['admin', 'director'] }
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '24px 16px' }} className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 10px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent), #a29bfe)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '1.4rem' }}>ElecTrack</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              transition: 'var(--transition)'
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 10px 0', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.username}</span>
            {user?.role && user.role !== user.username && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</span>
            )}
          </div>
        </div>
        <button className="btn-icon" onClick={handleLogout} title="Выйти">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
