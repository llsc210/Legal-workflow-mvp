# Legal Workflow Automation MVP (Scaffold)

This is a beginner-friendly MVP web app for small legal firms managing receivership and post-judgment matters.

## 1) Proposed Tech Stack

For this first scaffold, we use:
- **HTML** for page structure
- **CSS** for clean professional styling
- **Vanilla JavaScript (ES Modules)** for logic and interactivity
- **LocalStorage** for lightweight in-browser persistence

Why this stack for the MVP:
- Very easy to run and understand for beginners.
- No backend setup required yet.
- Fast iteration before moving to React + API + database.

## 2) Folder Structure

```text
Legal-workflow-mvp/
├─ index.html          # Main dashboard page
├─ README.md           # Project explanation and roadmap
└─ src/
   ├─ app.js           # App logic (state, rendering, workflow updates)
   └─ styles.css       # Visual design/styles
```

## 3) MVP Features Implemented

- Create matters with:
  - client name
  - file number
  - court
  - county
  - case number
  - judge
  - status
  - important date
- Move matter through workflow stages:
  - intake
  - motion drafted
  - motion sent
  - motion filed
  - order pending
  - order signed
  - follow-up due
  - closed
- Add reminders and follow-up dates per matter.
- Dashboard sections:
  - all open matters
  - overdue follow-ups
  - matters waiting on signed orders (stage = order pending)
  - matters by court

## 4) Beginner Step-by-Step (What we built)

### Step A: Scaffold the app shell
We created a single-page layout with:
- Header
- Matter creation form
- Dashboard KPI cards
- Lists for each important queue

### Step B: Define workflow stages and data model
In `src/app.js`, we defined the legal workflow stages and a `matter` object shape, including reminders.

### Step C: Add matter creation
The form reads user inputs, builds a matter object, and stores it in memory + LocalStorage.

### Step D: Add dashboard rendering
We render:
- open matters
- overdue follow-ups
- order pending queue
- court-level summary counts

### Step E: Add stage movement and reminders
Each matter card has:
- a stage dropdown (updates workflow stage)
- reminder form (adds follow-up records)

## 5) How to Run

Because this is static HTML/CSS/JS, run with any static server.

### Option 1: Python server
```bash
python3 -m http.server 4173
```
Then open: `http://localhost:4173`

### Option 2: VS Code Live Server
Open the folder and run Live Server on `index.html`.

## 6) Next Steps (Suggested)

After validating this MVP with staff, move to:
1. **React + TypeScript** frontend
2. **Node/Express or FastAPI** backend
3. **PostgreSQL** database
4. Authentication + role permissions
5. Calendar integrations + email reminders
6. Audit log + document links

