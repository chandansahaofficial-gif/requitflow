# PostgreSQL Migration & Vercel Deployment

Since you want this to be a real production-ready SaaS, we are going to migrate the application away from the temporary SQLite database and connect it to a permanent **PostgreSQL** database before deploying to Vercel.

## Open Questions / User Action Required
> [!IMPORTANT]
> To proceed, I need a PostgreSQL connection URL. 
> 
> You can get a free one instantly from either [Supabase](https://supabase.com) or [Neon.tech](https://neon.tech). 
> 
> **Please reply to me with your Database Connection URL** (it should look something like `postgresql://postgres:password@host.com:5432/dbname`). Do not worry about security for now, as you can change the password later.

## Proposed Changes

### 1. Database Schema Update
#### [MODIFY] `prisma/schema.prisma`
- Change `provider = "sqlite"` to `provider = "postgresql"`.
- Update the `env("DATABASE_URL")` to point to your new connection string.

### 2. Environment Configuration
#### [MODIFY] `.env`
- Replace the local SQLite file path with your new Postgres URL.

### 3. Database Initialization
- Run `npx prisma db push` to construct all of our tables (Leads, Campaigns, Emails, Users) inside your new remote Postgres database.
- Run `npx prisma generate` to update the Next.js backend client.

### 4. Vercel Deployment Preparation
- Ensure `package.json` has the proper build scripts.
- Provide you with the exact terminal command (`npx vercel`) to push everything live.

## Verification Plan
1. Once you provide the URL, I will execute the migration.
2. I will test the connection by running a local database sync.
3. If successful, you will then deploy to Vercel!
