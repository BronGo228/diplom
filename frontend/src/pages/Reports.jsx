import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PieChart, Activity, Box, TrendingUp, Download, Calendar } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function Reports() {
  const [stats, setStats] = useState({ totalStock: 0, deficitItems: 0 });
  const [chartData, setChartData] = useState([]);
  
  const [rawTransactions, setRawTransactions] = useState([]);
  const [periodTransactions, setPeriodTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [timeRange, setTimeRange] = useState(7); // 7, 30

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, transRes] = await Promise.all([
          axios.get('http://localhost:8000/components/stock'),
          axios.get('http://localhost:8000/transactions/?limit=5000') // Fetch enough to cover 30 days
        ]);
        
        const stockData = stockRes.data;
        const totalItems = stockData.reduce((sum, item) => sum + item.total_quantity, 0);
        const deficit = stockData.filter(item => item.total_quantity <= 15).length;
        setStats({ totalStock: totalItems, deficitItems: deficit });
        
        setRawTransactions(transRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!rawTransactions) return;

    const daily = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Create Date framework for exact range
    const daysArray = Array.from({length: timeRange}, (_, i) => {
       const d = new Date(today);
       d.setDate(d.getDate() - (timeRange - 1 - i));
       return d.toLocaleDateString('ru-RU');
    });
    
    daysArray.forEach(d => { daily[d] = { date: d, IN: 0, OUT: 0, AUDIT: 0 }; });

    const cutoffTimestamp = new Date(today);
    cutoffTimestamp.setDate(cutoffTimestamp.getDate() - timeRange);

    const filteredTx = [];

    rawTransactions.forEach(tx => {
       const txDate = new Date(tx.timestamp);
       if (txDate >= cutoffTimestamp && txDate <= today) {
           filteredTx.push(tx);
           const d = txDate.toLocaleDateString('ru-RU');
           if (daily[d]) {
             if(tx.transaction_type === 'IN') daily[d].IN += tx.quantity;
             else if(tx.transaction_type === 'OUT') daily[d].OUT += tx.quantity;
             else daily[d].AUDIT += tx.quantity;
           }
       }
    });
    
    setChartData(Object.values(daily));
    setPeriodTransactions(filteredTx);
    
  }, [rawTransactions, timeRange]);

  const handleExportCSV = () => {
    if (!rawTransactions || rawTransactions.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel cyrillic
    csvContent += "ID Транзакции,Дата,Тип операции,Кол-во (шт),ID Партии,Заметка\n";
    
    rawTransactions.forEach(tx => {
        const date = new Date(tx.timestamp).toLocaleString('ru-RU').replace(',', '');
        const type = tx.transaction_type === "IN" ? "Приход" : (tx.transaction_type === "OUT" ? "Расход" : "Аудит");
        const qty = tx.quantity;
        const batch = tx.batch_id;
        const notes = (tx.notes || '').replace(/,/g, ' '); // simple escape
        csvContent += `${tx.id},${date},${type},${qty},${batch},${notes}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `История_склада_${new Date().toLocaleDateString('ru-RU')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodTurnover = periodTransactions.reduce((sum, tx) => sum + tx.quantity, 0);

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
             <PieChart size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Аналитика и Отчеты</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '4px 0 0 0' }}>Сводка по движению компонентов и остаткам</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
           <div className="glass-panel" style={{ padding: '4px', display: 'flex', borderRadius: '12px' }}>
             <button onClick={() => setTimeRange(7)} style={{ padding: '8px 16px', border: 'none', background: timeRange === 7 ? 'var(--primary)' : 'transparent', color: timeRange === 7 ? '#fff' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>7 дней</button>
             <button onClick={() => setTimeRange(30)} style={{ padding: '8px 16px', border: 'none', background: timeRange === 30 ? 'var(--primary)' : 'transparent', color: timeRange === 30 ? '#fff' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>30 дней</button>
           </div>
           
           <button onClick={handleExportCSV} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', borderRadius: '12px' }} title="Сохранить полную историю">
             <Download size={18} /> Экспорт CSV
           </button>
        </div>
      </div>

      {loading ? (
         <LoadingState text="Сбор аналитики..." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
             <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '28px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ padding: '16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '16px' }}>
                  <Box size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 500 }}>Всего деталей на складе</p>
                  <h2 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800 }}>{stats.totalStock.toLocaleString('ru-RU')}</h2>
                </div>
             </div>
             
             <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '28px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ padding: '16px', background: '#fee2e2', color: '#dc2626', borderRadius: '16px' }}>
                  <TrendingUp size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 500 }}>Позиций в дефиците</p>
                  <h2 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800 }}>{stats.deficitItems}</h2>
                </div>
             </div>
             
             <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '28px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ padding: '16px', background: '#dbfafe', color: '#0891b2', borderRadius: '16px' }}>
                  <Activity size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 500 }}>Оборот за выбранный период ({timeRange}д)</p>
                  <h2 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800, color: '#0891b2' }}>{periodTurnover.toLocaleString('ru-RU')} <span style={{fontSize:'1rem'}}>шт.</span></h2>
                </div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display:'flex', alignItems:'center', gap:'8px' }}>
                   <Calendar size={18} color="var(--primary)"/> Динамика движений
                 </h3>
              </div>
              
              <div style={{ flex: 1, minHeight: '350px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                       <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} minTickGap={20} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                       <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)', color: '#fff' }} />
                       <Bar dataKey="IN" name="Приход" fill="#10b981" radius={[4, 4, 0, 0]} barSize={timeRange === 30 ? 6 : 16} />
                       <Bar dataKey="OUT" name="Расход" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={timeRange === 30 ? 6 : 16} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
               <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Недавние транзакции</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '400px', paddingRight: '8px' }}>
                 {rawTransactions.length > 0 ? rawTransactions.slice(0, 10).map(tx => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                       <div style={{ overflow: 'hidden' }}>
                         <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px', display:'flex', alignItems:'center', gap:'6px' }}>
                           {tx.transaction_type === 'IN' ? <span style={{color: '#10b981'}}>🔽 Приход</span> : tx.transaction_type === 'OUT' ? <span style={{color: '#f43f5e'}}>🔼 Расход</span> : <span style={{color: '#eab308'}}>🔄 Аудит</span>}
                         </div>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>
                           Batch #{tx.batch_id} • {new Date(tx.timestamp).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}
                         </div>
                       </div>
                       <div style={{ fontWeight: 700, fontSize: '1.1rem', color: tx.transaction_type === 'IN' ? '#10b981' : tx.transaction_type === 'OUT' ? '#f43f5e' : '#eab308' }}>
                         {tx.transaction_type === 'IN' ? '+' : tx.transaction_type === 'OUT' ? '-' : ''}{tx.quantity}
                       </div>
                    </div>
                 )) : (
                    <EmptyState title="Движений не найдено" />
                 )}
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
