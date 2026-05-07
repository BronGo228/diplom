import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, MapPin, ChevronRight, ChevronDown, Layers, Box, Hash } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const API_URL = 'http://localhost:8000';

// Recursive Tree Node Component
const TreeNode = ({ name, type, children, location, selectedId, onSelect, expandedNodes, toggleNode, path }) => {
  const isExpanded = expandedNodes[path];
  const isLeaf = !children || Object.keys(children).length === 0;
  const isLoc = location !== undefined;
  const isSelected = isLoc && selectedId === location.id;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isLeaf) toggleNode(path);
    if (isLoc) onSelect(location);
  };

  const getIcon = () => {
    switch(type) {
      case 'zone': return <MapPin size={16} />;
      case 'row': return <Layers size={16} />;
      case 'rack': return <Box size={16} />;
      case 'shelf': return <Layers size={14} />;
      case 'cell': return <Hash size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  return (
    <div style={{ marginLeft: type === 'zone' ? '0' : '16px', marginTop: '4px' }}>
      <div 
        onClick={handleToggle}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px 12px', 
          cursor: 'pointer',
          borderRadius: '8px',
          background: isSelected ? 'var(--primary-light)' : 'transparent',
          color: isSelected ? 'var(--primary)' : 'inherit',
          transition: 'all 0.2s ease',
          border: isSelected ? '1px solid var(--primary)' : '1px solid transparent'
        }}
        className="tree-node-hover"
      >
        <span style={{ marginRight: '6px', opacity: 0.6, display: 'flex', alignItems: 'center' }}>
          {!isLeaf ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span style={{ width: 16 }}></span>}
        </span>
        <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center', opacity: 0.8 }}>
          {getIcon()}
        </span>
        <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.95rem' }}>
          {name}
        </span>
        {isLoc && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '12px' }}>ID: {location.id}</span>}
      </div>
      
      {isExpanded && !isLeaf && (
        <div style={{ borderLeft: '1px dashed var(--border-color)', marginLeft: '16px' }}>
          {Object.entries(children).map(([childName, childData]) => (
            childName !== '_loc' && (
              <TreeNode 
                key={`${path}-${childName}`}
                name={childName}
                type={childData.type}
                children={childData.children}
                location={childData._loc}
                selectedId={selectedId}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                path={`${path}-${childName}`}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default function LocationsMap() {
  const [locations, setLocations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locRes, batchRes] = await Promise.all([
        axios.get(`${API_URL}/locations/`),
        axios.get(`${API_URL}/batches/`)
      ]);
      setLocations(locRes.data);
      setBatches(batchRes.data);
      buildTree(locRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (locs) => {
    const tree = {};
    locs.forEach(loc => {
      const { zone, row, rack, shelf, cell } = loc;
      if (!zone) return;

      if (!tree[zone]) tree[zone] = { type: 'zone', children: {} };
      let current = tree[zone].children;
      
      const levels = [
        { key: row, type: 'row' },
        { key: rack, type: 'rack' },
        { key: shelf, type: 'shelf' },
        { key: cell, type: 'cell' }
      ];

      let lastValidLevel = tree[zone];

      levels.forEach(level => {
        if (level.key) {
          if (!current[level.key]) {
            current[level.key] = { type: level.type, children: {} };
          }
          lastValidLevel = current[level.key];
          current = current[level.key].children;
        }
      });

      lastValidLevel._loc = loc;
    });

    setTreeData(tree);
    
    // Auto-expand root zones
    const rootNodes = {};
    Object.keys(tree).forEach(zone => { rootNodes[zone] = true; });
    setExpandedNodes(rootNodes);
  };

  const toggleNode = (path) => {
    setExpandedNodes(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const selectedBatches = selectedLocation 
    ? batches.filter(b => b.location_id === selectedLocation.id)
    : [];

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px' }}>Карта Склада</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Трекинг ячеек и их содержимого</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left Panel: Tree */}
        <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600 }}>Локации</span>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <LoadingState text="Загрузка..." />
            ) : Object.keys(treeData).length === 0 ? (
              <EmptyState title="Локации не найдены" />
            ) : (
              Object.entries(treeData).map(([zoneName, zoneData]) => (
                <TreeNode 
                  key={zoneName}
                  name={`Зона ${zoneName}`}
                  type={zoneData.type}
                  children={zoneData.children}
                  location={zoneData._loc}
                  selectedId={selectedLocation?.id}
                  onSelect={setSelectedLocation}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  path={zoneName}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Content Detail */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedLocation ? (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={24} style={{ color: 'var(--primary)' }}/>
                      Ячейка {selectedLocation.cell || selectedLocation.shelf || selectedLocation.rack || selectedLocation.row || selectedLocation.zone}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {[selectedLocation.zone, selectedLocation.row, selectedLocation.rack, selectedLocation.shelf, selectedLocation.cell].filter(Boolean).join(' › ')}
                    </p>
                  </div>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                    ID: {selectedLocation.id}
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} /> Партии в локации ({selectedBatches.length})
                </h3>
                
                {selectedBatches.length === 0 ? (
                  <EmptyState title="В этой ячейке нет партий" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedBatches.map(batch => (
                      <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)', transition: 'transform 0.2s ease', cursor: 'default' }} className="batch-card-hover">
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {batch.component?.name || `Компонент #${batch.component_id}`}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', gap: '16px' }}>
                            <span>Упаковка: {batch.packaging_type}</span>
                            <span>{batch.supplier ? `Поставщик: ${batch.supplier}` : ''}</span>
                            <span>Лот: {batch.lot_code || 'Н/Д'}</span>
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-block', background: batch.quantity > 0 ? 'var(--success-light)' : 'var(--danger-light)', color: batch.quantity > 0 ? 'var(--success)' : 'var(--danger)', padding: '4px 12px', borderRadius: '16px', fontWeight: 700 }}>
                            {batch.quantity} шт.
                          </div>
                          {batch.barcode && <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '8px' }}>ШК: {batch.barcode}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              <MapPin size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '1.1rem' }}>Выберите локацию в дереве слева</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>чтобы увидеть её содержимое</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .tree-node-hover:hover {
          background: var(--bg-secondary) !important;
        }
        .batch-card-hover:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
