# AI Trading - Windows VPS Deployment Guide

## Yêu cầu

- Windows Server 2019/2022 hoặc Windows 10/11
- RAM: 4GB+
- Administrator access

---

## 1. Cài đặt phần mềm cần thiết

### 1.1 Node.js
1. Tải từ https://nodejs.org/ (LTS version, vd: 20.x)
2. Chạy installer, chọn "Add to PATH"
3. Mở PowerShell kiểm tra:
```powershell
node -v
npm -v
```

### 1.2 Python
1. Tải từ https://www.python.org/downloads/ (3.11+)
2. Chạy installer, **QUAN TRỌNG**: Check ✅ "Add Python to PATH"
3. Kiểm tra:
```powershell
python --version
pip --version
```

### 1.3 PostgreSQL
1. Tải từ https://www.postgresql.org/download/windows/
2. Chạy installer:
   - Port: 5432
   - Password: đặt password mạnh (vd: `YourSecurePassword123!`)
   - Locale: Vietnamese hoặc English
3. Kiểm tra service đang chạy:
```powershell
Get-Service postgresql*
```

### 1.4 Git
1. Tải từ https://git-scm.com/download/win
2. Cài đặt với default options

### 1.5 PM2 (Process Manager cho Node.js)
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

---

## 2. Clone và cấu hình Project

### 2.1 Clone repository
```powershell
cd C:\
git clone https://github.com/your-username/AITrading.git
cd C:\AITrading
```

### 2.2 Tạo Database
Mở pgAdmin hoặc dùng psql:
```powershell
# Mở PowerShell as Admin
psql -U postgres

# Trong psql console:
CREATE DATABASE ai_trading;
\q
```

### 2.3 Cấu hình Backend
```powershell
cd C:\AITrading\backend

# Copy và edit .env
copy .env.example .env
notepad .env
```

Sửa file `.env`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:YourSecurePassword123!@localhost:5432/ai_trading?schema=public
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-change-this
JWT_EXPIRES_IN=15m
MT5_API_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,https://yourdomain.com
```

### 2.4 Cài dependencies và migrate database
```powershell
cd C:\AITrading\backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 2.5 Cấu hình MT5 API
```powershell
cd C:\AITrading\mt5-api
pip install -r requirements.txt

# Tạo file .env
echo USE_MOCK_DATA=true > .env
echo PORT=8000 >> .env
```

### 2.6 Build Frontend
```powershell
# Landing
cd C:\AITrading\landing
npm install
npm run build

# Dashboard
cd C:\AITrading\dashboard
npm install
echo VITE_API_URL=http://your-vps-ip:3001/api/v1 > .env.production
npm run build

# Admin
cd C:\AITrading\admin
npm install
echo VITE_API_URL=http://your-vps-ip:3001/api/v1 > .env.production
npm run build
```

---

## 3. Chạy Services với PM2

### 3.1 Tạo PM2 ecosystem file
```powershell
cd C:\AITrading
notepad ecosystem.config.js
```

Paste nội dung:
```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: 'C:\\AITrading\\backend',
      script: 'dist\\index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'landing',
      cwd: 'C:\\AITrading\\landing',
      script: 'node_modules\\next\\dist\\bin\\next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true
    }
  ]
};
```

### 3.2 Build backend và start services
```powershell
cd C:\AITrading\backend
npm run build

cd C:\AITrading
pm2 start ecosystem.config.js
pm2 save
```

### 3.3 Chạy MT5 API như Windows Service
Tạo file `C:\AITrading\mt5-api\start.bat`:
```batch
@echo off
cd C:\AITrading\mt5-api
python main.py
```

Dùng NSSM để tạo Windows Service:
```powershell
# Tải NSSM từ https://nssm.cc/download
# Giải nén và copy nssm.exe vào C:\Windows\System32

nssm install MT5API "C:\AITrading\mt5-api\start.bat"
nssm start MT5API
```

Hoặc đơn giản hơn, chạy trong PowerShell:
```powershell
cd C:\AITrading\mt5-api
Start-Process python -ArgumentList "main.py" -WindowStyle Hidden
```

---

## 4. Serve Frontend với IIS hoặc http-server

### Option A: Dùng http-server (đơn giản)

```powershell
npm install -g http-server

# Serve dashboard (port 5173)
cd C:\AITrading\dashboard\dist
Start-Process http-server -ArgumentList "-p 5173 -c-1 --proxy http://localhost:5173?" -WindowStyle Hidden

# Serve admin (port 5174)  
cd C:\AITrading\admin\dist
Start-Process http-server -ArgumentList "-p 5174 -c-1 --proxy http://localhost:5174?" -WindowStyle Hidden
```

### Option B: Dùng IIS (production-ready)

1. **Cài IIS**:
   - Mở Server Manager → Add Roles and Features
   - Chọn Web Server (IIS)
   - Cài thêm: URL Rewrite Module từ https://www.iis.net/downloads/microsoft/url-rewrite

2. **Tạo Sites trong IIS Manager**:

   **Landing (port 80)**:
   - Physical path: `C:\AITrading\landing\out`
   - Binding: port 80

   **Dashboard (port 5173)**:
   - Physical path: `C:\AITrading\dashboard\dist`
   - Binding: port 5173

   **Admin (port 5174)**:
   - Physical path: `C:\AITrading\admin\dist`  
   - Binding: port 5174

