# TruthFeed Production Deployment Guide (Supabase + Vercel)

This guide provides step-by-step instructions to deploy TruthFeed to Vercel with a Supabase PostgreSQL database.

---

## Prerequisites

Before starting, make sure you have:
1. A **GitHub** account.
2. A **Vercel** account linked to your GitHub.
3. A **Supabase** account.

---

## Step 1: Set Up Your Supabase Database

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and select your organization.
3. Choose a project name (e.g., `truthfeed-db`), set a secure **Database Password** (save this somewhere safe!), choose a region close to your Vercel deployment (e.g., US East / West), and click **Create new project**.
4. Once the database is provisioned, go to **Project Settings** (gear icon) > **Database**.
5. Scroll down to the **Connection string** section.
6. Copy both required connection strings:
   - **Transaction Connection Pooler URL** (`DATABASE_URL`):
     - Toggle the mode to **Transaction**.
     - Copy the URI string. It should look like:
       `postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct Connection URL** (`DIRECT_URL`):
     - Toggle the connection mode to **Session** (or copy the direct connection URI using port `5432` from the "Session" or "Direct" tab).
     - Copy the URI string. It should look like:
       `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`

---

## Step 2: Configure Environment Variables

Create or update your local `.env` file with these values, replacing placeholders with your actual details:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
GEMINI_API_KEY="your-actual-gemini-api-key"
FACT_CHECK_API_KEY="your-actual-fact-check-api-key"
NEXTAUTH_SECRET="your-generated-nextauth-secret" # Use `openssl rand -base64 32` to generate
NEXTAUTH_URL="https://your-app-domain.vercel.app" # Update after Vercel deployment
```

---

## Step 3: Run Database Migrations in Production

Now that you have your connection strings, apply the database schema to your Supabase instance:

1. Open your terminal at the root of the project.
2. Run the migration tool:
   ```bash
   npx prisma migrate deploy
   ```
   *Note: This command reads the migrations in `prisma/migrations` and applies them using the direct database port (configured as `DIRECT_URL`).*

---

## Step 4: Seed the Database with Outlets (Production)

Once the migrations are successfully applied, seed your database with the default media outlets (AP News, BBC, Reuters, etc.):

```bash
npx prisma db seed
```

---

## Step 5: Push Your Code to GitHub

1. Initialize a Git repository if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "prep for production: migrate to supabase postgresql"
   ```
2. Create a new repository on [GitHub](https://github.com/new). Do not initialize it with a README or gitignore.
3. Link your local project to the GitHub repository and push:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 6: Deploy to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your newly created GitHub repository.
4. Expand the **Environment Variables** section. Add all the variables from your `.env.example`:
   - `DATABASE_URL` (Supabase pooled URI)
   - `DIRECT_URL` (Supabase direct port 5432 URI)
   - `GEMINI_API_KEY`
   - `FACT_CHECK_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (Set this to the production URL, e.g. `https://your-app-name.vercel.app`)
5. Click **Deploy**. Vercel will build the project.
6. Once deployed, verify your application is successfully pulling data and rendering the TruthFeed landing page!
