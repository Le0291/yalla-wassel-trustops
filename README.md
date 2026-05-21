# Yalla Wassel TrustOps 🚚

> Smart delivery management for Amman, Jordan — **Accountability Without Surveillance**

---

## The Problem

A small same-day delivery business in Amman manages 6 drivers using WhatsApp messages and paper notes. The owner needs accountability but doesn't want to turn drivers into prisoners through live GPS tracking. She needs workload fairness, proof of delivery, and exception alerts — not a surveillance system.

## The Solution

Yalla Wassel TrustOps replaces WhatsApp chaos with a structured web app where:
- **Dispatchers** assign orders, monitor progress, and handle exceptions
- **Drivers** self-report milestones and submit proof of delivery
- **Customers** track their order with just an order number
- **No GPS tracking** — trust is built through transparency, not cameras

---

## Features

### Dispatcher Dashboard
- Overview stats (total, waiting, in-progress, delivered, urgent)
- Full orders table with search and filters
- Create new orders with all details
- Smart driver suggestion by zone and workload
- Driver roster with live status and workload metrics
- Alerts panel for issues and urgent unassigned orders
- Add dispatcher notes to orders
- Resolve reported issues and reassign orders

### Driver Mobile App
- Mobile-first, large touch targets
- Accept, pick up, and update delivery milestones
- Report issues with structured reasons (no free-text excuses)
- Confirm delivery with recipient name and notes
- Change own availability status (Available / On Break / Off Duty)

### Customer Tracking
- No login required — just the order number
- Live status with visual progress bar
- Driver first name and phone when assigned
- Full status timeline

### Reports
- Per-driver completion rates and issue counts
- Workload fairness score and balance metrics
- Today's delivery summary
- No location data anywhere

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + Inter font |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Icons | Lucide React |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via Prisma ORM) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Dev Runner | tsx (TypeScript hot-reload) |

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm 8+

### 1. Clone / open the project

```bash
cd yalla-wassel
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Set up the Database

```bash
npm run db:push    # creates the SQLite database from schema
npm run db:seed    # seeds demo data (drivers, orders, accounts)
```

### 4. Start the Backend

```bash
npm run dev
# API running at http://localhost:3001
```

### 5. Install Frontend Dependencies (new terminal)

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Dispatcher | dispatcher@yallawassel.com | password123 |
| Driver (Mahmoud) | mahmoud@yallawassel.com | password123 |
| Driver (Yousef) | yousef@yallawassel.com | password123 |
| Driver (Hamza) | hamza@yallawassel.com | password123 |
| Driver (Wael) | wael@yallawassel.com | password123 |
| Driver (Amjad) | amjad@yallawassel.com | password123 |
| Driver (Khaled) | khaled@yallawassel.com | password123 |

### Customer Tracking (no login)
Visit `/track` and enter any of these order numbers: **1001, 1002, 1003, 1004, 1005, 1006**

---

## Project Structure

```
yalla-wassel/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Demo data seeder
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.ts        # Login + /me
│   │   │   ├── orders.ts      # CRUD + assign + status + proof + issues
│   │   │   ├── drivers.ts     # List + suggest + status update
│   │   │   ├── reports.ts     # Performance metrics
│   │   │   └── track.ts       # Public order tracking
│   │   └── index.ts           # Express app entry
│   ├── .env                   # DATABASE_URL + JWT_SECRET
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   └── api.ts          # Axios client with auth interceptor
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── DispatcherLogin.tsx
│   │   │   ├── DriverLogin.tsx
│   │   │   ├── DispatcherDashboard.tsx
│   │   │   ├── DriverDashboard.tsx
│   │   │   ├── CustomerTracking.tsx
│   │   │   └── Reports.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts          # Proxies /api → localhost:3001
│
└── README.md
```

---

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/orders              ?status= &priority= &search=
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
PUT    /api/orders/:id/assign   { driverId }
PUT    /api/orders/:id/status   { status, note }
POST   /api/orders/:id/proof    { recipientName, notes }
POST   /api/orders/:id/issue    { reason, description }
PUT    /api/orders/:id/issue/:issueId/resolve

GET    /api/drivers
GET    /api/drivers/suggested   ?zone=
PUT    /api/drivers/:id/status  { driverStatus }

GET    /api/reports

GET    /api/track/:orderNumber  (public — no auth)
```

---

## Core Business Rules

- ✅ No GPS tracking, no location data stored
- ✅ Address is a plain text field only
- ✅ Drivers report their own status and milestones
- ✅ Accountability through proof of delivery (name + notes)
- ✅ Issue reporting requires structured reasons (not free text)
- ✅ Workload fairness visible to dispatcher
- ✅ Driver interface works well on mobile

---

## Future Improvements

- [ ] WhatsApp notifications via Twilio/WhatsApp Business API
- [ ] Photo upload for proof of delivery
- [ ] Arabic language support (bilingual)
- [ ] Estimated delivery time auto-calculation
- [ ] Weekly/monthly performance PDF reports
- [ ] Multi-company support (SaaS)
- [ ] PWA for drivers (offline support)
- [ ] Customer SMS notifications on status change
- [ ] Dispatcher mobile app
- [ ] Zone-based heatmap (non-tracking, just aggregate area data)

---

## Hackathon Notes

Built for a hackathon demo focused on **trust and dignity in last-mile logistics**. The core thesis: accountability doesn't require surveillance. Drivers who feel trusted perform better, report issues honestly, and stay longer.

---

*Built with ❤️ for Amman, Jordan 🇯🇴*
