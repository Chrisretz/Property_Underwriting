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

```
property-underwriting/
├── frontend/          # Next.js (React + TypeScript)
├── backend/           # FastAPI (Python)
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn main:app --reload --port 8000
```

API runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:3000

### Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Recharts
- **Backend:** FastAPI, Python 3.11+
- **Database:** PostgreSQL (optional, for persistence)
