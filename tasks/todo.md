# TODO: AI Trading Assistant - XAUUSD

> Track progress: Check [x] when complete  
> Full details: [plan.md](./plan.md)

---

## Phase 1: Foundation (Day 1-3)

- [ ] **1.1** Backend project setup (Express + TypeScript + Prisma)
- [ ] **1.2** Database schema & migrations (User, Points, Analysis, AIConfig)
- [ ] **1.3** Auth API (login, me, logout) + JWT middleware
- [ ] **1.4** Frontend projects setup (Next.js landing + React dashboard)
- [ ] **1.5** Dashboard login page & auth flow

### Checkpoint 1
- [ ] Backend health check works
- [ ] Database migrated
- [ ] Login API tested
- [ ] Dashboard login UI works

---

## Phase 2: Core Backend (Day 4-7)

- [ ] **2.1** User CRUD API (admin only)
- [ ] **2.2** Point management API (grant/revoke/history)
- [ ] **2.3** AI Config API (get/update)
- [ ] **2.4** Chart OHLC proxy API
- [ ] **2.5** Analysis request API (main flow)
- [ ] **2.6** Analysis history API
- [ ] **2.7** Input validation & error handling

### Checkpoint 2
- [ ] All 17 endpoints work
- [ ] Postman collection tested
- [ ] Unit tests pass

---

## Phase 3: MT5 Bridge (Day 8-9)

- [ ] **3.1** Python FastAPI setup
- [ ] **3.2** OHLC data endpoint
- [ ] **3.3** MT5 connection health & retry

### Checkpoint 3
- [ ] Python API returns OHLC
- [ ] Backend proxy works

---

## Phase 4: User Dashboard (Day 10-14)

- [ ] **4.1** Dashboard layout & navigation
- [ ] **4.2** Chart component (Lightweight Charts)
- [ ] **4.3** Analysis panel (button, result, signals)
- [ ] **4.4** Point balance & insufficient points handling
- [ ] **4.5** Analysis history page
- [ ] **4.6** User profile page
- [ ] **4.7** Error handling & loading states

### Checkpoint 4
- [ ] Full analysis flow works
- [ ] Points deducted correctly
- [ ] History displays

---

## Phase 5: Admin Dashboard (Day 15-18)

- [ ] **5.1** Admin layout & role guard
- [ ] **5.2** User management page (CRUD)
- [ ] **5.3** Point management (grant/revoke)
- [ ] **5.4** AI configuration page
- [ ] **5.5** Dashboard statistics
- [ ] **5.6** Activity logs (optional)

### Checkpoint 5
- [ ] Admin can manage users
- [ ] AI config saves

---

## Phase 6: Landing Page (Day 19-20)

- [ ] **6.1** Landing page design (Hero, Features, CTA)
- [ ] **6.2** Login page on landing

### Checkpoint 6
- [ ] Landing responsive
- [ ] Login redirects

---

## Phase 7: Polish & Deploy (Day 21-23)

- [ ] **7.1** Testing & bug fixes
- [ ] **7.2** Deployment setup (Vercel + Railway)

### Final Checkpoint
- [ ] All features production-ready
- [ ] Security audit passed
- [ ] Monitoring setup

---

## Quick Stats

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Foundation | 5 | ⬜ Not started |
| Phase 2: Backend | 7 | ⬜ Not started |
| Phase 3: MT5 | 3 | ⬜ Not started |
| Phase 4: User UI | 7 | ⬜ Not started |
| Phase 5: Admin UI | 6 | ⬜ Not started |
| Phase 6: Landing | 2 | ⬜ Not started |
| Phase 7: Deploy | 2 | ⬜ Not started |
| **Total** | **32** | **0% complete** |

---

## Current Focus

> Update this section as you work

**Working on**: _Not started_

**Blocked by**: _None_

**Next up**: Task 1.1 - Backend project setup
