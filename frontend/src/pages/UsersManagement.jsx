import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Edit2, Check, X } from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("");

  const roles = ["manager", "storekeeper", "seller", "auditor", "director", "admin", "buyer"];

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveRole = async (id) => {
    try {
      await axios.put(`http://localhost:8000/users/${id}/role`, { role: editRole });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)' }}>
           <Users size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Управление Пользователями</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '4px 0 0 0' }}>Настройка ролей и доступов сотрудников</p>
        </div>
      </div>
      
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка пользователей...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Пользователь</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Роль</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>#{u.id}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      {u.username}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {editingId === u.id ? (
                      <select 
                        value={editRole} 
                        onChange={e => setEditRole(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--primary)', outline: 'none', background: 'rgba(0,0,0,0.3)', color: '#f8f9fa', colorScheme: 'dark' }}
                      >
                        {roles.map(r => <option key={r} value={r} style={{background: '#1a1d24'}}>{r}</option>)}
                      </select>
                    ) : (
                      <span style={{ 
                        background: u.role === 'admin' ? '#fee2e2' : 'var(--primary-light)', 
                        color: u.role === 'admin' ? '#b91c1c' : 'var(--primary)', 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {u.role === 'admin' && <Shield size={14} />}
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {editingId === u.id ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}><X size={18} /></button>
                        <button onClick={() => handleSaveRole(u.id)} className="btn-primary" style={{ padding: '8px', borderRadius: '10px' }}><Check size={18} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingId(u.id); setEditRole(u.role); }}
                        className="btn-secondary"
                        style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'transparent' }}
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Нет пользователей</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
