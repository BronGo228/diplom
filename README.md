Бронгулеев Даниил Дмитриевич

Студент группы - ИС-43

Сроки прохождения практики - 20.04.2026 по 17.05.2026

Тема преддипломной практики практики - Система аудита и учета склада радиоэлектронных компонентов
прога в ветке мастер 

---

##  Архитектура системы
- **Тип:** Клиент-Сервер (REST API)
- **Безопасность:** Система ролевого доступа на основе JWT-токенов (роли: Manager, WarehouseWorker, Sysadmin, Salesperson, Auditor).

### Frontend
- **Сборщик и Ядро:** Vite 8 + React 19.
- **Роутинг:** React Router DOM v7.
- **Глобальное состояние:** Zustand.
- **Взаимодействие с API:** Axios.
- **Дизайн:** Vanilla CSS.
- **Иконки и Графики:** Векторные иконки из библиотеки Lucide-React и библиотека интерактивных графиков Recharts (для системы отчетов).
- **Печать маркировки:** Интегрирован модуль React-QR-Code для генерации штрихкодов компонентов и ячеек.

### Backend
- **Язык и Фреймворк:** Python 3.14 + FastAPI.
- **Веб-сервер:** Uvicorn.
- **ORM:** SQLAlchemy.
- **Валидация данных:** Pydantic.
- **Аутентификация и криптография:** 
  - Хеширование паролей сделано через Passlib (bcrypt).
  - Авторизация реализована через JWT-токены (python-jose).
- **База данных:** SQLite.

---

##  Возможности программы
- **Управление пользователями:** Создание пользователей, назначение ролей и ограничение доступа к маршрутам.
- **Складской учет (Инвентарь):** Добавление, редактирование категорий и радиокомпонентов. Поддержка аналогов (замен).
- **Документооборот:** 
  - **Поступления (Inbound):** Оформление приходных накладных.
  - **Списания (Write-offs):** Оформление актов списания (брак, использование).
  - **Перемещения (Transfers):** Внутренние перемещения между ячейками и складами.
- **Складская топология:** Управление зонами, рядами, стеллажами и конкретными ячейками (генерация баркодов).
- **Аудит и инвентаризация:** Создание циклов инвентаризации, сканирование по штрихкоду/RFID для сверки ожидаемого и фактического количества.
- **Проектные сборки (BOM - Bill of Materials):** Создание спецификаций к проектам и формирование запросов на выдачу под конкретный проект.
- **Аналитика:** Визуальные графики и дашборды, отображающие остатки, движение товаров.
- **Печать этикеток:** Массовая генерация и вывод на печать QR/Штрих-кодов компонентов.

---

##  Структура проекта
```text
radio_inventory/
├── api/                   # Backend (FastAPI)
│   ├── main.py            # Точка входа в API и роуты
│   ├── models.py          # SQLAlchemy модели базы данных
│   ├── schemas.py         # Pydantic схемы валидации
│   ├── crud.py            # Функции работы с базой данных
│   ├── database.py        # Настройки подключения к БД
│   └── radio_inventory.db # Файл базы данных SQLite
│
├── frontend/              # Frontend (React 19)
│   ├── src/
│   │   ├── components/    # Переиспользуемые UI компоненты
│   │   ├── pages/         # Экраны и страницы приложения
│   │   └── store/         # Zustand глобальные стейты
│   └── package.json       # Зависимости фронтенда
│
├── start_system.bat       # Скрипт быстрого запуска всей системы
└── stop_system.bat        # Скрипт остановки сервисов
```

---

##  Структура базы данных и Модели
Система базируется на реляционной модели. Основные бизнес-сущности:

1. **User (Пользователь)** - хранит данные авторизации и роль.
2. **Component (Компонент)** - справочник радиодеталей (название, парт-номер, производитель).
3. **Category (Категория)** - группировка компонентов.
4. **Location (Локация)** - складская ячейка (зона, ряд, стеллаж).
5. **Batch (Партия)** - конкретная поставка компонента (кол-во, штрихкод, привязка к локации и компоненту).
6. **Transaction (Транзакция)** - лог любого движения партии (IN, OUT, RETURN).
7. **Документы:** `StockReceipt` (Приход), `StockWriteOff` (Списание), `StockTransfer` (Перемещение). Каждый документ имеет свои табличные части (`Items`).
8. **Project & BOM** - проекты и их спецификации материалов (Bill of Materials).
9. **AuditCycle & AuditResult** - циклы проведения инвентаризации и результаты сканирования ячеек.

