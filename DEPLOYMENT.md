# Deploy Node.js API on EC2 with SSL

Manual setup for the **Express API** and the **Java livestream** service on the **same** Ubuntu EC2.

| Service | Path | Port (localhost) | Public host |
|---------|------|------------------|-------------|
| Node API | `backend/rest_server` | 3001 | `https://api.pixl-personal-project.online` |
| Livestream | `backend/livestream` | 8085 | `https://live.pixl-personal-project.online` |

MongoDB is Atlas (no local Mongo, no Postgres). Do not open **3001** or **8085** on the security group.

---

## 1. DNS and AWS

Point DNS:

```text
api.pixl-personal-project.online   →  EC2 public IP  (A record)
live.pixl-personal-project.online  →  same EC2 public IP  (A record)
```

Security group:

| Port | Source |
|------|--------|
| 22 | your IP |
| 80 | `0.0.0.0/0` |
| 443 | `0.0.0.0/0` |

Do not open **3001**. Node stays on localhost.

SSH:

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## 2. Packages on Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y git curl build-essential python3 nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2
node -v   # v20.x
```

---

## 3. Clone and env

```bash
cd ~
git clone https://github.com/YOUR_ORG/YOUR_REPO.git pixl
cd ~/pixl/backend/rest_server
git checkout main

nano .env
chmod 600 .env
```

Minimum `.env` (keep this file on the server only):

```env
PORT=3001
HOST=127.0.0.1
NODE_ENV=production
DATABASE_URL=mongodb+srv://USER:PASSWORD@CLUSTER/DB
JWT_SECRET_KEY=your-jwt-secret

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_POSTS=
S3_BUCKET_DM=
S3_BUCKET_GROUP_MSG=
S3_BUCKET_GROUP_DP=
S3_BUCKET_PROFILE=

EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=

LIVESTREAM_SERVICE_URL=http://127.0.0.1:8085
LIVESTREAM_JWT_SECRET=
LIVE_INTERNAL_SECRET=
LIVE_SIGNALING_URL=wss://live.pixl-personal-project.online/ws/live
FRONTEND_URL=https://pixl-personal-project.online
```

In Atlas → Network Access, allow the EC2 public IP.

Install and generate Prisma client:

```bash
cd ~/pixl/backend/rest_server
npm ci --omit=dev
npx prisma generate
```

---

## 4. PM2

```bash
cd ~/pixl/backend/rest_server
pm2 start server.js --name pixl-api --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

curl -s http://127.0.0.1:3001/
# expect: Hi there!!
```

---

## 5. Nginx + SSL

```bash
sudo tee /etc/nginx/sites-available/api.pixl-personal-project.online >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.pixl-personal-project.online;

    client_max_body_size 50M;
    client_body_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/api.pixl-personal-project.online /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
```

Wait until DNS for `api.pixl-personal-project.online` points at this instance, then:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.pixl-personal-project.online
```

Certbot edits the nginx site and renews automatically. Confirm:

```bash
curl -sI https://api.pixl-personal-project.online/
```

Do **not** put `proxy_pass` inside `if (...) { }`. Nginx will fail with `"proxy_pass" directive is not allowed here`. Do **not** add `Access-Control-Allow-Origin` in nginx. Express already sets it.

Replace the whole site file (HTTP + HTTPS). Then `nginx -t` must succeed before reload:

```bash
sudo tee /etc/nginx/sites-available/api.pixl-personal-project.online >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.pixl-personal-project.online;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api.pixl-personal-project.online;

    ssl_certificate /etc/letsencrypt/live/api.pixl-personal-project.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pixl-personal-project.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;
    client_body_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx
curl -sI https://api.pixl-personal-project.online/ \
  -H "Origin: https://pixl-personal-project.online"
# Access-Control-Allow-Origin must appear exactly once
```

---

## 6. Later updates

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~/pixl
git pull origin main
cd backend/rest_server
npm ci --omit=dev
npx prisma generate
pm2 restart pixl-api
pm2 status
curl -s http://127.0.0.1:3001/
```

---

## 7. Troubleshooting

```bash
pm2 status
pm2 logs pixl-api
pm2 restart pixl-api

sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx

curl -sv http://127.0.0.1:3001/
curl -s http://127.0.0.1:8085/health
sudo journalctl -u pixl-livestream -n 80 --no-pager
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## 8. Livestream Java on the same EC2

Node stays as it is. This adds Redis, Java 21, the Spring Boot JAR on **8085**, and nginx+SSL for `live.pixl-personal-project.online`.

Camera/WebRTC also needs Janus + coturn (UDP). Start with `JANUS_ENABLED=false` so the Java API and WebSocket come up first.

### Packages

```bash
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk redis-server
sudo systemctl enable --now redis-server
redis-cli ping
# PONG
java -version
# 21
```

### Env file (server only, not git)

Use the **same** Atlas URI as Node `DATABASE_URL`, and the **same** `LIVE_INTERNAL_SECRET` / `LIVESTREAM_JWT_SECRET` as `~/pixl/backend/rest_server/.env`.

