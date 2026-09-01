# Deploy Node.js API on EC2 with SSL

Manual setup for **api.pixl-personal-project.online**.

- App: `backend/rest_server`
- Start: `node server.js` (port **3001**)
- Database: MongoDB Atlas via `DATABASE_URL` in `.env` (do not install MongoDB on EC2)
- Process: PM2
- TLS: Nginx + Let’s Encrypt (Certbot)

---

## 1. DNS and AWS

Point DNS:

```text
api.pixl-personal-project.online  →  EC2 public IP  (A record)
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
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
            add_header Access-Control-Max-Age 86400 always;
            add_header Vary Origin always;
            add_header Content-Length 0 always;
            return 204;
        }

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

        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Vary Origin always;
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

If the browser shows CORS errors (`No 'Access-Control-Allow-Origin' header` on preflight), Certbot’s HTTPS `server` block is probably answering `OPTIONS` without those headers. Put the same `if ($request_method = OPTIONS)` block from above into **both** the `:80` and `:443` `location /` blocks, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI -X OPTIONS https://api.pixl-personal-project.online/users/notifications \
  -H "Origin: https://pixl-personal-project.online" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization"
# must include: Access-Control-Allow-Origin: https://pixl-personal-project.online
```

Also confirm Node is up (`pm2 status` and `curl -s http://127.0.0.1:3001/`). A 502 from nginx looks like a CORS error in the browser.

Also set `FRONTEND_URL=https://pixl-personal-project.online` in the API `.env`.

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
sudo certbot certificates
sudo certbot renew --dry-run
```