3. **Thêm URL Rewrite cho SPA** (dashboard & admin):
   
   Tạo file `web.config` trong mỗi folder dist:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="SPA Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/index.html" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

---

## 5. Mở Firewall

```powershell
# Mở các port cần thiết
New-NetFirewallRule -DisplayName "Landing" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Backend API" -Direction Inbound -Port 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Dashboard" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Admin" -Direction Inbound -Port 5174 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "MT5 API" -Direction Inbound -Port 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Port 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Port 443 -Protocol TCP -Action Allow
```

---

## 6. Kiểm tra Services

```powershell
# Kiểm tra PM2
pm2 status

# Kiểm tra health endpoints
Invoke-WebRequest -Uri http://localhost:3001/health
Invoke-WebRequest -Uri http://localhost:8000/health

# Kiểm tra từ browser
# Landing: http://your-vps-ip:3000
# Dashboard: http://your-vps-ip:5173
# Admin: http://your-vps-ip:5174
# API: http://your-vps-ip:3001/health
```

---

## 7. Reverse Proxy với IIS (Optional - dùng domain)

Nếu muốn dùng domain và SSL, cài **IIS Application Request Routing (ARR)**:

1. Tải và cài: https://www.iis.net/downloads/microsoft/application-request-routing

2. Tạo reverse proxy rules trong IIS:

```xml
<!-- C:\inetpub\wwwroot\web.config -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- API proxy -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        
        <!-- Dashboard proxy -->
        <rule name="Dashboard" stopProcessing="true">
          <match url="^app/(.*)" />
          <action type="Rewrite" url="http://localhost:5173/{R:1}" />
        </rule>
        
        <!-- Admin proxy -->
        <rule name="Admin" stopProcessing="true">
          <match url="^admin/(.*)" />
          <action type="Rewrite" url="http://localhost:5174/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## 8. SSL với Win-ACME (Let's Encrypt)

1. Tải win-acme: https://www.win-acme.com/
2. Giải nén và chạy `wacs.exe`
3. Làm theo wizard để tạo certificate cho domain

---

## 9. Maintenance Scripts

### start-all.ps1
```powershell
# C:\AITrading\scripts\start-all.ps1
Write-Host "Starting AI Trading services..."

# Start PM2 apps
pm2 start C:\AITrading\ecosystem.config.js

# Start MT5 API
Start-Process python -ArgumentList "C:\AITrading\mt5-api\main.py" -WorkingDirectory "C:\AITrading\mt5-api" -WindowStyle Hidden

# Start frontend servers (nếu không dùng IIS)
Start-Process http-server -ArgumentList "C:\AITrading\dashboard\dist -p 5173 -c-1" -WindowStyle Hidden
Start-Process http-server -ArgumentList "C:\AITrading\admin\dist -p 5174 -c-1" -WindowStyle Hidden

Write-Host "All services started!"
pm2 status
```

### stop-all.ps1
```powershell
# C:\AITrading\scripts\stop-all.ps1
pm2 stop all
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Write-Host "All services stopped!"
```

### update.ps1
```powershell
# C:\AITrading\scripts\update.ps1
cd C:\AITrading

# Pull latest code
git pull origin main

# Update backend
cd backend
npm install
npm run build
npx prisma migrate deploy

# Update frontend
cd ..\dashboard
npm install
npm run build

cd ..\admin
npm install
npm run build

cd ..\landing
npm install
npm run build

# Restart services
cd ..
pm2 restart all

Write-Host "Update complete!"
```

### backup-db.ps1
```powershell
# C:\AITrading\scripts\backup-db.ps1
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "C:\AITrading\backups"

if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
}

& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U postgres -d ai_trading -f "$backupPath\backup_$date.sql"

Write-Host "Backup saved to $backupPath\backup_$date.sql"
```

---

## 10. Auto-start khi Windows khởi động

### Tạo Scheduled Task
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\AITrading\scripts\start-all.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
Register-ScheduledTask -TaskName "AITrading-Startup" -Action $action -Trigger $trigger -Principal $principal
```

---

## Architecture trên Windows VPS

```
                    ┌──────────────────┐
                    │    Internet      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Windows VPS     │
                    │  (IIS/Firewall)  │
                    └────────┬─────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
┌────▼────┐            ┌─────▼────┐            ┌─────▼────┐
│ Landing │            │Dashboard │            │  Admin   │
│  :3000  │            │  :5173   │            │  :5174   │
│ (Next)  │            │ (Static) │            │ (Static) │
└─────────┘            └──────────┘            └──────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
        ┌─────▼─────┐                 ┌─────▼─────┐
        │  Backend  │                 │  MT5 API  │
        │   :3001   │                 │   :8000   │
        │  (PM2)    │                 │ (Python)  │
        └─────┬─────┘                 └───────────┘
              │
        ┌─────▼─────┐
        │PostgreSQL │
        │   :5432   │
        └───────────┘
```

---

## Quick Start Checklist

- [ ] Cài Node.js, Python, PostgreSQL, Git
- [ ] Clone repo vào `C:\AITrading`
- [ ] Tạo database `ai_trading`
- [ ] Cấu hình `backend\.env`
- [ ] Chạy `npm install` và `prisma migrate`
- [ ] Build frontend (landing, dashboard, admin)
- [ ] Cài PM2 và start services
- [ ] Mở firewall ports
- [ ] Test từ browser
- [ ] (Optional) Cấu hình domain + SSL
