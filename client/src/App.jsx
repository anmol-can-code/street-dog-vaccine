import { useEffect, useState, useCallback } from 'react'

const VACCINES = ['Rabies', 'DHPP (distemper, parvo)', 'Leptospirosis', 'Other']
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }

async function api(path, method = 'GET', body) {
  const res = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Uses the latest record of each vaccine to decide the dog's status
function statusOf(dog) {
  if (!dog.vaccinations.length) return 'Unvaccinated'
  const latest = {}
  ;[...dog.vaccinations].sort((a, b) => a.date.localeCompare(b.date)).forEach(v => { latest[v.vaccine] = v })
  const dues = Object.values(latest).map(v => v.nextDue).filter(Boolean)
  if (dues.some(d => d < today())) return 'Overdue'
  if (dues.some(d => d <= addDays(today(), 30))) return 'Due'
  return 'Protected'
}
const label = s => (s === 'Due' ? 'Due soon' : s)

function DogForm({ onClose, refresh }) {
  const [f, setF] = useState({ sex: 'Unknown', sterilized: false }), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = async e => { e.preventDefault(); try { await api('/dogs', 'POST', f); await refresh(); onClose() } catch (x) { setErr(x.message) } }
  return (
    <div className="modal"><form className="box" onSubmit={save}>
      <h2>Register a street dog</h2>
      <label>Name or tag (for example "Brownie" or "Tag 14")<input required onChange={set('name')} /></label>
      <label>Area or street where the dog lives<input required onChange={set('area')} /></label>
      <div className="two">
        <label>Sex<select onChange={set('sex')}><option>Unknown</option><option>Male</option><option>Female</option></select></label>
        <label>Approximate age<input placeholder="2 years" onChange={set('age')} /></label>
      </div>
      <label>Caretaker or feeder (optional)<input onChange={set('caretaker')} /></label>
      <label>Description or notes (color, marks, temperament)<textarea rows={2} onChange={set('notes')} /></label>
      <label><input type="checkbox" style={{ width: 'auto' }} onChange={set('sterilized')} /> Sterilized (ABC done)</label>
      {err && <p className="err">{err}</p>}
      <div className="row"><button>Save dog</button><button type="button" className="ghost" onClick={onClose}>Cancel</button></div>
    </form></div>
  )
}

function Detail({ dog, onClose, refresh }) {
  const [f, setF] = useState({ vaccine: 'Rabies', date: today(), nextDue: addDays(today(), 365) }), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const act = fn => async () => { try { await fn(); await refresh() } catch (x) { setErr(x.message) } }
  const add = async e => { e.preventDefault(); await act(() => api(`/dogs/${dog.id}/vaccinations`, 'POST', f))() }
  const s = statusOf(dog)
  return (
    <div className="modal" onClick={onClose}><div className="box" onClick={e => e.stopPropagation()}>
      <h2>{dog.name}<span className={'badge b-' + s}>{label(s)}</span></h2>
      <p>{dog.area} | {dog.sex}{dog.age && ', ' + dog.age} | {dog.sterilized ? 'Sterilized' : 'Not sterilized'}</p>
      {dog.caretaker && <p>Caretaker: {dog.caretaker}</p>}{dog.notes && <p>{dog.notes}</p>}
      <h3 style={{ marginTop: 16 }}>Vaccination history</h3>
      {!dog.vaccinations.length && <p className="empty">No vaccinations recorded yet. Add the first one below.</p>}
      {[...dog.vaccinations].sort((a, b) => b.date.localeCompare(a.date)).map(v => (
        <div className="rec" key={v.id}>
          <span><b>{v.vaccine}</b> on {v.date}{v.nextDue && ` (next due ${v.nextDue})`}{v.vet && <><br /><small>Vet: {v.vet}</small></>}</span>
          <button className="danger" onClick={act(() => api(`/dogs/${dog.id}/vaccinations/${v.id}`, 'DELETE'))}>Remove</button>
        </div>
      ))}
      <form onSubmit={add} style={{ marginTop: 16 }}>
        <h3>Record a vaccination</h3>
        <div className="two">
          <label>Vaccine<select value={f.vaccine} onChange={set('vaccine')}>{VACCINES.map(v => <option key={v}>{v}</option>)}</select></label>
          <label>Vet or volunteer<input onChange={set('vet')} /></label>
          <label>Date given<input type="date" required value={f.date} onChange={e => setF({ ...f, date: e.target.value, nextDue: addDays(e.target.value, 365) })} /></label>
          <label>Next due<input type="date" value={f.nextDue} onChange={set('nextDue')} /></label>
        </div>
        {err && <p className="err">{err}</p>}
        <div className="row"><button>Save vaccination</button>
          <button type="button" className="danger" onClick={act(async () => { if (!confirm('Delete this dog and all records?')) return; await api('/dogs/' + dog.id, 'DELETE'); onClose() })}>Delete dog</button>
          <button type="button" className="ghost" onClick={onClose}>Close</button></div>
      </form>
    </div></div>
  )
}

export default function App() {
  const [dogs, setDogs] = useState([]), [q, setQ] = useState(''), [st, setSt] = useState('All'), [area, setArea] = useState('All')
  const [sel, setSel] = useState(null), [adding, setAdding] = useState(false), [loadErr, setLoadErr] = useState('')
  const load = useCallback(() => api('/dogs').then(d => { setDogs(d); setLoadErr('') }).catch(() => setLoadErr('Cannot reach the server. Start it with "npm run dev" in the server folder.')), [])
  useEffect(() => { load() }, [load])
  const areas = [...new Set(dogs.map(d => d.area))].sort()
  const count = s => dogs.filter(d => statusOf(d) === s).length
  const shown = dogs.filter(d => (st === 'All' || statusOf(d) === st) && (area === 'All' || d.area === area) &&
    (d.name + d.area).toLowerCase().includes(q.toLowerCase()))
  const dog = dogs.find(d => d.id === sel)
  return (
    <>
      <header><h1>Street Dog Vaccine Tracker</h1><button style={{ background: '#ffc94d', color: '#14213d', borderColor: '#ffc94d' }} onClick={() => setAdding(true)}>Register a dog</button></header>
      <main>
        {loadErr && <p className="err">{loadErr}</p>}
        <div className="stats">
          <div className="stat">Dogs registered<b>{dogs.length}</b></div>
          <div className="stat ok">Protected<b>{count('Protected')}</b></div>
          <div className="stat warn">Due within 30 days<b>{count('Due')}</b></div>
          <div className="stat bad">Overdue<b>{count('Overdue')}</b></div>
          <div className="stat">Not vaccinated<b>{count('Unvaccinated')}</b></div>
        </div>
        <div className="filters">
          <input placeholder="Search by name or area" aria-label="Search" value={q} onChange={e => setQ(e.target.value)} />
          <select aria-label="Filter by status" value={st} onChange={e => setSt(e.target.value)}>
            <option value="All">All statuses</option><option value="Overdue">Overdue</option><option value="Due">Due soon</option><option value="Unvaccinated">Unvaccinated</option><option value="Protected">Protected</option></select>
          <select aria-label="Filter by area" value={area} onChange={e => setArea(e.target.value)}><option value="All">All areas</option>{areas.map(a => <option key={a}>{a}</option>)}</select>
        </div>
        {!shown.length && <p className="empty">{dogs.length ? 'No dogs match these filters.' : 'No dogs registered yet. Click "Register a dog" to add the first one.'}</p>}
        {shown.map(d => { const s = statusOf(d); return (
          <div className="card" key={d.id}>
            <div><h3>{d.name}<span className={'badge b-' + s}>{label(s)}</span></h3><p>{d.area} | {d.vaccinations.length} vaccination record(s)</p></div>
            <button className="ghost" onClick={() => setSel(d.id)}>Open</button>
          </div>) })}
      </main>
      {adding && <DogForm onClose={() => setAdding(false)} refresh={load} />}
      {dog && <Detail dog={dog} onClose={() => setSel(null)} refresh={load} />}
    </>
  )
}
