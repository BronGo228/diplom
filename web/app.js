const API_URL = "http://localhost:8000";

// --- Application State ---
const state = {
    user: null,
    currentView: 'dashboard',
    components: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Setup Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewName = e.currentTarget.dataset.view;
            switchView(viewName);
        });
    });

    // Check auth
    checkAuth();
});

// --- Auth Handling ---
function checkAuth() {
    const user = localStorage.getItem('radio_user');
    if (user) {
        state.user = JSON.parse(user);
        document.getElementById('current-username').textContent = state.user.username;
        document.getElementById('current-role').textContent = state.user.role || 'Пользователь';
        showApp();
    } else {
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    // In a real app with JWT, we'd POST to /token.
    // Here we simulate a successful login for our MVP.
    const mockUser = { id: 1, username: username, role: 'Кладовщик' };
    localStorage.setItem('radio_user', JSON.stringify(mockUser));
    state.user = mockUser;
    document.getElementById('current-username').textContent = mockUser.username;
    
    // Add micro-animation effect
    const btn = e.target.querySelector('.btn-primary');
    btn.textContent = 'Успешно...';
    btn.style.background = 'var(--success)';
    
    setTimeout(() => {
        showApp();
    }, 600);
}

function handleLogout() {
    localStorage.removeItem('radio_user');
    state.user = null;
    showLogin();
}

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    switchView('dashboard');
}

// --- View Router ---
function switchView(viewName) {
    state.currentView = viewName;
    
    // Update nav active state
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    // Render content
    const container = document.getElementById('view-container');
    const template = document.getElementById(`tpl-${viewName}`);
    
    if (template) {
        container.innerHTML = template.innerHTML;
        // View-specific initialization
        if (viewName === 'inventory') {
            loadComponents();
        }
    } else {
        container.innerHTML = `
            <div class="view-header">
                <h1>${viewName.charAt(0).toUpperCase() + viewName.slice(1)}</h1>
                <p>Этот модуль находится в разработке.</p>
            </div>
            <div class="glass-panel" style="padding: 40px; text-align: center;">
                <p style="color: var(--text-secondary)">Контент скоро появится...</p>
            </div>
        `;
    }
}

// --- API Calls & Data Reandering ---
async function loadComponents() {
    try {
        const response = await fetch(`${API_URL}/components/`);
        if (response.ok) {
            state.components = await response.json();
            renderComponentsTable(state.components);
        } else {
            console.error('Failed to load components');
        }
    } catch (err) {
        console.error('API Error:', err);
    }
}

function renderComponentsTable(components) {
    const tbody = document.getElementById('components-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (components.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Нет записей</td></tr>`;
        return;
    }
    
    components.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${c.id}</td>
            <td style="font-weight: 500">${c.name}</td>
            <td style="color: var(--accent)">${c.part_number || 'Н/Д'}</td>
            <td>${c.category?.name || 'Без категории'}</td>
            <td>${c.manufacturer || 'Н/Д'}</td>
            <td>
                <button class="btn-icon" title="Редактировать">✏️</button>
                <button class="btn-icon" title="Аналоги">🔗</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global App namespace for inline handlers
window.app = {
    showAddComponentModal: () => {
        alert("В будущей версии откроется красивое модальное окно добавления. API endpoint уже готов: POST /components/");
    }
};
