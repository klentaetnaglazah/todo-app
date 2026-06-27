let currentFilter = 'all'

document.addEventListener('DOMContentLoaded', function() {
    loadTodos()

    document.getElementById('addButton').addEventListener('click', addTodo)

    document.getElementById('titleInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTodo()
        }
    })

    document.getElementById('searchInput').addEventListener('input', function() {
        loadTodos()
    })

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter)
        })
    })
})

async function loadTodos() {
    const search = document.getElementById('searchInput').value
    const response = await fetch(`/api/todos?filter=${currentFilter}&search=${encodeURIComponent(search)}`)
    const todos = await response.json()
    renderTodos(todos)
}

async function addTodo() {
    const titleInput = document.getElementById('titleInput')
    const descInput = document.getElementById('descInput')
    const priorityInput = document.getElementById('priorityInput')

    const title = titleInput.value.trim()
    const description = descInput.value.trim()
    const priority = priorityInput.value

    if (!title) {
        alert('Введите название задачи')
        return
    }

    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, priority })
        })

        if (response.ok) {
            titleInput.value = ''
            descInput.value = ''
            priorityInput.value = 'medium'
            loadTodos()
        } else {
            const error = await response.json();
            alert(error.error || 'Ошибка при создании задачи')
        }
    } catch (error) {
        console.error('Error:', error)
        alert('Ошибка при создании задачи')
    }
}

async function toggleTodo(id, completed) {
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: completed ? 0 : 1 })
        })

        if (response.ok) {
            loadTodos()
        }
    } catch (error) {
        console.error('Error:', error)
    }
}

async function deleteTodo(id) {
    if (!confirm('Удалить задачу?')) {
        return
    }

    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE'
        })

        if (response.ok) {
            loadTodos()
        }
    } catch (error) {
        console.error('Error:', error)
    }
}

function renderTodos(todos) {
    const container = document.getElementById('todosList')

    if (todos.length === 0) {
        container.innerHTML = '<p class="empty-message">Нет задач</p>'
        return
    }

    container.innerHTML = todos.map(todo => {
        const priorityLabels = {
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        }

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" 
                       ${todo.completed ? 'checked' : ''} 
                       data-id="${todo.id}"
                       data-completed="${todo.completed}">
                <div class="todo-content">
                    <h3>${escapeHtml(todo.title)}</h3>
                    ${todo.description ? `<p>${escapeHtml(todo.description)}</p>` : ''}
                    <span class="priority priority-${todo.priority}">
                        ${priorityLabels[todo.priority] || todo.priority}
                    </span>
                </div>
                <button class="delete-btn" data-id="${todo.id}">Удалить</button>
            </div>
        `
    }).join('')

    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = this.dataset.id
            const completed = this.dataset.completed === 'true'
            toggleTodo(id, completed)
        })
    })

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id
            deleteTodo(id)
        })
    })
}

function setFilter(filter) {
    currentFilter = filter
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active')
        if (btn.dataset.filter === filter) {
            btn.classList.add('active')
        }
    })
    
    loadTodos()
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}
