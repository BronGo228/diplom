import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { ArrowRightLeft, Search, Plus, Edit, Trash2, CheckCircle, Save, X, RefreshCw, Printer, Check } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function Transfers() {
  const user = useStore(state => state.user);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit view
  const [editingDoc, setEditingDoc] = useState(null);
  const [items, setItems] = useState([]);
  const [componentsStock, setComponentsStock] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:8000/transfers/');
      setTransfers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [compRes, locRes, projRes] = await Promise.all([
        axios.get('http://localhost:8000/components/stock'),
        axios.get('http://localhost:8000/locations/'),
        axios.get('http://localhost:8000/projects/').catch(() => ({ data: [] }))
      ]);
      setComponentsStock(compRes.data);
      setLocations(locRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, []);

  const handleCreateNew = () => {
    const defaultFrom = locations.length > 0 ? locations[0].id : null;
    const defaultTo = locations.length > 1 ? locations[1].id : defaultFrom;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setEditingDoc({
      number: `TRN-${dateStr}-${randId}`,
      from_warehouse_id: defaultFrom,
      to_warehouse_id: defaultTo,
      project_id: null,
      comment: '',
      status: 'Draft',
      user_id: user.id
    });
    setItems([]);
  };

  const handleEdit = async (docId) => {
    try {
      const res = await axios.get(`http://localhost:8000/transfers/${docId}`);
      setEditingDoc(res.data);
      setItems(res.data.items);
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if(componentsStock.length === 0) return;
    setItems([...items, {
      component_id: componentsStock[0].component.id,
      quantity: 1,
      price: 0
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (editingDoc.from_warehouse_id === editingDoc.to_warehouse_id) {
       alert("Склад-источник и склад-получатель не могут совпадать.");
       return;
    }
    
    try {
      const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const payload = { ...editingDoc, total_amount, items };
      
      await axios.post('http://localhost:8000/transfers/', payload);
      setEditingDoc(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Ошибка при сохранении перемещения");
    }
  };

  const handlePost = async (id) => {
    if(!window.confirm("Провести перемещение? Товары будут перенесены между складами.")) return;
    try {
      await axios.post(`http://localhost:8000/transfers/${id}/post?user_id=${user.id}`);
      fetchData();
    } catch(err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
          alert("Ошибка проведения: " + err.response.data.detail);
      } else {
          alert("Ошибка при проведении перемещения");
      }
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const glassInputStyle = {
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#f8f9fa',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: '0.3s',
    colorScheme: 'dark'
  };

  const disabledInputStyle = {
    ...glassInputStyle,
    background: 'rgba(255,255,255,0.02)',
    color: '#a0a6b1',
    cursor: 'not-allowed'
  };

  const getStyle = (isDisabled, overrides = {}) => {
    return { ...(isDisabled ? disabledInputStyle : glassInputStyle), ...overrides };
  };

  const getLocationName = (id) => {
     const loc = locations.find(l => l.id === id);
     return loc ? `${loc.zone} ${loc.row ? `(Ряд: ${loc.row})` : ''}` : 'Неизвестно';
  };

  // VIEWS
  if (editingDoc) {
    const isPosted = editingDoc.status === 'Posted';
    return (
      <div style={{ padding: '32px', animation: 'fadeIn 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="btn-icon" onClick={() => setEditingDoc(null)}><X size={24} /></button>
              {editingDoc.id ? `Перемещение №${editingDoc.number}` : 'Новое перемещение'}
            </h1>
            {isPosted && <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem' }}>✓ Проведено</span>}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isPosted && (
              <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Save size={18} /> Сохранить
              </button>
            )}
            <button className="btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Printer size={18} /> Печать
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Со склада (Списание)</label>
              <select style={getStyle(isPosted)} value={editingDoc.from_warehouse_id || ''} onChange={e => setEditingDoc({...editingDoc, from_warehouse_id: parseInt(e.target.value)})} disabled={isPosted}>
                {locations.map(l => <option key={l.id} value={l.id} style={{background: '#1a1d24'}}>{l.zone} {l.row ? `(Ряд: ${l.row})` : ''}</option>)}
              </select>
            </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Проект</label>
               <select style={getStyle(isPosted)} value={editingDoc.project_id || ''} onChange={e => setEditingDoc({...editingDoc, project_id: parseInt(e.target.value) || null})} disabled={isPosted}>
                 <option value="">Без проекта</option>
                 {projects.map(p => <option key={p.id} value={p.id} style={{background: '#1a1d24'}}>{p.name}</option>)}
               </select>
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>На склад (Оприходование)</label>
              <select style={getStyle(isPosted)} value={editingDoc.to_warehouse_id || ''} onChange={e => setEditingDoc({...editingDoc, to_warehouse_id: parseInt(e.target.value)})} disabled={isPosted}>
                {locations.map(l => <option key={l.id} value={l.id} style={{background: '#1a1d24'}}>{l.zone} {l.row ? `(Ряд: ${l.row})` : ''}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
             <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Комментарий</label>
             <textarea style={getStyle(isPosted, { resize: 'vertical' })} rows={2} value={editingDoc.comment || ''} onChange={e => setEditingDoc({...editingDoc, comment: e.target.value})} disabled={isPosted} placeholder="Дополнительная информация к перемещению" />
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Позиции для переноса</h3>
            {!isPosted && (
              <button className="btn-secondary" onClick={handleAddItem} style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 12px' }}>
                <Plus size={16} /> Добавить позицию
              </button>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Наименование</th>
                <th style={{ padding: '12px 24px', textAlign: 'center', color: 'var(--text-secondary)', width: '130px' }}>Остаток (Всего)</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)', width: '120px' }}>Кол-во</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)', width: '140px' }}>Учетная Цена</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Сумма</th>
                {!isPosted && <th style={{ padding: '12px 24px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const stockInfo = componentsStock.find(c => c.component.id === item.component_id);
                const remaining = stockInfo ? stockInfo.total_quantity : 0;
                
                return (
                  <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      {isPosted ? (
                         <span>{stockInfo?.component.name || 'Неизвестно'}</span>
                      ) : (
                        <select style={getStyle(false)} value={item.component_id} onChange={e => updateItem(idx, 'component_id', parseInt(e.target.value))}>
                          {componentsStock.map(c => <option key={c.component.id} value={c.component.id} style={{background: '#1a1d24'}}>{c.component.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600, color: remaining < item.quantity ? '#ef4444' : 'var(--text-secondary)' }}>
                      {remaining}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <input type="number" style={getStyle(isPosted)} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} disabled={isPosted} min={1} max={isPosted ? undefined : remaining} />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <input type="number" style={getStyle(isPosted)} value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))} disabled={isPosted} min={0} step={0.01} />
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                      {(item.quantity * item.price).toFixed(2)} ₽
                    </td>
                    {!isPosted && (
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button className="btn-icon" onClick={() => removeItem(idx)} style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Нет позиций</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '24px', background: 'rgba(0,0,0,0.01)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '40px' }}>
             <h2 style={{ margin: 0, fontWeight: 500 }}>Итого:</h2>
             <h2 style={{ margin: 0, fontSize: '2rem' }}>{totalAmount.toFixed(2)} ₽</h2>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  const filtered = transfers.filter(r => r.number.toLowerCase().includes(searchTerm.toLowerCase()) || (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)' }}>
           <ArrowRightLeft size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Перемещения</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '4px 0 0 0' }}>Движение товаров между складами внутри организации</p>
        </div>
        <button className="btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 20px', borderRadius: '12px' }}>
          <Plus size={20} /> Создать перемещение
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
         <div style={{ flex: 1, position: 'relative' }}>
           <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
           <input type="text" style={getStyle(false, { paddingLeft: '44px' })} placeholder="Номер или комментарий поиска..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
      </div>
      
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <LoadingState text="Загрузка документов..." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>№ / Время</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Со склада</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>На склад</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Сумма</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Статус</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: r.status === 'Draft' ? 'rgba(244,63,94,0.02)' : 'transparent' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.number}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(r.created_at).toLocaleString('ru-RU')}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{getLocationName(r.from_warehouse_id)}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{getLocationName(r.to_warehouse_id)}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600 }}>{r.total_amount.toFixed(2)} ₽</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                     {r.status === 'Posted' ? (
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#166534', color: '#4ade80', border: '1px solid #14532d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                         <CheckCircle size={14} /> Проведено
                       </span>
                     ) : (
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                         Черновик
                       </span>
                     )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                       {r.status === 'Draft' && (
                         <button className="btn-secondary" onClick={() => handlePost(r.id)} title="Провести документ" style={{ color: '#10b981', padding: '6px' }}>
                           <Check size={18} />
                         </button>
                       )}
                       <button className="btn-secondary" onClick={() => handleEdit(r.id)} title={r.status === 'Posted' ? 'Просмотр' : 'Редактировать'} style={{ padding: '6px' }}>
                         {r.status === 'Posted' ? <RefreshCw size={18} /> : <Edit size={18} />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 0 }}><EmptyState title="Документы не найдены" /></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
