# Pixl — Docker / EC2 deployment

Single-host production stack: **Nginx → Nuxt + Express → MongoDB (1-node replica set) + MinIO**.

## Architecture notes

| Service | Image / build | Internal port | Host exposure |
|---------|---------------|---------------|---------------|
| nginx | `deploy/nginx` | 80 | `${HTTP_PORT:-80}` only |
| frontend | Nuxt 4 production (`.output`) | 3000 | no |
| backend | Express (`node server.js`) | 3001 | no |
| mongo | `mongo:7` + custom RS bootstrap | 27017 | no |
| minio | official MinIO | 9000/9001 | no |

**Replica set vs HA:** Prisma uses `$transaction`, which requires a MongoDB replica set. This compose runs **one** member (`rs0`). That satisfies Prisma. It does **not** give you EC2-level high availability — if the instance dies, the database dies. For real HA, use MongoDB Atlas (or multi-AZ) later.

**Why not 3 Mongo containers on one EC2?** They share the same failure domain and burn RAM. Keep one member here.

## First deploy (Ubuntu EC2)

```bash
# 1) Install Docker (Ubuntu 22.04/24.04)
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
# log out/in so docker group applies

# 2) Clone and configure
git clone <YOUR_REPO_URL> pixl
cd pixl
cp .env.example .env
nano .env   # set ALL CHANGE_ME values, DOMAIN, API_BASE, FRONTEND_URL, DATABASE_URL

# 3) Open security group: TCP 80 (and 443 later). Do NOT open 27017/9000.

# 4) Build & start
docker compose up -d --build

# 5) Apply Prisma schema to Mongo (first time)
docker compose exec backend npx prisma db push
```

### DNS

| Record | Value |
|--------|--------|
| `A` `project1.com` | EC2 Elastic IP |
| `A` `api.project1.com` | same Elastic IP |

Set in `.env`:

```env
DOMAIN=project1.com
API_BASE=https://api.project1.com
FRONTEND_URL=https://project1.com
```

Until TLS is configured, use `http://` in `API_BASE` / `FRONTEND_URL`.

### IP-only (no DNS yet)

```env
DOMAIN=localhost
API_BASE=http://YOUR_EC2_PUBLIC_IP/api
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
```

Nginx default server routes `/` → Nuxt and `/api/*` → Express.

## Day-2 operations

```bash
# Status
docker compose ps

# Logs
docker compose logs -f --tail=200
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo
docker compose logs -f minio
docker compose logs -f nginx

# Restart one service
docker compose restart backend

# Redeploy after git pull
git pull origin main
docker compose up -d --build
docker compose exec backend npx prisma db push   # if schema changed

# Stop
docker compose down
# Stop + DELETE volumes (destroys DB/media) — careful
docker compose down -v
```

## Backups

```bash
# List volumes
docker volume ls | grep pixl

# Mongo dump
docker compose exec -T mongo mongodump \
  -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive > "mongo-backup-$(date +%F).archive"

# MinIO data (volume)
docker run --rm -v pixl_minio_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/minio-backup-$(date +%F).tgz -C /data .
```

## Troubleshooting

```bash
# Backend health
curl -i http://127.0.0.1/api/          # IP-mode via nginx
curl -i http://127.0.0.1/              # frontend

# Enter backend shell
docker compose exec backend sh

# Mongo shell
docker compose exec mongo mongosh \
  -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin

# Check replica set
docker compose exec mongo mongosh \
  -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
  --eval 'rs.status()'

# Recreate mongo from scratch (DESTROYS DATA)
docker compose stop backend
docker compose rm -f mongo
docker volume rm pixl_mongo_data
docker compose up -d mongo
```

Common issues:

| Symptom | Likely cause |
|---------|----------------|
| backend unhealthy / Prisma errors | `DATABASE_URL` password mismatch or mongo still bootstrapping |
| media 404 / broken images | MinIO buckets missing — re-run `docker compose up minio-init` |
| frontend calls wrong API | rebuild frontend after changing `API_BASE` |
| upload fails | raise Nginx `client_max_body_size` (already 100m) |
| bcrypt / ffmpeg errors | backend image missing system packages (should be in Dockerfile) |

## CI/CD readiness (later)

This repo is structured so a GitHub Action can SSH to EC2 and run:

```bash
cd /opt/pixl && git pull && docker compose up -d --build
```

Do not commit `.env`. Store secrets in GitHub Actions secrets / EC2 `.env` only.

## Required code changes for Docker (already applied)

1. `MINIO_USE_SSL` honored (was hardcoded `false`)
2. Frontend media proxy rewrites Docker hostname `minio`
3. Backend binds `HOST=0.0.0.0` for container networking
