# Pixl — Docker / EC2 deployment

Single-host production stack: **Nginx → Nuxt + Express → MongoDB (1-node replica set)**. Media is stored in **AWS S3**.

## Architecture

| Service | Image / build | Internal port | Host exposure |
|---------|---------------|---------------|---------------|
| nginx | `deploy/nginx` | 80 | `${HTTP_PORT:-80}` only |
| frontend | Nuxt 4 production | 3000 | no |
| backend | Express (`node server.js`) | 3001 | no |
| mongo | `mongo:7` + RS bootstrap | 27017 | no |
| **S3** | AWS (external) | — | managed by AWS |

**Replica set vs HA:** Prisma `$transaction` needs a replica set. Compose runs **one** member. That is not EC2-level HA.

## First deploy (Ubuntu EC2)

```bash
# Install Docker (see previous docs / Docker CE install)
git clone <YOUR_REPO_URL> pixl
cd pixl
cp .env.example .env
nano .env   # DOMAIN, API_BASE, Mongo passwords, AWS_*, S3_BUCKET_*, JWT, email

# Security group: TCP 80 (and 443 later). Do NOT open 27017.

docker compose up -d --build
docker compose exec backend npx prisma db push
```

### AWS S3 setup

1. Create buckets named in `.env` (`S3_BUCKET_POSTS`, etc.) in `AWS_REGION`.
2. IAM user/role needs at least: `s3:PutObject`, `s3:GetObject`, `s3:HeadObject`, `s3:CreateBucket` (optional), `s3:PutBucketPolicy` (optional).
3. For public media in the browser, either:
   - allow public `s3:GetObject` on the buckets (app tries to set this), or
   - set `S3_PUBLIC_BASE_URL` to a CloudFront distribution URL.
4. Put `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` in `.env`.

### DNS

| Record | Points to |
|--------|-----------|
| `A` `project1.com` | EC2 Elastic IP |
| `A` `api.project1.com` | same |

```env
DOMAIN=project1.com
API_BASE=https://api.project1.com
FRONTEND_URL=https://project1.com
```

IP-only:

```env
DOMAIN=localhost
API_BASE=http://YOUR_EC2_PUBLIC_IP/api
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
```

## Day-2 operations

```bash
docker compose ps
docker compose logs -f --tail=200
docker compose logs -f backend
docker compose restart backend

git pull origin main
docker compose up -d --build
docker compose exec backend npx prisma db push   # if schema changed

docker compose down
```

## Backups

```bash
# Mongo
docker compose exec -T mongo mongodump \
  -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive > "mongo-backup-$(date +%F).archive"

# S3: use AWS Backup / aws s3 sync
aws s3 sync s3://pixl-posts ./backup/posts
```

## Troubleshooting

```bash
curl -i http://127.0.0.1/
curl -i http://127.0.0.1/api/
docker compose exec backend sh
docker compose exec mongo mongosh -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin
```

| Symptom | Likely cause |
|---------|----------------|
| Prisma / DB errors | `DATABASE_URL` password mismatch or mongo still bootstrapping |
| Upload fails | bad AWS keys, wrong region, or missing bucket |
| Broken images | bucket not public / CloudFront misconfigured; check stored URL in DB |

## CI/CD readiness

SSH deploy sketch: `.github/workflows/deploy-ec2.yml.example`
