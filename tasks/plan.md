# Project Plan: AI Trading Assistant - XAUUSD

> Created: 2026-05-23  
> Based on: [SPEC.md](../docs/specs/SPEC.md)

---

## Overview

Dự án được chia thành **7 Phases** với **32 Tasks** theo nguyên tắc vertical slices.

```
Phase 1: Foundation       [Tasks 1-5]   → Project setup, DB, Auth
Phase 2: Core Backend     [Tasks 6-12]  → Users, Points, AI Config APIs
Phase 3: MT5 Bridge       [Tasks 13-15] → Python FastAPI for MT5
Phase 4: User Dashboard   [Tasks 16-22] → Chart, Analysis flow
Phase 5: Admin Dashboard  [Tasks 23-28] → User mgmt, Points, AI Config
Phase 6: Landing Page     [Tasks 29-30] → Next.js public site
Phase 7: Polish & Deploy  [Tasks 31-32] → Testing, deployment
```

### Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1 | 2-3 days | Day 3 |
| Phase 2 | 3-4 days | Day 7 |
| Phase 3 | 2 days | Day 9 |
| Phase 4 | 4-5 days | Day 14 |
| Phase 5 | 3-4 days | Day 18 |
| Phase 6 | 2 days | Day 20 |
| Phase 7 | 2-3 days | Day 23 |

**Total: ~3-4 weeks**

---

## Phase 1: Foundation

> Setup project infrastructure, database, và authentication cơ bản.

### Task 1.1: Backend Project Setup

**Objective**: Khởi tạo backend Express + TypeScript với cấu trúc chuẩn

**Files to create**:
```
backend/
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── auth.ts
│   ├── routes/
│   │   └── index.ts
│   ├── services/
│   ├── utils/
│   │   ├── app-error.ts
│   │   └── logger.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── .env.example
```

**Acceptance Criteria**:
- [ ] `npm run dev` starts server on port 3001
- [ ] Health check endpoint `/health` returns 200
- [ ] Logger configured (Pino)
- [ ] Error handler middleware works
- [ ] Environment variables loaded

**Dependencies**: None

**Verification**:
```bash
curl http://localhost:3001/health
# Expected: { "status": "ok" }
```

---

### Task 1.2: Database Schema & Prisma Setup

**Objective**: Tạo database schema với Prisma cho tất cả models

**Files to modify**:
- `backend/prisma/schema.prisma`

