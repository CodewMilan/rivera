# Rivera

An AI product-launch organization for technical founders. A goal becomes a plan, the plan becomes tasks, specialists use tools, and nothing irreversible happens without a human gate.

## Quick start

```bash
npm install
cp .env.example .env
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and submit the Stellar/Soroban demo goal.

## Persistence

- Default: in-memory store (fine for tests and a single-process demo)
- Postgres: set `DATABASE_URL` and `RIVERA_STORE=postgres`, then `npm run migrate`

## Providers

Leave keys empty to run labeled demo fixtures. Set them to go live:

- `LLM_API_KEY` — OpenAI-compatible CEO and specialist calls
- `HIGGSFIELD_API_KEY_ID` / `HIGGSFIELD_API_KEY_SECRET` — media generation
- `X_BEARER_TOKEN` — the one real publish path

CI never calls live providers. Optional smokes: `LIVE=1 npm test`.

## What this build is

A two-week Rivera slice: intake, live orchestrator, specialists, Higgsfield jobs, debate, approvals, social review, one publish path, and a scored final report.

## What this build is not

Multi-platform analytics, ads, auth/teams, an agent marketplace, or unattended publishing.
