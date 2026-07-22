


---

#  BRT Smart Bus Service – Intelligent Transit & Digital Ticketing Platform

A production-grade smart bus transit web application combining real-time tracking, virtual ticketing, QR-based payments, session-based access control, and intelligent arrival notifications — all wrapped in a premium, motion-polished UI experience.

---

## 🌐 Live Deployment

👉 **Live Here:**
*https://bus-service-lyart.vercel.app/*

⚡ Optimized for modern cloud hosting environments

⚡ Designed for Lovable Cloud / Vercel / Netlify deployment

---

## 📖 Overview

**BRT Smart Bus Service** is a next-generation digital transit platform designed to simulate and scale toward real-world smart public transport systems.

The system combines:

* Real-time bus location tracking
* Smart virtual ticket generation
* QR-based payment simulation
* Auto-expiring time-bound tickets
* Session-based user dashboards
* Intelligent bus arrival notifications
* Premium motion-polished UI system

The platform is engineered to feel:

* Modern
* Reliable
* Scalable
* Premium
* Real-world deployable

---

## 🌟 Core Features

---

### 🗺 Real-Time Bus Tracking System

* Driver GPS location push system
* Passenger-side live map tracking
* Google Maps marker updates
* Backend polling system
* Real-time location display

---

### 🎟 Smart Virtual Ticket System

* Ticket generation after payment
* Unique QR code per ticket
* Time-bound ticket validity
* Auto-expiry after destination arrival time
* Active vs expired ticket separation
* Ticket history persistence

---

### 💳 QR Payment Simulation System

* Trip summary before payment
* QR payment simulation flow
* Payment confirmation state
* Payment history logging
* Linked ticket-payment mapping

---

### ⏳ Automatic Ticket Expiry Engine

* Background expiry checks
* Active → Expired auto migration
* Expired ticket history storage
* Real-time dashboard status updates

---

### 🔔 Smart Bus Arrival Notifications

* Live bus ETA calculation
* In-app floating notifications
* Browser push notification support
* Smart trigger (≤ 5 minutes arrival ETA)

---

### 👤 Session-Based User Experience

Logged Out Users:

* View timetable
* View fares
* Track buses
* Explore site

Logged In Users Unlock:

* Ticket booking
* Dashboard access
* Payment history
* Notification settings

---

### 📊 Smart Dashboard System

Dashboard shows:

**Active Ticket**

* Route
* Time window
* QR validation
* Countdown timer

**Ticket History**

* Expired tickets
* Past travel records

**Payment History**

* Payment timestamps
* Fare records

---

### 📅 Smart Booking Rules Engine

Booking Restrictions:

✅ Today’s date only

✅ Future bus timings only

❌ Past departures blocked

❌ Historical booking disabled

Ensures realistic transit booking simulation.

---

### 🎨 Premium UI & Motion Design System

Includes:

* Glass morph ticket cards
* Purple accent theme system
* Layered soft shadow depth
* Hover glow micro-interactions
* Blur + translate hero animations
* Elegant easing curves
* Motion-first interaction polish

---

## 🧠 System Architecture Philosophy

Inspired by real-world transit platforms:

* Uber Transit UX
* Google Maps Transit
* Metro Smart Card Systems
* Airport Boarding Systems

Core Principles:

* Automation reduces user friction
* Time-aware systems improve realism
* Motion must enhance clarity
* Data must feel persistent and reliable

---

## 🚀 Getting Started (Local Setup)

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/brt-smart-bus-service.git
cd brt-smart-bus-service
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Configure Firebase

```bash
cp .env.example .env
```

Fill in the values from **Firebase console → Project settings → General → Your apps → SDK setup**.

> These values are **not secrets**. Firebase web configuration is compiled into
> the JavaScript bundle every visitor downloads and can be read from any
> deployed Firebase app. What protects the data is the security rules below,
> which run on Google's servers and cannot be bypassed by a modified client.

---

### 4️⃣ Run Development Server

```bash
npm run dev
```

Open:

```
http://localhost:8080
```

---

## 🧪 Testing

```bash
npm test              # run the suite once
npm run test:watch    # re-run on change
npm run test:coverage # suite + coverage report
npm run verify        # everything CI runs, in the same order
```

Coverage lands in `coverage/`; open `coverage/index.html` for the line-by-line view.

### Philosophy

Tests here protect **behaviour**, not implementation. A test that breaks when a
component is refactored but the user experience is unchanged is a liability, so
the suite avoids snapshots of markup, shallow rendering, and assertions about
internal state.

Practically that means:

- **Query the way a user finds things** — by role, label and visible text.
  `getByRole("button", { name: /proceed to pay/i })` breaks only if the button
  genuinely stops being reachable.
- **Drive with `user-event`, not `fireEvent`** — it dispatches the same event
  sequence a browser does, so a click on a disabled or covered element fails
  like it would in real life.
- **Coverage is measured only where decisions live** (`domain`, `services`,
  `contexts`, `components`). Including presentational pages would raise the
  percentage without telling anyone whether booking works.
