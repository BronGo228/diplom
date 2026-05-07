import React from 'react';
import { FolderSearch, AlertTriangle } from 'lucide-react';

export default function EmptyState({ isError = false, message, title }) {
  const Icon = isError ? AlertTriangle : FolderSearch;
  const defaultTitle = isError ? 'Ошибка загрузки' : 'Нет данных';
  const defaultMessage = isError ? 'Не удалось получить данные с сервера. Пожалуйста, проверьте подключение или обратитесь к администратору.' : 'По вашему запросу ничего не найдено или список пуст.';
  const iconColor = isError ? 'var(--danger)' : 'var(--text-secondary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ background: isError ? 'rgba(255, 71, 87, 0.1)' : 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
        <Icon size={48} color={iconColor} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title || defaultTitle}</h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.5' }}>{message || defaultMessage}</p>
    </div>
  );
}
