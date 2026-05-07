import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Package, Lock, User as UserIcon } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use dynamic window.location.hostname for the API in case it's not localhost
      const res = await fetch(`http://localhost:8000/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) {
        throw new Error("Неверный логин или пароль");
      }
      
      const userData = await res.json();
      login(userData);
    } catch (err) {
      alert(err.message || "Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '420px', padding: '40px', zIndex: 100 }}>
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent), #a29bfe)', borderRadius: '8px', boxShadow: '0 0 20px var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="white" />
            </div>
            <h1 style={{ fontSize: '1.8rem' }}>ElecTrack</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px', textAlign: 'center' }}>
            Система учета радиоэлектронных компонентов
          </p>
          
          <form style={{ width: '100%' }} onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Имя пользователя</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  required 
                  placeholder="Введите логин" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            
            <div className="input-group" style={{ marginBottom: '30px' }}>
              <label>Пароль</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  required 
                  placeholder="Введите пароль" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
