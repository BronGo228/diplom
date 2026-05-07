import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { ClipboardCheck, Plus, Search, Check, AlertTriangle, ArrowRight, Package, X } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function Audit() {
  const user = useStore(state => state.user);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAudit, setActiveAudit] = useState(null);
  
  // Scanning states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedBatch, setScannedBatch] = useState(null);
  const [actualQty, setActualQty] = useState('');
  const [scanError, setScanError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAuditName, setNewAuditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  // Auto-focus input when active audit is set and batch is not scanned
  useEffect(() => {
    if (activeAudit && !scannedBatch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeAudit, scannedBatch]);

  const fetchAudits = async () => {
    try {
      const res = await axios.get(`${API_URL}/audits/`);
      setAudits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    if (!newAuditName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/audits/`, {
        name: newAuditName.trim(),
        auditor_id: user?.id || 1,
        status: "In Progress"
      });
      setShowCreateModal(false);
      setNewAuditName('');
      fetchAudits();
      setActiveAudit(res.data);
    } catch (err) {
      console.error(err);
      alert("Ошибка создания аудита");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    setScanError('');
    if (!barcodeInput.trim()) return;

    try {
      const res = await axios.get(`${API_URL}/batches/barcode/${barcodeInput.trim()}`);
      setScannedBatch(res.data);
      setActualQty(res.data.quantity); // Pre-fill with expected
    } catch (err) {
      setScanError('Партия не найдена. Проверьте штрихкод.');
    }
    setBarcodeInput('');
  };

  const handleConfirmResult = async (e) => {
    e.preventDefault();
    if (!actualQty || isNaN(actualQty)) return;

    try {
      await axios.post(`${API_URL}/audits/${activeAudit.id}/scan`, {
        batch_barcode: scannedBatch.barcode,
        actual_quantity: parseInt(actualQty),
        user_id: user?.id || 1
      });
      // Refresh active audit to see results
      const res = await axios.get(`${API_URL}/audits/${activeAudit.id}`);
      setActiveAudit(res.data);
      
      // Reset scan states to scan next
      setScannedBatch(null);
      setActualQty('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения результата");
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck style={{ color: 'var(--primary)' }} />
            Инвентаризация (Аудит)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Циклические проверки остатков</p>
        </div>
        {!activeAudit && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Начать инвентаризацию
          </button>
        )}
        {activeAudit && (
          <button className="btn-secondary" onClick={() => { setActiveAudit(null); setScannedBatch(null); fetchAudits(); }}>
            К списку аудитов
          </button>
        )}
      </div>

      {!activeAudit ? (
        <div className="glass-panel" style={{ padding: '20px' }}>
          {loading ? <p>Загрузка...</p> : audits.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Нет сессий инвентаризации.</p> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Дата начала</th>
                  <th>Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id} onClick={() => setActiveAudit(a)} style={{ cursor: 'pointer' }}>
                    <td>#{a.id}</td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td>{new Date(a.date_started).toLocaleDateString()}</td>
                    <td><span style={{ color: 'var(--accent)' }}>Проверок: {a.results ? a.results.length : 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
          
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-glass)' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Текущий цикл: {activeAudit.name}</h2>
            
            {!scannedBatch ? (
              <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={barcodeInput} 
                      onChange={e => setBarcodeInput(e.target.value)}
                      placeholder="Отсканируйте штрихкод партии (BCH-...)"
                      className="form-control"
                      style={{ paddingLeft: '48px', fontSize: '1.2rem', height: '60px' }}
                    />
                  </div>
                  {scanError && <p style={{ color: 'var(--danger)', marginTop: '8px' }}>{scanError}</p>}
                </div>
                <button type="submit" className="btn-primary" style={{ height: '60px', padding: '0 32px' }}>Найти</button>
              </form>
            ) : (
              <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                   <div>
                     <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <Package color="var(--accent)" /> Партия {scannedBatch.barcode}
                     </h3>
                     <p style={{ color: 'var(--text-secondary)' }}>{scannedBatch.component?.name}</p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>По учету:</p>
                     <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{scannedBatch.quantity} шт</p>
                   </div>
                </div>
                
                <form onSubmit={handleConfirmResult} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Фактический остаток (Факт):</label>
                    <input 
                      type="number"
                      autoFocus
                      required
                      min="0"
                      value={actualQty}
                      onChange={e => setActualQty(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '1.5rem', height: '60px', textAlign: 'center' }}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ height: '60px', padding: '0 40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check /> Подтвердить
                  </button>
                  <button type="button" onClick={() => setScannedBatch(null)} className="btn-secondary" style={{ height: '60px' }}>Отмена</button>
                </form>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Результаты аудита</h3>
            {(!activeAudit.results || activeAudit.results.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>Пока ничего не проверено</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Локация</th>
                    <th>Партия</th>
                    <th>Ожидалось</th>
                    <th>Факт</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activeAudit.results].reverse().map(r => (
                    <tr key={r.id}>
                      <td>{r.location_id}</td>
                      <td style={{ fontFamily: 'monospace' }}>Партия #{r.batch_id}</td>
                      <td>{r.expected_quantity}</td>
                      <td style={{ fontWeight: 'bold' }}>{r.actual_quantity}</td>
                      <td>
                        <span style={{ 
                          color: r.status === 'Match' ? 'var(--success)' : 'var(--danger)',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          {r.status === 'Match' ? <Check size={14} /> : <AlertTriangle size={14} />}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* Create Audit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '32px', position: 'relative' }}>
            <button className="btn-icon" onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Начать инвентаризацию</h2>
            
            <form onSubmit={handleCreateAudit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Название инвентаризации *</label>
                <input 
                  type="text" 
                  value={newAuditName} 
                  onChange={(e) => setNewAuditName(e.target.value)} 
                  required 
                  autoFocus
                  placeholder="Например: Месячный аудит Зоны А" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
                  {isSubmitting ? 'Создание...' : 'Начать'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmitting} style={{ flex: 1 }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
