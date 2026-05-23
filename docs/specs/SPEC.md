# Feature: AI Trading Assistant - XAUUSD

> Version: 1.0.0  
> Created: 2026-05-23  
> Status: Draft

---

## Objective

Xây dựng hệ thống hỗ trợ phân tích giao dịch vàng (XAUUSD) sử dụng AI Gemini, với mô hình credit-based cho phép người dùng nhận tín hiệu giao dịch (Entry/SL/TP) dựa trên phân tích dữ liệu OHLC từ MT5.

---

## Target Users

| User Type | Mô tả | Nhu cầu chính |
|-----------|-------|---------------|
| **Trader** | Người giao dịch vàng cá nhân | Nhận phân tích AI, tín hiệu Entry/SL/TP |
| **Admin** | Quản trị viên hệ thống | Quản lý users, cấp points, cấu hình AI |

---

## Core Features

### Module 1: Landing Page (Public)

| # | Feature | Mô tả | Acceptance Criteria |
|---|---------|-------|---------------------|
| 1.1 | Hero Section | Giới thiệu hệ thống | Hiển thị value proposition, CTA login |
| 1.2 | Features Section | Highlight tính năng AI | Hiển thị 3-4 tính năng chính |
| 1.3 | Login Form | Form đăng nhập | Email/Password, validation, error handling |
| 1.4 | Responsive | Tương thích mobile | Hoạt động tốt trên mobile/tablet/desktop |

**Lưu ý:** Không có chức năng đăng ký. Admin tạo account cho user.

---

### Module 2: User Dashboard

| # | Feature | Mô tả | Acceptance Criteria |
|---|---------|-------|---------------------|
| 2.1 | **Chart Viewer** | Hiển thị chart XAUUSD | Render OHLC data dạng candlestick |
| 2.2 | **Timeframe Selector** | Chọn khung thời gian | Dropdown: M1, M5, M15, M30, H1, H4, D1, W1 |
| 2.3 | **Analyze Button** | Nút gửi yêu cầu phân tích | Click → gọi API → hiển thị loading |
| 2.4 | **Point Balance** | Hiển thị số điểm còn lại | Realtime update sau mỗi phân tích |
| 2.5 | **Analysis Result** | Hiển thị kết quả phân tích AI | Markdown/formatted text |
| 2.6 | **Trade Signal** | Hiển thị tín hiệu giao dịch | Entry Price, Stop Loss, Take Profit |
| 2.7 | **Analysis History** | Lịch sử các phân tích | Danh sách có pagination |
| 2.8 | **Point Deduction** | Trừ điểm khi có entry | -1 point nếu AI trả về entry signal |

#### User Flow - Phân tích

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User chọn Timeframe (M15, H1, H4...)                        │
│                           ↓                                     │
│ 2. Click nút "Phân tích"                                        │
│                           ↓                                     │
│ 3. System check: points > 0?                                    │
│         ├── NO → Hiển thị "Bạn đã hết điểm"                     │
│         └── YES ↓                                               │
│ 4. Fetch OHLC data từ MT5 API (theo timeframe)                  │
│                           ↓                                     │
│ 5. Combine: OHLC + Admin Prompt + System Instructions           │
│                           ↓                                     │
│ 6. Send request to Gemini API                                   │
│                           ↓                                     │
│ 7. Parse response → Extract analysis + Entry/SL/TP              │
│                           ↓                                     │
│ 8. Hiển thị kết quả cho user                                    │
│                           ↓                                     │
│ 9. If response has Entry → points -= 1                          │
│                           ↓                                     │
│ 10. Save to analysis history                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Module 3: Admin Dashboard

| # | Feature | Mô tả | Acceptance Criteria |
|---|---------|-------|---------------------|
| 3.1 | **User List** | Danh sách users | Table với search, filter, pagination |
| 3.2 | **Create User** | Tạo user mới | Form: email, password, name |
| 3.3 | **Edit User** | Sửa thông tin user | Update name, email, status |
| 3.4 | **Delete/Block User** | Xóa hoặc khóa user | Soft delete, toggle active status |
| 3.5 | **Grant Points** | Cấp điểm cho user | Input số điểm, lý do, confirm |
| 3.6 | **Revoke Points** | Thu hồi điểm | Input số điểm, lý do, confirm |
| 3.7 | **Point History** | Lịch sử cấp/thu hồi | Log: who, when, amount, reason |
| 3.8 | **Prompt Config** | Cấu hình AI Prompt | Text editor với variables |
| 3.9 | **System Instructions** | Cấu hình System Instructions | Structured form với các field |
| 3.10 | **Analysis Stats** | Thống kê sử dụng | Số lần phân tích, accuracy (nếu có) |

#### AI Configuration Structure

```json
{
  "systemInstruction": {
    "role": "Bạn là chuyên gia phân tích kỹ thuật XAUUSD...",
    "tradingStyle": "Scalping | Intraday | Swing",
    "riskRewardRatio": "1:2",
    "indicators": ["EMA", "RSI", "MACD", "Fibonacci"],
    "rules": [
      "Luôn đặt Stop Loss",
      "Không trade khi có tin quan trọng"
    ]
  },
  "promptTemplate": {
    "template": "Phân tích dữ liệu OHLC sau cho {{timeframe}}:\n{{ohlcData}}\n\nHãy đưa ra nhận định và tín hiệu giao dịch.",
    "variables": ["timeframe", "ohlcData"]
  },
  "responseFormat": {
    "requireEntry": false,
    "fields": ["analysis", "trend", "entry", "stopLoss", "takeProfit"]
  }
}
```

---

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'USER' | 'ADMIN';
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PointTransaction