```bash
nano ~/pixl/backend/livestream/.env
chmod 600 ~/pixl/backend/livestream/.env
```

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER/DB
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
SERVER_PORT=8085
JANUS_ENABLED=false
PIXL_NODE_URL=http://127.0.0.1:3001
LIVE_INTERNAL_SECRET=same-as-node
LIVESTREAM_JWT_SECRET=same-as-node-at-least-32-chars
LIVE_PUBLIC_BASE_URL=https://live.pixl-personal-project.online
LIVE_SIGNALING_URL=wss://live.pixl-personal-project.online/ws/live
LIVE_CORS_ORIGINS=https://pixl-personal-project.online
```

Allow this EC2 IP in Atlas Network Access (already done if Node works).

### Build and systemd

```bash
cd ~/pixl
git pull origin main
cd ~/pixl/backend/livestream
./gradlew bootJar -x test
ls build/libs/pixl-livestream-1.0.0.jar

sudo tee /etc/systemd/system/pixl-livestream.service >/dev/null <<'EOF'
[Unit]
Description=Pixl livestream
After=network.target redis-server.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/pixl/backend/livestream
EnvironmentFile=/home/ubuntu/pixl/backend/livestream/.env
ExecStart=/usr/bin/java -jar /home/ubuntu/pixl/backend/livestream/build/libs/pixl-livestream-1.0.0.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now pixl-livestream
sudo systemctl status pixl-livestream --no-pager
curl -s http://127.0.0.1:8085/health
curl -s http://127.0.0.1:8085/ready
```

`/health` should be `{"status":"ok","service":"pixl-livestream"}`. `/ready` should show `"database":"ok"`.

### Nginx + SSL for live

The certificate is already on disk. Write a site whose `server_name` is exactly `live.pixl-personal-project.online` (Certbot failed because that block was missing). Do **not** add CORS in nginx.

```bash
sudo tee /etc/nginx/sites-available/live.pixl-personal-project.online >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name live.pixl-personal-project.online;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name live.pixl-personal-project.online;

    ssl_certificate /etc/letsencrypt/live/live.pixl-personal-project.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/live.pixl-personal-project.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8085;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/live.pixl-personal-project.online /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -s https://live.pixl-personal-project.online/health
```

### Point Node at Java (same machine)

In `~/pixl/backend/rest_server/.env`:

```env
LIVESTREAM_SERVICE_URL=http://127.0.0.1:8085
LIVE_SIGNALING_URL=wss://live.pixl-personal-project.online/ws/live
LIVE_INTERNAL_SECRET=same-as-java
LIVESTREAM_JWT_SECRET=same-as-java
```

```bash
pm2 restart pixl-api
```

Frontend production env: `NUXT_PUBLIC_LIVE_WS_BASE=wss://live.pixl-personal-project.online/ws/live`

Phone shows **LIVE CONNECTED** but **Waiting for live video** when signaling works and ICE/TURN does not. On EC2:

```bash
curl -s https://checkip.amazonaws.com
grep -E '^(TURN_SERVER|STUN_URLS|JANUS_ENABLED)=' ~/pixl/backend/livestream/.env
```

`TURN_SERVER` and `STUN_URLS` must be that **public** IPv4, not `172.31.*`, `127.0.0.1`, or `localhost`.

Security group must allow **UDP** `3478`, `5349`, `10000-10200`, `49160-49200` from `0.0.0.0/0` (phones on cellular).

Rebuild coturn/janus after pulling this repo (coturn must be allowed to relay to Janus’s public IP):

```bash
cd ~/pixl/backend/livestream
git pull origin main
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com)
sudo JANUS_PUBLIC_IP="$PUBLIC_IP" TURN_EXTERNAL_IP="$PUBLIC_IP" TURN_SECRET='your-matching-secret' \
  docker compose up -d --build coturn janus
sudo systemctl restart pixl-livestream
```

### Later livestream updates

```bash
cd ~/pixl
git pull origin main
cd backend/livestream
./gradlew bootJar -x test
sudo systemctl restart pixl-livestream
curl -s http://127.0.0.1:8085/health
```

### WebRTC (Janus + coturn on the same EC2)

`JANUS_ENABLED=false` only fakes SDP. Chrome then fails with:

`Answerer must use either active or passive value for setup attribute`

Real camera/viewer media needs Janus and coturn.

Security group (in addition to 22/80/443):

| Port | Proto |
|------|--------|
| 3478 | TCP+UDP |
| 5349 | TCP+UDP |
| 10000–10200 | UDP |
| 49160–49200 | UDP |

Do **not** start the compose `redis` or `pixl-livestream` services (Redis and Java already run via systemd).

```bash
# public IPv4 of this instance
curl -s https://checkip.amazonaws.com

sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu
# log out and back in if docker permission denied

cd ~/pixl/backend/livestream
export JANUS_PUBLIC_IP=YOUR_EC2_PUBLIC_IP
export TURN_EXTERNAL_IP=YOUR_EC2_PUBLIC_IP
export TURN_SECRET=change-me-turn-secret
sudo docker compose up -d --build coturn janus
```

In `~/pixl/backend/livestream/.env` set:

```env
JANUS_ENABLED=true
JANUS_HTTP_URL=http://127.0.0.1:8088/janus
TURN_SERVER=YOUR_EC2_PUBLIC_IP
TURN_SECRET=change-me-turn-secret
TURN_REALM=pixl.local
STUN_URLS=stun:YOUR_EC2_PUBLIC_IP:3478
```

```bash
sudo systemctl restart pixl-livestream
curl -s http://127.0.0.1:8085/ready
# "media" should be ok
curl -s http://127.0.0.1:8088/janus
```

Then Go live again.