- **Thresholds are a ratchet, not a target.** They sit just below what the suite
  achieves so a regression fails CI; they are raised deliberately.

### Layout

| Path | What lives there |
|---|---|
| `src/test/domain/` | Pure business rules: fares, timetable, ticket lifecycle, selectors |
| `src/test/services/` | Persistence, booking rules, user records, alerts, location |
| `src/test/contexts/` | Provider wiring: sign-in, sign-out, account switching, polling |
| `src/test/components/` | UI behaviour and accessibility |
| `src/test/integration/` | Whole user journeys through real pages |
| `src/test/helpers/` | Shared render helper, data factories, mocks |

### Mocking

Firebase is never loaded in tests. `src/test/helpers/firebase.ts` is the single
place that defines how it behaves — a controllable auth listener and an
in-memory Firestore document store, so `userService` runs its real logic against
something that acts like a database rather than against per-call stubs.

Tests that mount the auth provider but are not about user records mock
`userService` via `src/test/helpers/userService.ts`, which also lets them choose
a role outright.

Anything time-dependent freezes the clock. The timetable's first departure is
6:25 AM, so a suite using the real clock would quietly pass in the morning and
fail in the evening.

---

## 🔄 Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`, across
Node 20 and 22. Each gate is a separate step, so a red run names what broke:

| Gate | Blocks merge on |
|---|---|
| `npm ci` | lockfile drift |
| `npm run typecheck` | any type error |
| `npm run lint` | any ESLint error |
| `npm run test:coverage` | a failing test **or** coverage below threshold |
| `npm run build` | a broken production build |

Coverage and the built `dist/` are uploaded as artifacts. Run the identical
sequence locally with `npm run verify`.

---

## 🔐 Security Model

Authorization is enforced in two independent places. The browser layer decides
what to render and which calls to attempt; the server layer decides what is
actually permitted. Only the second one is a security boundary.

| Layer | Where | What it does |
|---|---|---|
| Security rules | `firestore.rules`, `database.rules.json` | The real boundary. Runs on Google's servers. |
| Permission model | `src/domain/auth/permissions.ts` | Named capabilities per role, asked via `can(actor, PERMISSION)`. |
| Route guards | `src/components/routing/RouteGuards.tsx` | Keeps unauthorized users off privileged pages and blocks rendering until the role resolves. |
| Schema validation | `src/domain/validation/schemas.ts` | Everything from storage, Firestore, RTDB and forms is parsed before use. |

**Key invariants**

- A user may create and edit their own profile but can **never** set or change
  their own `role`. Role assignment is admin-only, enforced in `firestore.rules`.
- Listing the `users` collection is admin-only, so a signed-in passenger cannot
  enumerate every account.
- Any collection without an explicit rule is denied by default.
- Driver positions publish **coordinates and an opaque bus label only** — never
  a name or email address. `database.rules.json` rejects any other field.

### Deploying the rules

Rules in this repository do nothing until they are deployed. After changing
them:

```bash
npx firebase-tools deploy --only firestore:rules,database
```

### Testing the rules locally

```bash
npx firebase-tools emulators:start --only firestore,database
```

---

## 🛠️ Tech Stack

Frontend:

* React 18
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion

State & Persistence:

* Context API
* localStorage (MVP mode)
* Lovable Cloud Database (Production ready path)

APIs & Integration:

* Google Maps API
* Browser Notification API
* QR Code Generation Library

---

## 🧩 Architecture Breakdown

| Module              | Purpose                          |
| ------------------- | -------------------------------- |
| Auth System         | Session-based access control     |
| Ticket Engine       | Ticket lifecycle management      |
| Payment Module      | QR-based payment simulation      |
| Expiry Engine       | Auto ticket expiration           |
| Notification Engine | Smart arrival alerts             |
| Dashboard Module    | User ticket + payment visibility |
| Map Engine          | Real-time bus tracking           |

---

## 🎯 UX Strategy

* Transit workflow clarity first
* Mobile-first booking interactions
* Low cognitive load navigation
* Motion used as feedback, not decoration
* Real-world system behavior simulation

---

## 🎥 Performance Goals

* 60 FPS UI animation target
* Minimal re-render architecture
* GPU transform-based animations
* Optimized map rendering updates
* Efficient polling intervals

---

## 🌍 Deployment

Optimized for:

* Vercel
* Netlify
* Cloudflare Pages

---

## 🔮 Future Roadmap

* Real payment gateway (UPI / Razorpay)
* Socket-based real-time tracking
* Monthly pass subscription system
* AI route optimization
* Offline ticket caching (PWA mode)

---

## 👤 Author

Created by **Mukund Thakur**  &&   **Dharmendra Dhruw**

GitHub:
👉 [https://github.com/Mukund934](https://github.com/Mukund934)
👉 [https://github.com/dharmendra23101](https://github.com/dharmendra23101)

Email:
👉 [mukund.th04@gmail.com](mailto:mukund.th04@gmail.com)

---
