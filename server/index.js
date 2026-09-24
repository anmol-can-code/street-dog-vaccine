import express from 'express'
import cors from 'cors'
import fs from 'fs'
import { randomUUID } from 'crypto'

// Data is saved in server/data.json, so no database is needed.
const FILE = new URL('./data.json', import.meta.url)
const load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [])
const save = dogs => fs.writeFileSync(FILE, JSON.stringify(dogs, null, 2))

const app = express()
app.use(cors(), express.json())

const find = (dogs, id) => dogs.find(d => d.id === id)
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg })

app.get('/api/dogs', (_, res) => res.json(load()))

app.post('/api/dogs', (req, res) => {
  const { name, area, sex, age, sterilized, caretaker, notes } = req.body
  if (!name?.trim() || !area?.trim()) return bad(res, 'Name and area are required')
  const dogs = load()
  const dog = { id: randomUUID(), name: name.trim(), area: area.trim(), sex: sex || 'Unknown', age: age || '',
    sterilized: !!sterilized, caretaker: caretaker || '', notes: notes || '', vaccinations: [], createdAt: new Date().toISOString() }
  dogs.push(dog); save(dogs); res.json(dog)
})

app.delete('/api/dogs/:id', (req, res) => {
  save(load().filter(d => d.id !== req.params.id)); res.json({ ok: true })
})

app.post('/api/dogs/:id/vaccinations', (req, res) => {
  const { vaccine, date, nextDue, vet, notes } = req.body
  if (!vaccine || !date) return bad(res, 'Vaccine and date are required')
  const dogs = load(), dog = find(dogs, req.params.id)
  if (!dog) return bad(res, 'Dog not found', 404)
  dog.vaccinations.push({ id: randomUUID(), vaccine, date, nextDue: nextDue || '', vet: vet || '', notes: notes || '' })
  save(dogs); res.json(dog)
})

app.delete('/api/dogs/:id/vaccinations/:vid', (req, res) => {
  const dogs = load(), dog = find(dogs, req.params.id)
  if (!dog) return bad(res, 'Dog not found', 404)
  dog.vaccinations = dog.vaccinations.filter(v => v.id !== req.params.vid)
  save(dogs); res.json(dog)
})

app.listen(5000, () => console.log('API running on port 5000'))
