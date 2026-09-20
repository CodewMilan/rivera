# Rivera

An AI product-launch organization for technical founders.

**Current phase: 3. Tools, media, and evaluation.** After a run starts, Rivera searches public sources, scores specialist output, generates Higgsfield previews, and waits for human review before anything publishes.

## Quick start

```bash
pnpm install
createdb rivera
cp .env.example .env
pnpm migrate
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), submit the demo goal, and watch the organization dashboard. Product docs live at [/docs](http://localhost:3000/docs).

Leave `LLM_API_KEY` empty to run in demo mode with labeled fixtures. Set it to use a live OpenAI-compatible model. Optional: `TAVILY_API_KEY`, `GITHUB_TOKEN`, and Higgsfield keys for live tools and media.

## Persistence

Postgres is required for the app (`DATABASE_URL` and `RIVERA_STORE=postgres`). The first request migrates the schema automatically.

Unit tests use an in-memory store. Persistence tests talk to the real `rivera` database.

## Deploy

Vercel + a hosted Postgres (Neon, Supabase, or Vercel Postgres) is the default path.

1. Create a Clerk **production** application and add the deploy domain.
2. Create a Postgres database and copy the **pooled** connection string into `DATABASE_URL`. Use `sslmode=require` (Neon/Supabase already do).
3. Import the project in Vercel, set the env vars from `.env.example`, and deploy. `pnpm build` is the build command; `RIVERA_STORE=postgres` should stay set.
4. After the first deploy, set `APP_URL` (and optionally `HIGGSFIELD_WEBHOOK_URL`) to the production origin so Higgsfield callbacks reach `/api/webhooks/higgsfield`.
5. Optional: set `S3_BUCKET`, `AWS_REGION`, and AWS keys so completed media is copied into S3. Hit `/api/health` and confirm `s3: configured`. Give the IAM user `s3:PutObject` on `s3://$S3_BUCKET/orgs/*`. For public dashboard playback, either allow `s3:GetObject` on that prefix or put CloudFront in front and set `S3_PUBLIC_BASE_URL`.
6. Hit `/api/health`. It should report `store: postgres` and `database: ok`.

Long Rivera runs need a **Vercel Pro** function limit (route `maxDuration` is 300s). Hobby plans will cut live LLM runs short; POST `/api/organizations/:id/runs` again to resume a non-terminal run.

Self-host with the included `Dockerfile` if you need the full 15-minute orchestrator window:

```bash
docker build -t rivera .
docker run --env-file .env -p 3000:3000 rivera
```

Do not commit `.env` or Clerk secret keys. Production must set `DATABASE_URL`; the in-memory store is rejected unless `ALLOW_MEMORY_STORE=true`.
/api) and connect it per-organization. Rivera verifies the key against Cursor's `/v1/me`, stores it AES-256-GCM encrypted, and uses it only when the user clicks **Build with Cursor**.

Long Rivera runs need a **Vercel Pro** function limit (route `maxDuration` is 300s). Hobby plans will cut live LLM runs short; POST `/api/organizations/:id/runs` again to resume a non-terminal run.

Self-host with the included `Dockerfile` if you need the full 15-minute orchestrator window:

```bash
docker build -t rivera .
docker run --env-file .env -p 3000:3000 rivera
```

Do not commit `.env` or Clerk secret keys. Production must set `DATABASE_URL`; the in-memory store is rejected unless `ALLOW_MEMORY_STORE=true`.