```typescript
interface PointTransaction {
  id: string;
  userId: string;
  amount: number;           // positive = grant, negative = deduct
  type: 'GRANT' | 'REVOKE' | 'USAGE';
  reason: string;
  createdBy: string;        // admin id or 'SYSTEM'
  createdAt: Date;
}
```

### AnalysisHistory

```typescript
interface AnalysisHistory {
  id: string;
  userId: string;
  timeframe: string;
  ohlcData: JSON;
  aiResponse: string;
  hasEntry: boolean;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  pointsDeducted: number;
  createdAt: Date;
}
```

### AIConfig

```typescript
interface AIConfig {
  id: string;
  systemInstruction: JSON;
  promptTemplate: string;
  responseFormat: JSON;
  isActive: boolean;
  updatedBy: string;
  updatedAt: Date;
}
```

---

## API Contracts

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/me` | Get current user |

### User (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/:id` | Get user detail |
| PATCH | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user |

### Points (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/:id/points/grant` | Grant points |
| POST | `/api/v1/users/:id/points/revoke` | Revoke points |
| GET | `/api/v1/users/:id/points/history` | Point history |

### Analysis (User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analysis` | Request AI analysis |
| GET | `/api/v1/analysis/history` | Get analysis history |
| GET | `/api/v1/analysis/:id` | Get analysis detail |

### Chart Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/chart/ohlc?timeframe=H1` | Get OHLC data from MT5 |

### AI Config (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai-config` | Get current config |
| PUT | `/api/v1/ai-config` | Update config |

---

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Landing Page   │  │ User Dashboard  │  │ Admin Dashboard │  │
│  │   (Next.js)     │  │  (React+Vite)   │  │  (React+Vite)   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      BACKEND API        │
                    │   (Express + Node.js)   │
                    │   - Auth (JWT)          │
                    │   - User Management     │
                    │   - Point System        │
                    │   - AI Integration      │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼───────┐    ┌───────────▼───────────┐    ┌───────▼───────┐
│  PostgreSQL   │    │     Python MT5 API    │    │  Gemini API   │
│  - Users      │    │  - OHLC Data Fetch    │    │  - Analysis   │
│  - Points     │    │  - Real-time prices   │    │  - Signals    │
│  - History    │    └───────────────────────┘    └───────────────┘
│  - AI Config  │
└───────────────┘
```

### Tech Stack

| Layer | Technology | Lý do |
|-------|------------|-------|
| **Landing Page** | Next.js 14 (App Router) | SEO, SSG |
| **User/Admin Dashboard** | React + Vite | SPA, fast dev |
| **UI Components** | shadcn/ui + Tailwind | Consistent, customizable |
| **Chart Library** | Lightweight Charts (TradingView) | Candlestick, lightweight |
| **State Management** | Zustand | Simple, performant |
| **Data Fetching** | TanStack Query | Caching, refetch |
| **Backend** | Express.js + TypeScript | Fast, flexible |
| **Database** | PostgreSQL + Prisma | Reliable, great ORM |
| **Auth** | JWT + bcrypt | Stateless, secure |
| **AI** | Gemini API | As specified |
| **MT5 Bridge** | Python FastAPI | Connect to MT5 |

### Deployment

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vercel         │     │  Railway/VPS    │     │  Local Machine  │
│  - Landing Page │     │  - Backend API  │     │  - MT5 + Python │
│                 │     │  - PostgreSQL   │     │    API          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Out of Scope (v1.0)

| Feature | Lý do |
|---------|-------|
| Đăng ký tài khoản | Admin tạo manual |
| Thanh toán online | Admin cấp points manual |
| Auto trading | Chỉ cung cấp signals |
| Multi-asset | Chỉ XAUUSD |
| Real-time chart streaming | Fetch on-demand |
| Mobile app | Web responsive first |
| Notification (email/telegram) | Phase 2 |
| Backtesting | Phase 2 |

---

## Code Style

- Tuân thủ tất cả rules trong `.claude/rules/`
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits

---

## Testing Strategy

| Layer | Type | Coverage Target |
|-------|------|-----------------|
| **Backend** | Unit tests | Services, Utils (80%) |
| **Backend** | Integration | API endpoints (100% critical paths) |
| **Frontend** | Unit tests | Components, Hooks (70%) |
| **E2E** | Playwright | Login, Analysis flow, Admin CRUD |

### Critical Test Cases

1. Login flow (success/failure)
2. Point deduction on analysis
3. Insufficient points handling
4. AI response parsing
5. Admin CRUD operations
6. Point grant/revoke with history

---

## Boundaries

### Always Do

- Validate all user inputs (Zod)
- Check points before analysis
- Log all point transactions
- Hash passwords with bcrypt (12 rounds)
- Use parameterized queries (Prisma)
- Return consistent API response format

### Ask First

- Thay đổi data model
- Thêm external service integration
- Thay đổi AI prompt structure
- Thay đổi point deduction logic

### Never Do

- Store passwords in plain text
- Expose API keys to frontend
- Skip point validation
- Delete point transaction history
- Allow negative point balance

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MT5 API downtime | Users can't analyze | Cache recent OHLC, show error gracefully |
| Gemini API rate limit | Analysis fails | Queue requests, show estimated wait |
| Invalid AI response | No Entry/SL/TP | Fallback parsing, manual review flag |
| Point exploitation | Revenue loss | Server-side validation, transaction log |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page load time | < 2s |
| Analysis response time | < 10s |
| API error rate | < 1% |
| User satisfaction | > 4/5 |

---

## Next Steps

1. ✅ Spec approved
2. ⏳ Run `/plan` to decompose into tasks
3. ⏳ Setup project structure
4. ⏳ Implement MVP

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-23 | 1.0.0 | Initial spec |