### ER-диаграмма(упрощенная)
```mermaid
erDiagram
    USER ||--o{ REQUEST : makes
    USER ||--o{ AUDIT_CYCLE : conducts
    CATEGORY ||--o{ COMPONENT : groups
    COMPONENT ||--o{ BATCH : has
    COMPONENT ||--o{ COMPONENT_SUBSTITUTES : analogs
    LOCATION ||--o{ BATCH : stores
    BATCH ||--o{ TRANSACTION : tracks
    REQUEST ||--o{ TRANSACTION : generates
    PROJECT ||--o{ BOM : has
    BOM ||--o{ BOM_ITEM : requires
    STOCK_RECEIPT ||--o{ STOCK_RECEIPT_ITEM : contains
    STOCK_WRITE_OFF ||--o{ STOCK_WRITE_OFF_ITEM : contains
```

---

##  Краткий справочник API (Маршруты)

### Авторизация и Пользователи
- `POST /login/` — Авторизация и получение данных.
- `GET /users/`, `POST /users/` — Управление пользователями.
- `PUT /users/{user_id}/role` — Изменение роли.

### Справочники
- `GET/POST /categories/` — Управление категориями.
- `GET/POST /components/` — Управление номенклатурой радиодеталей.
- `GET /components/stock` — Получение списка компонентов с их текущими остатками.
- `GET/POST /locations/` — Управление складами и ячейками.

### Складской учет (Документы)
- `GET/POST /batches/` — Управление партиями компонентов (привязка к QR/RFID).
- `GET /batches/barcode/{barcode}` — Поиск партии по штрихкоду.
- `GET/POST /receipts/` — Приходные накладные.
- `POST /receipts/{id}/post` — Проведение прихода (зачисление на остатки).
- `GET/POST /write-offs/` — Акты списания.
- `GET/POST /transfers/` — Акты перемещения.
- `GET/POST /transactions/` — Просмотр истории движений.

### Проекты и Запросы (BOM)
- `POST /projects/`, `POST /boms/` — Создание проектов и спецификаций.
- `GET/POST /requests/` — Создание и просмотр заявок на выдачу под проект.
- `POST /requests/{id}/fulfill` — Подтверждение/выдача компонентов по заявке.

### Аудит
- `GET/POST /audits/` — Управление циклами инвентаризации.
- `POST /audits/{id}/scan` — Внесение фактических данных по отсканированной ячейке/партии.

---

##  Запуск и остановка системы

Для удобства развертывания проекта в корне предусмотрены скрипты:

- **Запуск всей системы (Frontend + Backend):** 
  Откройте терминал в корневой папке проекта и выполните `start_system.bat`
- **Остановка серверов:** 
  Выполните `stop_system.bat`

*Бэкенд по умолчанию запускается на порту `8000`, а фронтенд на порту по умолчанию Vite (обычно `5173`).*

---

## Скриншоты приложения

<img width="1920" height="946" alt="изображение" src="https://github.com/user-attachments/assets/6217d4fa-e80a-4ddf-8c39-f15c2ff93d7d" />
<img width="1920" height="950" alt="изображение" src="https://github.com/user-attachments/assets/bd85b731-bb52-4c94-90c6-6ceec93b825a" />
<img width="503" height="524" alt="изображение" src="https://github.com/user-attachments/assets/b397daea-f229-41f8-a8de-a855fbc8f7f8" />
<img width="1920" height="952" alt="изображение" src="https://github.com/user-attachments/assets/eabbe026-1aa0-40e9-8df4-4484a7e9e557" />
<img width="1919" height="955" alt="изображение" src="https://github.com/user-attachments/assets/62b972dd-0a62-4a14-b19d-04156faa161f" />
<img width="1920" height="956" alt="изображение" src="https://github.com/user-attachments/assets/777b43ce-16f9-4e1b-8c3d-4f03a1ba0c80" />
<img width="1920" height="961" alt="изображение" src="https://github.com/user-attachments/assets/a6c08e03-65f6-41a0-9695-50db46225d33" />
<img width="1920" height="961" alt="изображение" src="https://github.com/user-attachments/assets/c33d9399-940a-4c4e-8ece-7f68d53bda3a" />
<img width="1920" height="964" alt="изображение" src="https://github.com/user-attachments/assets/46782d6b-d65d-4a9e-8eef-390f4dcc791e" />
<img width="1920" height="958" alt="изображение" src="https://github.com/user-attachments/assets/4148e83e-a348-4ca5-9ff5-4189388a51d4" />
<img width="1920" height="958" alt="изображение" src="https://github.com/user-attachments/assets/7cc52bc4-a7ea-4d55-9e8d-233ba566fa74" />
<img width="1920" height="954" alt="изображение" src="https://github.com/user-attachments/assets/9f967cea-0f3a-4344-a00b-2fdf83150c7e" />
<img width="1920" height="954" alt="изображение" src="https://github.com/user-attachments/assets/bfa2ab90-1b49-4ef9-8e8c-a3a83bb00e04" />
