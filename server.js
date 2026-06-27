const fastify = require('fastify')({ logger: true })
const path = require('path')
const { getDatabase, saveDatabase } = require('./database')

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public')
})

fastify.register(require('@fastify/cors'))

fastify.get('/api/todos', async (request, reply) => {
  const db = await getDatabase()
  const { filter, search } = request.query
  let sql = 'SELECT * FROM todos'
  const params = []

  if (filter === 'active') {
    sql += ' WHERE completed = 0'
  } else if (filter === 'completed') {
    sql += ' WHERE completed = 1'
  }

  if (search) {
    sql += (sql.includes('WHERE') ? ' AND' : ' WHERE') + ' title LIKE ?'
    params.push(`%${search}%`)
  }

  sql += ' ORDER BY created_at DESC'

  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }

  const results = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    row.completed = Boolean(row.completed)
    results.push(row)
  }
  stmt.free()

  return results
})

fastify.get('/api/todos/:id', async (request, reply) => {
  const db = await getDatabase()
  const { id } = request.params

  const stmt = db.prepare('SELECT * FROM todos WHERE id = ?')
  stmt.bind([id])

  if (stmt.step()) {
    const todo = stmt.getAsObject()
    todo.completed = Boolean(todo.completed)
    stmt.free()
    return todo
  }

  stmt.free()
  reply.code(404).send({ error: 'Todo not found' })
})

fastify.post('/api/todos', async (request, reply) => {
  const db = await getDatabase()
  const { title, description, priority } = request.body

  if (!title || !title.trim()) {
    reply.code(400).send({ error: 'Title is required' })
    return
  }

  db.run(
    'INSERT INTO todos (title, description, priority) VALUES (?, ?, ?)',
    [title.trim(), description || '', priority || 'medium']
  )
  saveDatabase()

  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = result[0].values[0][0]

  reply.code(201).send({ 
    id, 
    title: title.trim(), 
    description: description || '', 
    priority: priority || 'medium',
    completed: false
  })
})

fastify.put('/api/todos/:id', async (request, reply) => {
  const db = await getDatabase()
  const { id } = request.params
  const { title, description, completed, priority } = request.body

  const checkStmt = db.prepare('SELECT * FROM todos WHERE id = ?')
  checkStmt.bind([id])

  if (!checkStmt.step()) {
    checkStmt.free()
    reply.code(404).send({ error: 'Todo not found' })
    return
  }

  const currentTodo = checkStmt.getAsObject()
  checkStmt.free()

  db.run(
    `UPDATE todos 
     SET title = ?, description = ?, completed = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      title !== undefined ? title : currentTodo.title,
      description !== undefined ? description : currentTodo.description,
      completed !== undefined ? (completed ? 1 : 0) : currentTodo.completed,
      priority !== undefined ? priority : currentTodo.priority,
      id
    ]
  )
  saveDatabase()

  return { success: true }
})

fastify.delete('/api/todos/:id', async (request, reply) => {
  const db = await getDatabase()
  const { id } = request.params

  db.run('DELETE FROM todos WHERE id = ?', [id])
  saveDatabase()
  
  return { success: true }
})

fastify.setNotFoundHandler((request, reply) => {
  return reply.sendFile('index.html')
})

const start = async () => {
  try {
    const port = process.env.PORT || 3000
    await fastify.listen({ port: port, host: '0.0.0.0' })
    console.log(`Server running on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
