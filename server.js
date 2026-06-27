const fastify = require('fastify')({ logger: true })
const path = require('path')
const db = require('./database')

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public')
})

fastify.register(require('@fastify/cors'))

fastify.get('/api/todos', async (request, reply) => {
  const { filter, search } = request.query
  let query = 'SELECT * FROM todos'
  const params = []
  
  if (filter === 'active') {
    query += ' WHERE completed = 0'
  } else if (filter === 'completed') {
    query += ' WHERE completed = 1'
  }
  
  if (search) {
    query += (query.includes('WHERE') ? ' AND' : ' WHERE') + ' title LIKE ?'
    params.push(`%${search}%`)
  }
  
  query += ' ORDER BY created_at DESC'
  return db.prepare(query).all(...params)
})

fastify.post('/api/todos', async (request, reply) => {
  const { title, description, priority } = request.body
  const stmt = db.prepare('INSERT INTO todos (title, description, priority) VALUES (?, ?, ?)')
  const result = stmt.run(title, description || '', priority || 'medium')
  return { id: result.lastInsertRowid }
})

fastify.put('/api/todos/:id', async (request, reply) => {
  const { id } = request.params
  const { title, description, completed, priority } = request.body
  
  const stmt = db.prepare(`
    UPDATE todos 
    SET title = ?, description = ?, completed = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  
  stmt.run(title, description, completed, priority, id)
  return { success: true }
})

fastify.delete('/api/todos/:id', async (request, reply) => {
  const { id } = request.params
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return { success: true }
})

fastify.setNotFoundHandler((request, reply) => {
  return reply.sendFile('index.html')
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
