# Street Dog Vaccine Tracker (MERN, no database)

A simple tool for animal-welfare volunteers to register street dogs, record vaccinations, and see which dogs are due or overdue.

**Stack:** React (Vite) | Node.js + Express | data saved in a JSON file (no MongoDB needed)

## Features
- Register dogs with name or tag, area, sex, age, caretaker, notes and sterilization status
- Record vaccinations (rabies, DHPP, leptospirosis, other) with date, vet and next due date
- Automatic status: Protected, Due soon (within 30 days), Overdue, Not vaccinated
- Dashboard counts, search, and filters by status and area
- Remove a vaccination record or delete a dog

## Run locally (Node 18+)
```bash
# terminal 1 - API
cd server && npm install && npm run dev

# terminal 2 - UI
cd client && npm install && npm run dev
```
Open http://localhost:5173

Data is stored in `server/data.json`, created automatically on first save.

## API
| Method | Route | Purpose |
|---|---|---|
| GET/POST | /api/dogs | List / register dogs |
| DELETE | /api/dogs/:id | Delete a dog |
| POST | /api/dogs/:id/vaccinations | Add a vaccination |
| DELETE | /api/dogs/:id/vaccinations/:vid | Remove a vaccination |

## Next steps
Login for volunteers, photos, map view, SMS or email reminders, MongoDB storage.
