# AI Trading - VPS Deployment Guide

## Yêu cầu VPS

| Spec | Minimum | Recommended |
|------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

**VPS providers phổ biến**: DigitalOcean, Vultr, Linode, Hetzner, Contabo

---

## 1. Setup VPS ban đầu

### 1.1 SSH vào VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Tạo user mới (không dùng root)
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 1.3 Cài đặt Docker & Docker Compose
```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout và login lại để apply group
exit
ssh deploy@your-vps-ip
```

### 1.4 Cài Nginx & Certbot (SSL)
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 2. Clone và cấu hình project

### 2.1 Clone repository
```bash
cd ~
git clone https://github.com/your-username/AITrading.git
cd AITrading
```

### 2.2 Tạo file .env cho production
```bash
# Backend
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/ai_trading?schema=public
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-change-this
JWT_EXPIRES_IN=15m
MT5_API_URL=http://mt5-api:8000
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com
EOF

# MT5 API
cat > mt5-api/.env << 'EOF'
USE_MOCK_DATA=true
PORT=8000
EOF
```

### 2.3 Build frontend cho production
```bash
# Landing
cd landing
npm install
npm run build

# Dashboard
cd ../dashboard
npm install
echo "VITE_API_URL=https://api.yourdomain.com/api/v1" > .env.production
npm run build

# Admin
cd ../admin
npm install
echo "VITE_API_URL=https://api.yourdomain.com/api/v1" > .env.production
npm run build

cd ..
```

---

## 3. Docker Compose cho Production

### 3.1 Tạo docker-compose.prod.yml
```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: ai_trading
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env
    depends_on:
      - db
    networks:
      - backend-network

  mt5-api:
    build:
      context: ./mt5-api
      dockerfile: Dockerfile
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - ./mt5-api/.env
    networks:
      - backend-network

volumes:
  postgres_data:

networks:
  backend-network:
    driver: bridge
EOF
```

### 3.2 Chạy services
```bash
docker-compose -f docker-compose.prod.yml up -d --build

# Kiểm tra logs
docker-compose -f docker-compose.prod.yml logs -f

# Kiểm tra health
curl http://localhost:3001/health
curl http://localhost:8000/health
```

---

## 4. Cấu hình Nginx

### 4.1 Tạo config cho các services

```bash
sudo nano /etc/nginx/sites-available/aitrading
```

Paste nội dung sau (thay `yourdomain.com` bằng domain thật):

```nginx
# Landing Page - yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /home/deploy/AITrading/landing/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    location /_next/static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# User Dashboard - app.yourdomain.com
server {
    listen 80;
    server_name app.yourdomain.com;
    root /home/deploy/AITrading/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin Dashboard - admin.yourdomain.com
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /home/deploy/AITrading/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API - api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Enable site
```bash
sudo ln -s /etc/nginx/sites-available/aitrading /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Cấu hình DNS

Tại DNS provider (Cloudflare, Namecheap, etc.), tạo các A records:

| Type | Name | Value |
|------|------|-------|
| A | @ | your-vps-ip |
| A | www | your-vps-ip |
| A | app | your-vps-ip |
| A | admin | your-vps-ip |
| A | api | your-vps-ip |

---

## 6. Cài SSL với Certbot

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d app.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## 7. Seed dữ liệu ban đầu

```bash
# Vào container backend
docker-compose -f docker-compose.prod.yml exec backend sh

# Chạy seed (nếu có)
npx prisma db seed

# Hoặc tạo admin user thủ công
npx prisma studio
```

---

## 8. Maintenance Commands

### Xem logs
```bash
# Tất cả services
docker-compose -f docker-compose.prod.yml logs -f

# Chỉ backend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart

# Chỉ restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Update code
```bash
cd ~/AITrading
git pull origin main

# Rebuild và restart
docker-compose -f docker-compose.prod.yml up -d --build

# Rebuild frontend
cd landing && npm run build
cd ../dashboard && npm run build
cd ../admin && npm run build
```

### Backup database
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres ai_trading > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
cat backup_20260531.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres ai_trading
```

---

## 9. Monitoring (Optional)

### Cài đặt monitoring đơn giản với htop và ctop
```bash
sudo apt install htop
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Xem resource usage
htop
ctop
```

### Cron job để kiểm tra health
```bash
crontab -e

# Thêm dòng này - check mỗi 5 phút
*/5 * * * * curl -sf http://localhost:3001/health || echo "Backend down" | mail -s "Alert" your@email.com
```

---

## 10. Security Checklist

- [ ] Đổi port SSH (không dùng 22)
- [ ] Setup UFW firewall
- [ ] Disable root login
- [ ] Setup fail2ban
- [ ] Đổi password mặc định PostgreSQL
- [ ] Đổi JWT_SECRET thành chuỗi random dài

### UFW Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Architecture trên VPS

```
                     ┌─────────────────┐
                     │   Internet      │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │     Nginx       │
                     │  (Reverse Proxy)│
                     │  + SSL/HTTPS    │
                     └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼────┐          ┌─────▼────┐
   │ Static  │          │ Static   │          │ Static   │
   │ Landing │          │ Dashboard│          │  Admin   │
   │  /out   │          │  /dist   │          │  /dist   │
   └─────────┘          └──────────┘          └──────────┘
                              │
                     ┌────────▼────────┐
                     │  Docker Network │
                     └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼────┐          ┌─────▼────┐
   │ Backend │◄────────►│PostgreSQL│          │ MT5 API  │
   │  :3001  │          │  :5432   │          │  :8000   │
   └─────────┘          └──────────┘          └──────────┘
```

---

## Chi phí ước tính

| Provider | Plan | Price/month |
|----------|------|-------------|
| DigitalOcean | Basic 2GB | $12 |
| Vultr | Cloud Compute 2GB | $10 |
| Hetzner | CX21 | €4.85 (~$5) |
| Contabo | VPS S | €4.99 (~$5) |

> **Tip**: Hetzner và Contabo có giá tốt nhất cho VPS ở châu Âu.
