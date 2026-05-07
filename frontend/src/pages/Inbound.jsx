import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCodeModule from 'react-qr-code';
import { useStore } from '../store/useStore';
import { PackagePlus, Printer, CheckCircle, Search, RefreshCw } from 'lucide-react';
import LoadingState from '../components/LoadingState';

const QRCode = QRCodeModule.QRCode || QRCodeModule;

const API_URL = 'http://localhost:8000';

export default function Inbound() {
  const user = useStore(state => state.user);
  
  const [components, setComponents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    component_id: '',
    location_id: '',
    quantity: '',
    packaging_type: 'Катушка (Reel)',
    supplier: '',
    lot_code: '',
    barcode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBatch, setSuccessBatch] = useState(null);
  
  const printRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, locRes] = await Promise.all([
        axios.get(`${API_URL}/components/`),
        axios.get(`${API_URL}/locations/`)
      ]);
      setComponents(compRes.data);
      setLocations(locRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.component_id || !formData.location_id || !formData.quantity) {
      alert("Укажите компонент, локацию и количество!");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedBarcode = formData.barcode.trim() || `BCH-${Date.now()}`;
      
      // 1. Create Batch with 0 quantity initially
      const batchPayload = {
        component_id: parseInt(formData.component_id),
        location_id: parseInt(formData.location_id),
        quantity: 0,
        supplier: formData.supplier,
        lot_code: formData.lot_code,
        packaging_type: formData.packaging_type,
        barcode: generatedBarcode
      };
      
      const batchRes = await axios.post(`${API_URL}/batches/`, batchPayload);
      const newBatch = batchRes.data;

      // 2. Register IN transaction
      const txPayload = {
        batch_id: newBatch.id,
        user_id: user?.id || 1,
        transaction_type: "IN",
        quantity: parseInt(formData.quantity),
        notes: "Первичная приемка партии"
      };
      
      await axios.post(`${API_URL}/transactions/`, txPayload);
      
      // Update batch object for display (since transaction updated the quantity on backend)
      newBatch.quantity = parseInt(formData.quantity);
      setSuccessBatch(newBatch);
      
      // Reset form (keep location and component for rapid entry if needed, but clear qty)
      setFormData(prev => ({
        ...prev,
        quantity: '',
        supplier: '',
        lot_code: '',
        barcode: ''
      }));

    } catch (err) {
      console.error("Ошибка при приемке:", err);
      alert("Не удалось создать партию. Проверьте консоль.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Печать этикетки</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }');
    printWindow.document.write('.label { border: 2px solid #000; padding: 20px; text-align: center; border-radius: 12px; width: 300px; }');
    printWindow.document.write('h2 { margin: 0 0 10px 0; font-size: 1.2rem; }');
    printWindow.document.write('p { margin: 5px 0; font-size: 0.9rem; }');
    printWindow.document.write('.qr-container { margin: 15px 0; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return <LoadingState text="Загрузка справочников..." />;
  }

  const selectedComp = components.find(c => c.id === parseInt(formData.component_id));

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={28} style={{ color: 'var(--primary)' }}/>
            Приемка партий
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Оприходование новых компонентов на склад и печать этикеток</p>
        </div>
        <button className="btn-icon" onClick={fetchData} title="Обновить справочники">
          <RefreshCw size={22} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* FORM */}
        <div className="glass-panel" style={{ flex: '1 1 600px', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="input-group">
                <label>Компонент *</label>
                <select name="component_id" value={formData.component_id} onChange={handleChange} required className="form-control">
                  <option value="">-- Выберите компонент --</option>
                  {components.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.part_number ? `(${c.part_number})` : ''}
                    </option>
                  ))}
                </select>
                {selectedComp && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Производитель: {selectedComp.manufacturer || 'Н/Д'}</p>}
              </div>

              <div className="input-group">
                <label>Локация (Ячейка) *</label>
                <select name="location_id" value={formData.location_id} onChange={handleChange} required className="form-control">
                  <option value="">-- Выберите ячейку --</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {[l.zone, l.row, l.rack, l.shelf, l.cell].filter(Boolean).join(' › ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="input-group">
                <label>Количество *</label>
                <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleChange} required className="form-control" placeholder="Например: 1000" />
              </div>
              <div className="input-group">
                <label>Тип упаковки</label>
                <select name="packaging_type" value={formData.packaging_type} onChange={handleChange} className="form-control">
                  <option value="Катушка (Reel)">Катушка (Reel)</option>
                  <option value="Лента (Cut Tape)">Лента (Cut Tape)</option>
                  <option value="Тьюб (Tube)">Тьюб (Tube)</option>
                  <option value="Матрица (Tray)">Матрица (Tray)</option>
                  <option value="Россыпь (Loose)">Россыпь (Loose)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="input-group">
                <label>Поставщик</label>
                <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className="form-control" placeholder="DigiKey, Mouser, LCSC..." />
              </div>
              <div className="input-group">
                <label>Код партии (Lot Code)</label>
                <input type="text" name="lot_code" value={formData.lot_code} onChange={handleChange} className="form-control" placeholder="Заводской номер партии" />
              </div>
            </div>

            <div className="input-group">
              <label>Свой Штрихкод (опционально)</label>
              <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="form-control" placeholder="Оставьте пустым для автогенерации" />
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '10px', height: '48px', fontSize: '1.05rem' }}>
              {isSubmitting ? 'Оформление...' : 'Принять на склад'}
            </button>
          </form>
        </div>

        {/* SUCCESS / PRINT AREA */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {successBatch ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--success)', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ color: 'var(--success)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={48} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '8px' }}>Партия успешно принята!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Партия #{successBatch.id} добавлена в систему. Печатайте этикетку для наклейки на упаковку.
              </p>

              {/* Hidden Print Wrapper */}
              <div ref={printRef} style={{ display: 'none' }}>
                <div className="label">
                  <h2>{components.find(c => c.id === successBatch.component_id)?.name}</h2>
                  <p>Part: <strong>{components.find(c => c.id === successBatch.component_id)?.part_number || 'N/A'}</strong></p>
                  <p>Qty: <strong>{successBatch.quantity}</strong> | Pkg: {successBatch.packaging_type}</p>
                  <p>Loc ID: {successBatch.location_id}</p>
                  <div className="qr-container">
                    <QRCode value={successBatch.barcode} size={150} level="M" />
                  </div>
                  <p style={{ fontSize: '0.8rem' }}>{successBatch.barcode}</p>
                  <p style={{ fontSize: '0.7rem' }}>Sys ID: #{successBatch.id}</p>
                </div>
              </div>

              {/* Visual Preview */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', display: 'inline-block', marginBottom: '24px', color: '#000' }}>
                <QRCode value={successBatch.barcode} size={120} level="M" />
                <p style={{ fontSize: '0.8rem', marginTop: '8px', fontFamily: 'monospace' }}>{successBatch.barcode}</p>
              </div>

              <div>
                <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                  <Printer size={18} /> Печать этикетки
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
              <Printer size={48} style={{ marginBottom: '16px', color: 'var(--text-secondary)' }} />
              <p>Здесь появится этикетка и QR-код<br/>после проведения приемки</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
