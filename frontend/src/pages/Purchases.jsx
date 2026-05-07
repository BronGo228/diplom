import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, AlertTriangle, PackagePlus, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Purchases() {
  const user = useStore(state => state.user);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:8000/components/stock');
        // Filter items with stock <= 15
        const filtered = res.data.filter(item => item.total_quantity <= 15);
        setLowStockItems(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOrder = async (item) => {
    setOrderingId(item.component.id);
    try {
      // Create a request with generic order quantity (e.g. 50 units for restocking)
      const payload = {
        user_id: user?.id || 1,
        status: "PENDING",
        items: [{
          component_id: item.component.id,
          requested_quantity: 50 
        }]
      };
      await axios.post('http://localhost:8000/requests/', payload);
      alert(`Заявка на закупку "${item.component.name}" успешно создана!`);
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании заявки на закупку");
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
           <ShoppingCart size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Закупки и Дефицит</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '4px 0 0 0' }}>Мониторинг остатков и формирование заказов</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
         <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 4px 0', fontSize: '0.9rem' }}>Позиций в дефиците</p>
              <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{lowStockItems.length}</h2>
            </div>
         </div>
      </div>
      
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка дефицита...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Деталь / Компонент</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Остаток</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Статус</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Действие</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? lowStockItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{item.component.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.component.part_number || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: item.total_quantity === 0 ? '#dc2626' : '#d97706' }}>
                      {item.total_quantity} шт
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {item.total_quantity === 0 ? (
                      <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Нет на складе</span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Мало ({item.total_quantity})</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleOrder(item)}
                      disabled={orderingId === item.component.id}
                      style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
                    >
                      <PackagePlus size={16} /> {orderingId === item.component.id ? 'Заказ...' : 'Заказать'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Дефицита нет. Склад полон. 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