**Schema**:
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(USER)
  points       Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  pointTransactions PointTransaction[]
  analysisHistory   AnalysisHistory[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

model PointTransaction {
  id        String          @id @default(cuid())
  userId    String
  amount    Int
  type      TransactionType
  reason    String
  createdBy String
  createdAt DateTime        @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("point_transactions")
}

enum TransactionType {
  GRANT
  REVOKE
  USAGE
}

model AnalysisHistory {
  id             String   @id @default(cuid())
  userId         String
  timeframe      String
  ohlcData       Json
  aiResponse     String   @db.Text
  hasEntry       Boolean  @default(false)
  entry          Float?
  stopLoss       Float?
  takeProfit     Float?
  pointsDeducted Int      @default(0)
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("analysis_history")
}

model AIConfig {
  id                String   @id @default(cuid())
  systemInstruction Json
  promptTemplate    String   @db.Text
  responseFormat    Json
  isActive          Boolean  @default(true)
  updatedBy         String
  updatedAt         DateTime @updatedAt

  @@map("ai_configs")
}
```

**Acceptance Criteria**:
- [ ] `npx prisma migrate dev` runs successfully
- [ ] `npx prisma studio` shows all tables
- [ ] Prisma client generated
- [ ] Seed script creates admin user

**Dependencies**: Task 1.1

---

### Task 1.3: Authentication - Login API

**Objective**: Implement JWT-based login (no register)

**Files to create/modify**:
- `backend/src/routes/auth.ts`
- `backend/src/services/auth-service.ts`
- `backend/src/middleware/auth.ts`

**API Contract**:
```
POST /api/v1/auth/login
Body: { email, password }
Response: { success, data: { token, user } }

GET /api/v1/auth/me
Headers: Authorization: Bearer <token>
Response: { success, data: { user } }

POST /api/v1/auth/logout
Response: { success, message }
```

**Acceptance Criteria**:
- [ ] Login returns JWT token (15min expiry)
- [ ] Invalid credentials return 401
- [ ] `/me` returns current user info
- [ ] Middleware blocks unauthenticated requests
- [ ] Password compared with bcrypt

**Dependencies**: Task 1.2

**Verification**:
```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Get me
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

---

### Task 1.4: Frontend Projects Setup

**Objective**: Khởi tạo 2 frontend projects (Landing + Dashboard)

**Structure**:
```
frontend/
├── landing/          # Next.js 14
│   ├── src/app/
│   ├── package.json
│   └── ...
└── dashboard/        # React + Vite
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── lib/
    │   └── ...
    ├── package.json
    └── ...
```

**Acceptance Criteria**:
- [ ] Landing: `npm run dev` starts on port 3000
- [ ] Dashboard: `npm run dev` starts on port 5173
- [ ] Tailwind configured on both
- [ ] shadcn/ui initialized on dashboard
- [ ] Shared types package (optional)

**Dependencies**: None (parallel with backend)

---

### Task 1.5: Dashboard - Login Page & Auth Flow

**Objective**: Implement login UI và auth state management

**Files to create**:
- `frontend/dashboard/src/pages/Login.tsx`
- `frontend/dashboard/src/lib/auth.ts`
- `frontend/dashboard/src/stores/auth-store.ts`

**Acceptance Criteria**:
- [ ] Login form with email/password
- [ ] Form validation (Zod)
- [ ] Error handling (wrong credentials)
- [ ] Token stored in localStorage/cookie
- [ ] Redirect to dashboard after login
- [ ] Protected route wrapper
- [ ] Logout functionality

**Dependencies**: Task 1.3, Task 1.4

**Verification**:
- Manual test: Login with admin credentials → redirected to dashboard
- Manual test: Access /dashboard without login → redirected to /login

---

## Checkpoint 1: Foundation Complete

**Verify before proceeding**:
- [ ] Backend runs with health check
- [ ] Database migrated with all tables
- [ ] Login API works (test with curl)
- [ ] Dashboard login UI works
- [ ] Auth middleware blocks unauthorized requests

---

## Phase 2: Core Backend APIs

> Implement tất cả backend APIs cho Users, Points, AI Config.

### Task 2.1: User CRUD API (Admin)

**Objective**: API quản lý users cho admin

**Files**:
- `backend/src/routes/users.ts`
- `backend/src/services/user-service.ts`

**API Contract**:
```
GET    /api/v1/users           → List users (paginated)
POST   /api/v1/users           → Create user
GET    /api/v1/users/:id       → Get user detail
PATCH  /api/v1/users/:id       → Update user
DELETE /api/v1/users/:id       → Soft delete user
```

**Acceptance Criteria**:
- [ ] List with pagination, search by email/name
- [ ] Create user with hashed password
- [ ] Update name, email, isActive
- [ ] Soft delete (set isActive = false)
- [ ] Only ADMIN role can access
- [ ] Validation with Zod

**Dependencies**: Task 1.3

---

### Task 2.2: Point Management API (Admin)

**Objective**: API cấp/thu hồi điểm và xem lịch sử

**Files**:
- `backend/src/routes/points.ts`
- `backend/src/services/point-service.ts`

**API Contract**:
```
POST /api/v1/users/:id/points/grant
Body: { amount, reason }

POST /api/v1/users/:id/points/revoke
Body: { amount, reason }

GET /api/v1/users/:id/points/history
Query: ?page=1&limit=20
```

**Acceptance Criteria**:
- [ ] Grant increases user.points
- [ ] Revoke decreases user.points (không âm)
- [ ] Transaction logged với createdBy = admin.id
- [ ] History shows all transactions
- [ ] Only ADMIN role can access

**Dependencies**: Task 2.1

---

### Task 2.3: AI Config API (Admin)

**Objective**: API cấu hình prompt và system instructions

**Files**:
- `backend/src/routes/ai-config.ts`
- `backend/src/services/ai-config-service.ts`

**API Contract**:
```
GET /api/v1/ai-config
Response: { systemInstruction, promptTemplate, responseFormat }

PUT /api/v1/ai-config
Body: { systemInstruction, promptTemplate, responseFormat }
```

**Acceptance Criteria**:
- [ ] Get returns active config
- [ ] Update saves new config, logs updatedBy
- [ ] Validation cho JSON structure
- [ ] Only ADMIN role can access

**Dependencies**: Task 1.3

---

### Task 2.4: Chart OHLC Proxy API

**Objective**: API proxy để lấy OHLC data từ MT5 Python API

**Files**:
- `backend/src/routes/chart.ts`
- `backend/src/services/chart-service.ts`

**API Contract**:
```
GET /api/v1/chart/ohlc?timeframe=H1&bars=100
Response: {
  success: true,
  data: {
    timeframe: "H1",
    symbol: "XAUUSD",
    candles: [
      { time, open, high, low, close, volume },
      ...
    ]
  }
}
```

**Acceptance Criteria**:
- [ ] Proxy request to Python MT5 API
- [ ] Support timeframes: M1, M5, M15, M30, H1, H4, D1, W1
- [ ] Error handling nếu MT5 API down
- [ ] Cache response 1 minute (optional)
- [ ] Authenticated users only

**Dependencies**: Task 1.3

---

### Task 2.5: Analysis Request API

**Objective**: API chính để user yêu cầu AI phân tích

**Files**:
- `backend/src/routes/analysis.ts`
- `backend/src/services/analysis-service.ts`
- `backend/src/services/gemini-service.ts`

**API Contract**:
```
POST /api/v1/analysis
Body: { timeframe: "H1" }
Response: {
  success: true,
  data: {
    id: "...",
    analysis: "Nhận định thị trường...",
    hasEntry: true,
    entry: 2345.50,
    stopLoss: 2340.00,
    takeProfit: 2355.00,
    pointsDeducted: 1
  }
}
```

**Flow**:
1. Check user.points > 0
2. Fetch OHLC from MT5 API
3. Get active AI config
4. Build prompt: systemInstruction + promptTemplate + OHLC
5. Send to Gemini API
6. Parse response → extract entry/sl/tp
7. If hasEntry → deduct 1 point
8. Save to AnalysisHistory
9. Return result

**Acceptance Criteria**:
- [ ] Returns 400 if points = 0
- [ ] Calls Gemini API with correct prompt
- [ ] Parses AI response correctly
- [ ] Deducts point only if hasEntry
- [ ] Logs transaction với type = USAGE
- [ ] Saves to history

**Dependencies**: Task 2.3, Task 2.4

---

### Task 2.6: Analysis History API

**Objective**: API xem lịch sử phân tích của user

**Files**:
- `backend/src/routes/analysis.ts` (thêm endpoints)

**API Contract**:
```
GET /api/v1/analysis/history
Query: ?page=1&limit=20

GET /api/v1/analysis/:id
```

**Acceptance Criteria**:
- [ ] List history của current user
- [ ] Paginated, sorted by createdAt DESC
- [ ] Detail shows full aiResponse

**Dependencies**: Task 2.5

---

### Task 2.7: Input Validation & Error Handling

**Objective**: Chuẩn hóa validation và error responses

**Files**:
- `backend/src/middleware/validate.ts`
- `backend/src/schemas/*.ts`

**Acceptance Criteria**:
- [ ] All endpoints use Zod schemas
- [ ] Consistent error format: `{ success: false, error: { code, message } }`
- [ ] 400 for validation errors
- [ ] 401 for unauthenticated
- [ ] 403 for unauthorized (wrong role)
- [ ] 404 for not found
- [ ] 500 for internal errors (không expose details)

**Dependencies**: All API tasks

---

## Checkpoint 2: Backend APIs Complete

**Verify before proceeding**:
- [ ] All 17 endpoints implemented
- [ ] Postman/Insomnia collection works
- [ ] Unit tests for services (80% coverage)
- [ ] Integration tests for critical paths
- [ ] Error handling consistent

---

## Phase 3: MT5 Python Bridge

> Python FastAPI service kết nối với MT5.

### Task 3.1: Python MT5 API Setup

**Objective**: Khởi tạo Python FastAPI project

**Structure**:
```
mt5-api/
├── app/
│   ├── main.py
│   ├── routes/
│   │   └── chart.py
│   ├── services/
│   │   └── mt5_service.py
│   └── config.py
├── requirements.txt
└── .env.example
```

**Acceptance Criteria**:
- [ ] FastAPI runs on port 8000
- [ ] Health check `/health`
- [ ] MT5 library installed
- [ ] Connects to MT5 terminal

**Dependencies**: MT5 installed on machine

---

### Task 3.2: OHLC Data Endpoint

**Objective**: API lấy OHLC data từ MT5

**API Contract**:
```
GET /api/chart/ohlc?symbol=XAUUSD&timeframe=H1&bars=100
Response: {
  "symbol": "XAUUSD",
  "timeframe": "H1",
  "candles": [
    { "time": 1234567890, "open": 2345.0, "high": 2350.0, "low": 2340.0, "close": 2348.0, "volume": 1000 },
    ...
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns OHLC data từ MT5
- [ ] Support all timeframes
- [ ] Error handling nếu MT5 disconnected
- [ ] Rate limiting (optional)

**Dependencies**: Task 3.1

---

### Task 3.3: MT5 Connection Health & Retry

**Objective**: Đảm bảo kết nối MT5 stable

**Acceptance Criteria**:
- [ ] Auto-reconnect nếu MT5 disconnect
- [ ] Health endpoint shows MT5 status
- [ ] Timeout handling
- [ ] Logging cho debugging

**Dependencies**: Task 3.2

---

## Checkpoint 3: MT5 Bridge Complete

**Verify before proceeding**:
- [ ] Python API returns OHLC data
- [ ] Backend proxy works end-to-end
- [ ] MT5 connection stable

---

## Phase 4: User Dashboard

> Frontend cho user xem chart và nhận phân tích.

### Task 4.1: Dashboard Layout & Navigation

**Objective**: Layout chính với sidebar/header

**Files**:
- `frontend/dashboard/src/components/layout/`
- `frontend/dashboard/src/pages/Dashboard.tsx`

**Acceptance Criteria**:
- [ ] Sidebar với navigation
- [ ] Header với user info, logout
- [ ] Point balance hiển thị
- [ ] Responsive design

**Dependencies**: Task 1.5

---

### Task 4.2: Chart Component với Lightweight Charts

**Objective**: Hiển thị candlestick chart XAUUSD

**Files**:
- `frontend/dashboard/src/components/chart/Chart.tsx`
- `frontend/dashboard/src/components/chart/TimeframeSelector.tsx`

**Acceptance Criteria**:
- [ ] Render candlestick chart
- [ ] Timeframe buttons: M1, M5, M15, M30, H1, H4, D1, W1
- [ ] Auto-refresh data
- [ ] Loading state
- [ ] Error state nếu API fail

**Dependencies**: Task 4.1, Task 2.4

---

### Task 4.3: Analysis Panel

**Objective**: Panel hiển thị kết quả phân tích AI

**Files**:
- `frontend/dashboard/src/components/analysis/AnalysisPanel.tsx`
- `frontend/dashboard/src/components/analysis/TradeSignal.tsx`

**Acceptance Criteria**:
- [ ] "Phân tích" button
- [ ] Loading state khi đang analyze
- [ ] Hiển thị AI analysis (markdown)
- [ ] Trade signal card: Entry, SL, TP
- [ ] Point deduction notification

**Dependencies**: Task 4.2, Task 2.5

---

### Task 4.4: Point Balance & Insufficient Points

**Objective**: Hiển thị và xử lý hết điểm

**Files**:
- `frontend/dashboard/src/components/common/PointBalance.tsx`

**Acceptance Criteria**:
- [ ] Realtime point balance
- [ ] Warning khi points < 5
- [ ] Error modal khi points = 0
- [ ] Disable analyze button khi hết điểm

**Dependencies**: Task 4.3

---

### Task 4.5: Analysis History Page

**Objective**: Trang xem lịch sử phân tích

**Files**:
- `frontend/dashboard/src/pages/History.tsx`
- `frontend/dashboard/src/components/history/HistoryTable.tsx`

**Acceptance Criteria**:
- [ ] Table với pagination
- [ ] Columns: Date, Timeframe, Entry, SL, TP, Points
- [ ] Click row → view detail modal
- [ ] Filter by date range (optional)

**Dependencies**: Task 4.1, Task 2.6

---

### Task 4.6: User Profile Page

**Objective**: Trang xem thông tin cá nhân

**Files**:
- `frontend/dashboard/src/pages/Profile.tsx`

**Acceptance Criteria**:
- [ ] Hiển thị email, name
- [ ] Point balance
- [ ] Point transaction history
- [ ] Change password (optional v1)

**Dependencies**: Task 4.1

---

### Task 4.7: Error Handling & Loading States

**Objective**: UX tốt cho các edge cases

**Acceptance Criteria**:
- [ ] Global error boundary
- [ ] Toast notifications
- [ ] Skeleton loading
- [ ] Retry buttons for failed requests
- [ ] Offline indicator

**Dependencies**: All Phase 4 tasks

---

## Checkpoint 4: User Dashboard Complete

**Verify before proceeding**:
- [ ] User can login và xem dashboard
- [ ] Chart renders với timeframe switching
- [ ] Analysis flow works end-to-end
- [ ] Points deducted correctly
- [ ] History page shows past analyses

---

## Phase 5: Admin Dashboard

> Frontend cho admin quản lý hệ thống.

### Task 5.1: Admin Layout & Role Guard

**Objective**: Layout admin và kiểm tra quyền

**Files**:
- `frontend/dashboard/src/pages/admin/`
- `frontend/dashboard/src/components/guards/AdminGuard.tsx`

**Acceptance Criteria**:
- [ ] Admin sidebar navigation
- [ ] Redirect non-admin to user dashboard
- [ ] Role-based menu items

**Dependencies**: Task 4.1

---

### Task 5.2: User Management Page

**Objective**: CRUD users

**Files**:
- `frontend/dashboard/src/pages/admin/Users.tsx`
- `frontend/dashboard/src/components/admin/UserTable.tsx`
- `frontend/dashboard/src/components/admin/UserForm.tsx`

**Acceptance Criteria**:
- [ ] Table với search, pagination
- [ ] Create user modal
- [ ] Edit user modal
- [ ] Toggle active/inactive
- [ ] Delete confirmation

**Dependencies**: Task 5.1, Task 2.1

---

### Task 5.3: Point Management

**Objective**: Cấp/thu hồi điểm

**Files**:
- `frontend/dashboard/src/components/admin/PointManager.tsx`

**Acceptance Criteria**:
- [ ] Grant points form (amount, reason)
- [ ] Revoke points form
- [ ] Confirmation modal
- [ ] Success notification
- [ ] View point history

**Dependencies**: Task 5.2, Task 2.2

---

### Task 5.4: AI Configuration Page

**Objective**: Cấu hình prompt và system instructions

**Files**:
- `frontend/dashboard/src/pages/admin/AIConfig.tsx`
- `frontend/dashboard/src/components/admin/PromptEditor.tsx`
- `frontend/dashboard/src/components/admin/SystemInstructionForm.tsx`

**Acceptance Criteria**:
- [ ] System Instruction form với các fields
- [ ] Prompt template editor
- [ ] Variable placeholders: {{timeframe}}, {{ohlcData}}
- [ ] Preview rendered prompt
- [ ] Save confirmation

**Dependencies**: Task 5.1, Task 2.3

---

### Task 5.5: Dashboard Statistics

**Objective**: Overview statistics cho admin

**Files**:
- `frontend/dashboard/src/pages/admin/Dashboard.tsx`

**Acceptance Criteria**:
- [ ] Total users
- [ ] Active users
- [ ] Total analyses today/week/month
- [ ] Points granted/used
- [ ] Simple charts (optional)

**Dependencies**: Task 5.1

---

### Task 5.6: Activity Logs (Optional)

**Objective**: Xem logs hoạt động

**Acceptance Criteria**:
- [ ] Recent logins
- [ ] Recent analyses
- [ ] Admin actions log

**Dependencies**: Task 5.5

---

## Checkpoint 5: Admin Dashboard Complete

**Verify before proceeding**:
- [ ] Admin can manage users
- [ ] Points grant/revoke works
- [ ] AI config saves correctly
- [ ] Statistics display

---

## Phase 6: Landing Page

> Public website giới thiệu và login.

### Task 6.1: Landing Page Design

**Objective**: Trang chủ public với Next.js

**Files**:
- `frontend/landing/src/app/page.tsx`
- `frontend/landing/src/components/`

**Sections**:
1. Hero - Value proposition
2. Features - 3-4 key features
3. How it works - Steps
4. CTA - Login button

**Acceptance Criteria**:
- [ ] Responsive design
- [ ] SEO optimized (metadata)
- [ ] Fast loading (SSG)
- [ ] Login button → redirect to dashboard

**Dependencies**: Task 1.4

---

### Task 6.2: Login Page on Landing

**Objective**: Login form trên landing site

**Files**:
- `frontend/landing/src/app/login/page.tsx`

**Acceptance Criteria**:
- [ ] Login form
- [ ] Error handling
- [ ] Redirect to dashboard after login
- [ ] "Quên mật khẩu" link (v2)

**Dependencies**: Task 6.1

---

## Checkpoint 6: Landing Complete

**Verify**:
- [ ] Landing page renders
- [ ] Login redirects to dashboard
- [ ] Mobile responsive

---

## Phase 7: Polish & Deploy

### Task 7.1: Testing & Bug Fixes

**Objective**: Hoàn thiện test coverage

**Acceptance Criteria**:
- [ ] Unit tests: 80% coverage
- [ ] Integration tests: all endpoints
- [ ] E2E tests: critical flows
- [ ] Bug fixes from testing

**Dependencies**: All previous phases

---

### Task 7.2: Deployment Setup

**Objective**: Deploy lên production

**Deployment Plan**:
- Landing: Vercel
- Dashboard: Vercel hoặc Cloudflare Pages
- Backend: Railway hoặc VPS
- Database: Railway PostgreSQL
- MT5 API: Local machine (chạy 24/7)

**Acceptance Criteria**:
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environment variables configured
- [ ] SSL certificates
- [ ] Domain connected
- [ ] Monitoring setup

**Dependencies**: Task 7.1

---

## Final Checkpoint: Production Ready

**Verify**:
- [ ] All features work in production
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Admin can manage system
- [ ] Users can analyze

---

## Risk Items

| Risk | Mitigation |
|------|------------|
| MT5 API unstable | Retry logic, health checks |
| Gemini rate limits | Queue requests, cache |
| AI response unparseable | Fallback parsing, error UI |
| Points exploitation | Server-side validation |

---

## Definition of Done

Mỗi task được coi là DONE khi:
- [ ] Code implemented
- [ ] Tests written và pass
- [ ] Code reviewed
- [ ] Works in staging environment
- [ ] Documented (if API change)
