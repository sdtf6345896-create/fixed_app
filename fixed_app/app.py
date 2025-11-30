from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)

# 正確取得 SQLite 路徑（Render 必須這樣寫）
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "todo.db")

# 初始化資料庫
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# 獲取資料庫連接（加上 check_same_thread=False）
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = get_db()
    status = request.args.get('status', 'all')

    if status == 'all':
        tasks = conn.execute('SELECT * FROM tasks ORDER BY created_at DESC').fetchall()
    else:
        tasks = conn.execute(
            'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', 
            (status,)
        ).fetchall()
    conn.close()

    return jsonify([dict(task) for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    conn = get_db()

    c = conn.cursor()
    c.execute('''
        INSERT INTO tasks (title, description, priority)
        VALUES (?, ?, ?)
    ''', (data['title'], data.get('description', ''), data.get('priority', 'medium')))

    conn.commit()
    task_id = c.lastrowid
    conn.close()

    return jsonify({'id': task_id, 'message': '任務新增成功'}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    conn = get_db()

    completed_at = None
    if data.get('status') == 'completed':
        completed_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute('''
        UPDATE tasks
        SET title = ?, description = ?, status = ?, priority = ?, completed_at = ?
        WHERE id = ?
    ''', (data['title'], data.get('description', ''), data['status'],
          data.get('priority', 'medium'), completed_at, task_id))

    conn.commit()
    conn.close()

    return jsonify({'message': '任務更新成功'})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db()
    conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': '任務刪除成功'})

@app.route('/api/tasks/<int:task_id>/toggle', methods=['PATCH'])
def toggle_task(task_id):
    conn = get_db()
    task = conn.execute('SELECT status FROM tasks WHERE id = ?', (task_id,)).fetchone()

    if task:
        new_status = 'completed' if task['status'] == 'pending' else 'pending'
        completed_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S') if new_status == 'completed' else None

        conn.execute(
            'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
            (new_status, completed_at, task_id)
        )
        conn.commit()

    conn.close()
    return jsonify({'message': '狀態切換成功'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
