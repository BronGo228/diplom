import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Edit2, Link as LinkIcon, X } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const API_URL = 'http://localhost:8000';

export default function Inventory() {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    description: '',
    manufacturer: '',
    category_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search logic
  const [searchParams] = useSearchParams();
  const searchStr = searchParams.get('search') || '';

  const filteredComponents = components.filter(c => {
    if (!searchStr) return true;
    const lowerSearch = searchStr.toLowerCase();
    return c.name.toLowerCase().includes(lowerSearch) || 
           (c.part_number && c.part_number.toLowerCase().includes(lowerSearch)) ||
           (c.manufacturer && c.manufacturer.toLowerCase().includes(lowerSearch));
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/components/`),
        axios.get(`${API_URL}/categories/`)
      ]);
      setComponents(compRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.category_id) {
        payload.category_id = parseInt(payload.category_id);
      } else {
        delete payload.category_id;
      }

      await axios.post(`${API_URL}/components/`, payload);
      setShowModal(false);
      setFormData({ name: '', part_number: '', description: '', manufacturer: '', category_id: '' });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error creating component", error);
      alert("Ошибка при создании компонента.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px' }}>Номенклатура</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Все зарегистрированные радиокомпоненты и аналоги</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Добавить Компонент
        </button>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <LoadingState />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Наименование</th>
                <th>Партномер (PN)</th>
                <th>Категория</th>
                <th>Производитель</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 0 }}>
                    <EmptyState message={searchStr ? `Ничего не найдено по запросу "${searchStr}"` : 'Нет записей'} />
                  </td>
                </tr>
              ) : (
                filteredComponents.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td style={{ color: 'var(--accent)' }}>{c.part_number || 'Н/Д'}</td>
                    <td>{c.category?.name || 'Без категории'}</td>
                    <td>{c.manufacturer || 'Н/Д'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" title="Редактировать"><Edit2 size={16} /></button>
                        <button className="btn-icon" title="Аналоги"><LinkIcon size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '500px', padding: '32px', position: 'relative' }}>
            <button className="btn-icon" onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Новый компонент</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Наименование *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Например: МЛТ-0.125 10кОм" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Партномер (PN)</label>
                  <input type="text" name="part_number" value={formData.part_number} onChange={handleInputChange} placeholder="ERJ-3G..." />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Производитель</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} placeholder="Panasonic, Yageo..." />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Категория</label>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                  <option value="">-- Без категории --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Описание / Notes</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Дополнительная информация" />
              </div>

              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                {isSubmitting ? 'Сохранение...' : 'Создать компонент'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
