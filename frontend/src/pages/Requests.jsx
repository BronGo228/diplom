import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { ClipboardList, Plus, Search, ChevronRight, X, User as UserIcon, Calendar, CheckSquare, Clock } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function Requests() {
  const user = useStore(state => state.user);
  const [requests, setRequests] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newReqItems, setNewReqItems] = useState([{ component_id: '', requested_quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqsRes, compRes] = await Promise.all([
        axios.get(`${API_URL}/requests/`),
        axios.get(`${API_URL}/components/`)
      ]);
      setRequests(reqsRes.data);
      setComponents(compRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    const validItems = newReqItems.filter(i => i.component_id && i.requested_quantity > 0);
    if (!validItems.length) {
      alert("Добавьте хотя бы один компонент в заявку.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id || 1,
        status: "PENDING",
        items: validItems.map(i => ({
          component_id: parseInt(i.component_id),
          requested_quantity: parseInt(i.requested_quantity)
        }))
      };

      await axios.post(`${API_URL}/requests/`, payload);
      setShowCreate(false);
      setNewReqItems([{ component_id: '', requested_quantity: 1 }]);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Ошибка создания заявки.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFulfill = async (reqId) => {
    try {
      await axios.post(`${API_URL}/requests/${reqId}/fulfill`);
      const res = await axios.get(`${API_URL}/requests/`);
      setRequests(res.data);
      // Update selected modal if open
      const updatedReq = res.data.find(r => r.id === reqId);
      if (updatedReq) setSelectedRequest(updatedReq);
    } catch (err) {
      console.error(err);
      alert("Ошибка при отгрузке заявки.");
    }
  };

  const addItemRow = () => setNewReqItems([...newReqItems, { component_id: '', requested_quantity: 1 }]);
  const updateItemRow = (index, field, value) => {
    const list = [...newReqItems];
    list[index][field] = value;
    setNewReqItems(list);
  };
  const removeItemRow = (index) => {
    const list = [...newReqItems];
    list.splice(index, 1);
    setNewReqItems(list);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList style={{ color: 'var(--primary)' }} />
            Заявки на сборку (BOM)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Управление заказами и отгрузкой со склада</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Новая заявка
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* LIST */}
        <div className="glass-panel" style={{ flex: '1 1 50%', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Все заявки</h3>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Заявок пока нет</div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: selectedRequest?.id === req.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = selectedRequest?.id === req.id ? 'rgba(255,255,255,0.05)' : 'transparent'}
                >
                  <div>
                     <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Заявка #{req.id}</span>
                     <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> {new Date(req.created_at).toLocaleDateString()}</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {req.status === 'PENDING' ? <Clock size={14} color="var(--warning)"/> : <CheckSquare size={14} color="var(--success)"/>}
                         <span style={{ color: req.status === 'PENDING' ? 'var(--warning)' : 'var(--success)' }}>
                           {req.status === 'PENDING' ? 'В ожидании' : req.status === 'PARTIAL' ? 'Частично' : 'Отгружено'}
                         </span>
                       </span>
                     </div>
                  </div>
                  <ChevronRight color="var(--text-secondary)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div style={{ flex: '1 1 50%' }}>
          {selectedRequest ? (
            <div className="glass-panel" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                   <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Заявка #{selectedRequest.id}</h2>
                   <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                     <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                     <span style={{ 
                        color: selectedRequest.status === 'PENDING' ? '#ffa502' : '#2ed573',
                        fontWeight: 'bold',
                        padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px'
                      }}>
                        {selectedRequest.status}
                     </span>
                   </div>
                </div>
                {selectedRequest.status !== 'FULFILLED' && (
                  <button onClick={() => handleFulfill(selectedRequest.id)} className="btn-primary" style={{ height: 'fit-content' }}>
                    Отгрузить (Fulfill)
                  </button>
                )}
              </div>

              <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Позиции спецификации:</h4>
              <table className="data-table" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr>
                    <th>Компонент</th>
                    <th>Требуется</th>
                    <th>Выдано</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items.map(item => {
                    const compName = item.component?.name || `ID ${item.component_id}`;
                    const isFullyIssued = item.issued_quantity >= item.requested_quantity;
                    const progress = Math.min((item.issued_quantity / item.requested_quantity) * 100, 100);

                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{compName}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.requested_quantity}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.issued_quantity}</td>
                        <td>
                          <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`, background: isFullyIssued ? 'var(--success)' : 'var(--warning)', borderRadius: '3px' }}/>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexDirection: 'column', gap: '16px' }}>
                <ClipboardList size={48} />
                <p>Выберите заявку для просмотра деталей</p>
             </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '600px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn-icon" onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}><X size={20} /></button>
            <h2 style={{ marginBottom: '24px' }}>Новая заявка (BOM)</h2>

            <form onSubmit={handleCreateRequest}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {newReqItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Компонент</label>
                      <select required value={item.component_id} onChange={e => updateItemRow(idx, 'component_id', e.target.value)} className="form-control">
                         <option value="">-- Выбор компонента --</option>
                         {components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group" style={{ width: '100px', marginBottom: 0 }}>
                      <label>Кол-во</label>
                      <input type="number" min="1" required value={item.requested_quantity} onChange={e => updateItemRow(idx, 'requested_quantity', e.target.value)} className="form-control" />
                    </div>
                    {newReqItems.length > 1 && (
                      <button type="button" className="btn-icon" onClick={() => removeItemRow(idx)} style={{ padding: '12px' }}>
                        <X size={18} color="var(--danger)"/>
                      </button>
                    )}
                  </div>
                ))}
                
                <button type="button" onClick={addItemRow} className="btn-secondary" style={{ padding: '10px', background: 'transparent', border: '1px dashed var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '8px' }}>
                  + Добавить позицию
                </button>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button type="button" onClick={() => setShowCreate(false)} className="btn-icon" style={{ padding: '0 20px', background: 'rgba(255,255,255,0.1)' }}>Отмена</button>
                 <button type="submit" className="btn-primary" disabled={isSubmitting}>
                   {isSubmitting ? 'Создание...' : 'Создать заявку'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
