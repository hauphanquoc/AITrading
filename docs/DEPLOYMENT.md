# AI Trading - Deployment Guide

## Architecture Overview

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  (Frontend)  │
                    └──────┬───────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
┌────┴────┐          ┌─────┴────┐          ┌─────┴────┐
│ Landing │          │ Dashboard│          │  Admin   │
│  :3000  │          │  :5173   │          │  :5174   │
└─────────┘          └──────────┘          └──────────┘
                           │
                    ┌──────┴───────┐
                    │   Railway    │
                    │  (Backend)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴────┐    ┌──────┴─────┐    ┌─────┴────┐
    │ Backend  │    │ PostgreSQL │    │ MT5 API  │
    │  :3001   │    │   :5432    │    │  :8000   │
    └──────────┘    └────────────┘    └──────────┘
```

## 1. Backend Deployment (Railway)

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected

### Steps

1. **Create PostgreSQL database**
   - In Railway dashboard, click "New Project" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` connection string

2. **Deploy Backend**
   ```bash
   cd backend
   railway login
   railway init
   railway link
   ```

3. **Set Environment Variables** in Railway:
   ```
   DATABASE_URL=<from step 1>
   JWT_SECRET=<generate secure 32+ char string>
   JWT_EXPIRES_IN=15m
   GEMINI_API_KEY=<your Gemini API key>
   MT5_API_URL=<MT5 API Railway URL>
   CORS_ORIGINS=<frontend URLs comma-separated>
   NODE_ENV=production
   PORT=3001
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### MT5 API Deployment

1. **Create new service** in the same Railway project
2. Connect MT5 API directory
3. Set environment:
   ```
   USE_MOCK_DATA=true  # or false if MT5 connected
   PORT=8000
   ```

## 2. Frontend Deployment (Vercel)

### Landing Page

1. **Import from GitHub**
   - Go to https://vercel.com/new
   - Select your repository
   - Set Root Directory: `landing`

2. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=<Railway backend URL>
   ```

3. Deploy automatically on push to main

### User Dashboard

1. **Import from GitHub**
   - Root Directory: `dashboard`

2. **Environment Variables**:
   ```
   VITE_API_URL=<Railway backend URL>/api/v1
   ```

### Admin Dashboard

1. **Import from GitHub**
   - Root Directory: `admin`

2. **Environment Variables**:
   ```
   VITE_API_URL=<Railway backend URL>/api/v1
   ```

## 3. Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| JWT_SECRET | JWT signing key (32+ chars) | your-secret-key |
| JWT_EXPIRES_IN | Token expiration | 15m |
| GEMINI_API_KEY | Google Gemini API key | AIza... |
| MT5_API_URL | MT5 Python API URL | http://localhost:8000 |
| CORS_ORIGINS | Allowed origins | https://app.com |
| NODE_ENV | Environment | production |
| PORT | Server port | 3001 |

### Dashboard/Admin (Vite)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | https://api.aitrading.com/api/v1 |

### Landing (Next.js)
| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | https://api.aitrading.com |

## 4. Database Migration

Migrations run automatically on deploy via Railway's start command:
```bash
npx prisma migrate deploy && node dist/index.js
```

For manual migration:
```bash
npx prisma migrate deploy
```

## 5. Monitoring

### Health Checks
- Backend: `GET /health`
- MT5 API: `GET /health`

### Logs
- Railway: Dashboard → Service → Logs
- Vercel: Dashboard → Project → Functions tab

## 6. Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS (CNAME to cname.vercel-dns.com)

### Railway
1. Go to Service Settings → Domains
2. Add custom domain
3. Configure DNS (CNAME to railway.app domain)

## 7. SSL/HTTPS

Both Vercel and Railway provide automatic SSL certificates.

## 8. Rollback

### Vercel
- Go to Deployments → Select previous → "Redeploy"

### Railway
- Go to Deployments → Select previous → "Rollback"
