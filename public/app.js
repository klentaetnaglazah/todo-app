let currentFilter = 'all'

async function loadTodos() {
    const search = document.getElementById('searchInput').value
    const response = await fetch(`/api/todos?filter=${currentFilter}&search=${search}`)
    const todos = await response.json()
    renderTodos(todos)
}

async function addTodo() {
    const title = document.getElementById('titleInput').value
    const description = document.getElementById('descInput').value
    const priority = document.getElementById('priorityInput').value
    
    if (!title.trim()) return
    
    await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
    })
    
    document.getElementById('titleInput').value = ''
    document.getElementById('descInput').value = ''
    loadTodos()
}

async function toggleTodo(id, completed) {
    await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completed ? 0 : 1 })
    });
    loadTodos()
}

async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    loadTodos()
}

function renderTodos(todos) {
    const container = document.getElementById('todosList')
    container.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id}, ${todo.completed})">
            <div class="todo-content">
                <h3>${escapeHtml(todo.title)}</h3>
                ${todo.description ? `<p>${escapeHtml(todo.description)}</p>` : ''}
                <span class="priority priority-${todo.priority}">${todo.priority}</span>
            </div>
            <button onclick="deleteTodo(${todo.id})">Удалить</button>
        </div>
    `).join('')
}

function setFilter(filter) {
    currentFilter = filter
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active')
    })
    event.target.classList.add('active')
    loadTodos()
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

loadTodos()
