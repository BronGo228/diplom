import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCodeModule from 'react-qr-code';
import { Package, MapPin, Printer, Search, FileText } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const QRCode = QRCodeModule.QRCode || QRCodeModule;

const API_URL = 'http://localhost:8000';

export default function PrintLabels() {
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' or 'locations'
  const [batches, setBatches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Template to hold what we want to print
  const printRef = useRef(null);
  const [printData, setPrintData] = useState(null); // { type: 'batch'|'location', data: {} }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchRes, locRes] = await Promise.all([
        axios.get(`${API_URL}/batches/?limit=1000`),
        axios.get(`${API_URL}/locations/`)
      ]);
      setBatches(batchRes.data);
      setLocations(locRes.data);
    } catch (error) {
      console.error('Error fetching data for labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (type, data) => {
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (!printWindow) {
      alert("Пожалуйста, разрешите всплывающие окна в браузере для печати этикеток.");
      return;
    }

    setPrintData({ type, data });
    
    // setTimeout to allow React to render the printRef hidden div, then trigger window print
    setTimeout(() => {
      if (!printRef.current) return;
      const printContent = printRef.current.innerHTML;
      
      printWindow.document.write('<html><head><title>Печать этикетки</title>');
      printWindow.document.write('<style>');
      printWindow.document.write('body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }');
      printWindow.document.write('.label { border: 2px solid #000; padding: 20px; text-align: center; border-radius: 12px; width: 320px; display: flex; flexDirection: column; align-items: center; justify-content: center; background: #fff; color: #000; }');
      printWindow.document.write('h2 { margin: 0 0 10px 0; font-size: 1.2rem; word-break: break-all; }');
      printWindow.document.write('p { margin: 5px 0; font-size: 0.95rem; }');
      printWindow.document.write('.qr-container { margin: 15px 0; display: flex; justify-content: center; }');
      printWindow.document.write('.code-text { font-family: monospace; font-size: 0.9rem; margin-top: 5px; }');
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }, 100);
  };

  // Filter Data
  const filteredBatches = batches.filter(b => 
    (b.barcode && b.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.component?.name && b.component.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.component?.part_number && b.component.part_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLocations = locations.filter(l => 
    [l.zone, l.row, l.rack, l.shelf, l.cell].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tab Styles
  const tabStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 24px', cursor: 'pointer',
    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    border: 'none', borderRadius: '12px',
    fontWeight: 600, fontSize: '0.95rem',
    transition: '0.3s ease'
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #a855f7, #6b21a8)', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(168, 85, 247, 0.2)' }}>
           <Printer size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Печать этикеток</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '4px 0 0 0' }}>Генерация маркировки для партий и стеллажей</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('batches')} style={tabStyle(activeTab === 'batches')}>
          <Package size={18} /> Этикетки партий
        </button>
        <button onClick={() => setActiveTab('locations')} style={tabStyle(activeTab === 'locations')}>
          <MapPin size={18} /> Стеллажи и ячейки
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
         <div style={{ flex: 1, position: 'relative' }}>
           <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
           <input 
             type="text" 
             style={{ 
               padding: '10px 14px 10px 44px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', 
               borderRadius: '12px', color: '#f8f9fa', outline: 'none', width: '100%', boxSizing: 'border-box' 
             }} 
             placeholder={activeTab === 'batches' ? "Поиск партии по названию или штрихкоду..." : "Поиск по зоне, ряду или ячейке..."} 
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
           />
         </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <LoadingState text="Загрузка данных..." />
        ) : activeTab === 'batches' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Штрихкод / ID</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Компонент</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Упаковка</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.barcode || `BCH-${b.id}`}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Batch #{b.id}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                    {b.component?.name || 'Н/Д'}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{b.component?.part_number || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{b.packaging_type}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button className="btn-primary" onClick={() => handlePrint('batch', b)} style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                      <Printer size={16} /> Печать
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBatches.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 0 }}><EmptyState title="Партии не найдены" /></td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Локация</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>ID Ячейки</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="var(--primary)"/> 
                      {[l.zone, l.row, l.rack, l.shelf, l.cell].filter(Boolean).join(' › ')}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>LOC-{l.id}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button className="btn-primary" onClick={() => handlePrint('location', l)} style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                      <Printer size={16} /> Печать
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLocations.length === 0 && (
                <tr><td colSpan={3} style={{ padding: 0 }}><EmptyState title="Локации не найдены" /></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {printData?.type === 'batch' && (
            <div className="label">
              <h2>{printData.data.component?.name || 'Компонент'}</h2>
              <p>Штрихкод Партии</p>
              <div className="qr-container">
                <QRCode value={printData.data.barcode || `LOC-${printData.data.id}`} size={160} level="M" />
              </div>
              <p className="code-text">{printData.data.barcode}</p>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
                 ID: #{printData.data.id} | PN: {printData.data.component?.part_number || 'N/A'}
              </p>
            </div>
          )}
          {printData?.type === 'location' && (
            <div className="label">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <h2 style={{ fontSize: '1.4rem' }}>
                {[printData.data.zone, printData.data.row, printData.data.rack, printData.data.shelf, printData.data.cell].filter(Boolean).join(' › ')}
              </h2>
              <p>Ячейка (Стеллаж)</p>
              <div className="qr-container">
                {/* For Location, we generate a barcode string with LOC- prefix */}
                <QRCode value={`LOC-${printData.data.id}`} size={160} level="M" />
              </div>
              <p className="code-text">LOC-{printData.data.id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
