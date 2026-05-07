import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { ScanBarcode, MapPin, Hash, Package, ArrowRightToLine, ArrowLeftFromLine, X } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function GlobalScanner() {
  const user = useStore(state => state.user);
  const [scannedBatch, setScannedBatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Transaction states
  const [txType, setTxType] = useState('OUT');
  const [txQty, setTxQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner Buffer
  const [buffer, setBuffer] = useState('');
  const [lastTime, setLastTime] = useState(0);

  const handleGlobalKeyDown = useCallback((e) => {
    // If user is focused on an input or textarea, let them type normally
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT')) {
      return;
    }

    const currentTime = Date.now();
    
    // Scanners usually type characters < 50ms apart
    if (currentTime - lastTime > 100) {
      setBuffer('');
    }

    if (e.key === 'Enter' && buffer.length > 3) {
      e.preventDefault();
      handleScan(buffer);
      setBuffer('');
    } else if (e.key.length === 1) { // Normal character
      setBuffer(prev => prev + e.key);
    }
    
    setLastTime(currentTime);
  }, [buffer, lastTime]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  const handleScan = async (barcode) => {
    try {
      console.log('Scanned:', barcode);
      const res = await axios.get(`${API_URL}/batches/barcode/${barcode}`);
      if (res.data) {
        setScannedBatch(res.data);
        setTxQty(''); // Reset
        setTxType('OUT'); // Default to issue
        setModalOpen(true);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Maybe it's a component PN or something else. For now, we only support batches.
        console.warn(`Scan ignored: Barcode ${barcode} not found as Batch.`);
        // Could show a subtle toast here, but silence is often better for false positives
      } else {
        console.error('Scan error:', err);
      }
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!txQty || isNaN(txQty) || txQty <= 0) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        batch_id: scannedBatch.id,
        user_id: user?.id || 1, // Fallback if no user
        transaction_type: txType,
        quantity: parseInt(txQty),
        notes: "Отсканировано (Global Scanner)"
      };
      
      await axios.post(`${API_URL}/transactions/`, payload);
      
      // Update local state to reflect new quantity
      setScannedBatch(prev => ({
        ...prev,
        quantity: txType === 'IN' ? prev.quantity + parseInt(txQty) : prev.quantity - parseInt(txQty)
      }));
      setTxQty('');
      // We don't close modal so user can see updated quantity immediately
    } catch (err) {
      console.error(err);
      alert("Ошибка проводки транзакции.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!modalOpen || !scannedBatch) return null;

  const loc = scannedBatch.location;
  const comp = scannedBatch.component;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div className="glass-panel" style={{ width: '500px', padding: '32px', position: 'relative', border: '1px solid var(--accent)' }}>
        <button className="btn-icon" onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
            <ScanBarcode size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Партия найдена</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Штрихкод: {scannedBatch.barcode}</p>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{comp?.name}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Hash size={16}/> Партия ID</span>
              <span style={{ color: 'var(--text-primary)' }}>#{scannedBatch.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={16}/> Остаток</span>
              <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{scannedBatch.quantity} шт.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16}/> Локация</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {loc ? [loc.zone, loc.row, loc.rack, loc.shelf, loc.cell].filter(Boolean).join(' › ') : 'Н/Д'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleTransaction} style={{ display: 'flex', gap: '12px' }}>
          <div className="input-group" style={{ flex: '1', marginBottom: 0 }}>
            <select value={txType} onChange={e => setTxType(e.target.value)} className="form-control" style={{ fontSize: '0.95rem' }}>
              <option value="OUT">Выдача (OUT)</option>
              <option value="IN">Возврат (IN)</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: '1', marginBottom: 0 }}>
            <input type="number" min="1" max={txType === 'OUT' ? scannedBatch.quantity : undefined} value={txQty} onChange={e => setTxQty(e.target.value)} required placeholder="Кол-во" style={{ textAlign: 'center' }} />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting || scannedBatch.quantity === 0 && txType === 'OUT'} style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             {txType === 'OUT' ? <ArrowRightToLine size={18}/> : <ArrowLeftFromLine size={18}/>} Провести
          </button>
        </form>
      </div>
    </div>
  );
}
