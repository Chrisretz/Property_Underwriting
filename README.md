# Property Underwriting Platform

A web-based financial modeling application for property-level real estate investment analysis. Built with Next.js (frontend) and FastAPI (backend).

## Features

- **Deal setup** — Purchase price, hold period, acquisition costs
- **Income & expense modeling** — Rent, vacancy, rent growth, opex, inflation
- **Financing** — LTV, interest rate, IO/amortization
- **Cashflow engine** — Levered and unlevered projections
- **Investment metrics** — IRR, equity multiple, cash-on-cash, DSCR
- **Sensitivity analysis** — Exit yield vs rent growth
- **Interactive dashboard** — KPI cards, charts, visualizations
- **PDF export** — Investment memo generation

## Project Structure

```text
property-underwriting/
├── frontend/          # Next.js (React + TypeScript)
├── backend/           # FastAPI (Python)
└── README.md
```

## Quick Start

### One-command startup (recommended)

From the project root, start both backend and frontend together:

```bash
npm install
cd frontend && npm install && cd ..
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..

npm run dev
```

- **Backend** runs at <http://localhost:8001> (API docs: <http://localhost:8001/docs>)
- **Frontend** runs at <http://localhost:3000> (or 3001/3002 if ports are in use)

On Windows, use `npm run dev:backend` and `npm run dev:frontend` in separate terminals if `npm run dev` fails (venv path differs).

### Separate startup

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn main:app --reload --port 8001
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `frontend/.env.local` (already configured for port 8001):

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Recharts
- **Backend:** FastAPI, Python 3.11+
- **Database:** PostgreSQL (optional, for persistence)
