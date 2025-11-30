let currentFilter = 'all';
let editingTaskId = null;

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    setupEventListeners();
});

// 設定事件監聽
function setupEventListeners() {
    // 新增任務表單
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    
    // 篩選按鈕
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            loadTasks();
        });
    });
    
    // 編輯表單
    document.getElementById('editForm').addEventListener('submit', handleEditTask);
    
    // 點擊Modal外部關閉
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
}

// 載入任務列表
async function loadTasks() {
    console.log('載入任務列表,篩選條件:', currentFilter);
    try {
        const response = await fetch(`/api/tasks?status=${currentFilter}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const tasks = await response.json();
        console.log('載入到的任務:', tasks);
        
        renderTasks(tasks);
        updateStats(tasks);
    } catch (error) {
        console.error('載入任務失敗:', error);
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = `
            <div class="empty-state">
                <h3 style="color: #e74c3c;">⚠️ 載入失敗</h3>
                <p>無法連接到伺服器</p>
                <p style="font-size: 0.9em; color: #999;">錯誤: ${error.message}</p>
                <p style="font-size: 0.9em; color: #999;">請確認伺服器是否正在運行</p>
            </div>
        `;
    }
}

// 渲染任務列表
function renderTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3>還沒有任務</h3>
                <p>新增第一個待辦事項開始吧!</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.status} priority-${task.priority}">
            <input type="checkbox" 
                   class="task-checkbox" 
                   ${task.status === 'completed' ? 'checked' : ''}
                   onchange="toggleTask(${task.id})">
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="priority-badge priority-${task.priority}">
                        ${getPriorityText(task.priority)}
                    </span>
                    <span>📅 ${formatDate(task.created_at)}</span>
                    ${task.completed_at ? `<span>✓ ${formatDate(task.completed_at)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-small btn-edit" onclick="openEditModal(${task.id})">編輯</button>
                <button class="btn-small btn-delete" onclick="deleteTask(${task.id})">刪除</button>
            </div>
        </div>
    `).join('');
}

// 更新統計資訊
async function updateStats(currentTasks = null) {
    try {
        let allTasks = currentTasks;
        if (!allTasks || currentFilter !== 'all') {
            const response = await fetch('/api/tasks?status=all');
            allTasks = await response.json();
        }
        
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completedTasks').textContent = completed;
    } catch (error) {
        console.error('更新統計失敗:', error);
    }
}

// 新增任務
async function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    
    if (!title) {
        alert('請輸入任務標題');
        return;
    }
    
    console.log('正在新增任務:', { title, description, priority });
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                priority
            })
        });
        
        console.log('伺服器回應狀態:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('新增成功:', result);
            document.getElementById('taskForm').reset();
            await loadTasks();
            alert('任務新增成功!');
        } else {
            const errorText = await response.text();
            console.error('伺服器錯誤:', errorText);
            alert(`新增失敗: ${response.status} ${errorText}`);
        }
    } catch (error) {
        console.error('新增任務失敗:', error);
        alert('新增任務失敗,請確認伺服器是否正在運行\n錯誤: ' + error.message);
    }
}

// 切換任務完成狀態
async function toggleTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/toggle`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('切換狀態失敗:', error);
    }
}

// 開啟編輯Modal
async function openEditModal(taskId) {
    editingTaskId = taskId;
    
    try {
        const response = await fetch(`/api/tasks?status=all`);
        const tasks = await response.json();
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDescription').value = task.description || '';
            document.getElementById('editPriority').value = task.priority;
            document.getElementById('editStatus').value = task.status;
            
            document.getElementById('editModal').classList.add('active');
        }
    } catch (error) {
        console.error('載入任務資料失敗:', error);
    }
}

// 關閉編輯Modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingTaskId = null;
}

// 處理編輯任務
async function handleEditTask(e) {
    e.preventDefault();
    
    if (!editingTaskId) return;
    
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const priority = document.getElementById('editPriority').value;
    const status = document.getElementById('editStatus').value;
    
    try {
        const response = await fetch(`/api/tasks/${editingTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                status
            })
        });
        
        if (response.ok) {
            closeEditModal();
            loadTasks();
        }
    } catch (error) {
        console.error('更新任務失敗:', error);
        alert('更新任務失敗,請稍後再試');
    }
}

// 刪除任務
async function deleteTask(taskId) {
    if (!confirm('確定要刪除這個任務嗎?')) return;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('刪除任務失敗:', error);
        alert('刪除任務失敗,請稍後再試');
    }
}

// 工具函數:HTML轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 工具函數:格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays < 7) {
        return diffDays + ' 天前';
    } else {
        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }
}

// 工具函數:取得優先級文字
function getPriorityText(priority) {
    const priorityMap = {
        'low': '低優先',
        'medium': '中優先',
        'high': '高優先'
    };
    return priorityMap[priority] || priority;
}
