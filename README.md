# RecruitFlow AI - Deployment Guide

This project requires Node.js and a PostgreSQL database.

## Windows PowerShell Setup

If you are running this project on Windows and you see an error like `AuthorizationManager check failed` or `npm is not recognized`, it means your PowerShell Execution Policy is restricting scripts. 

To fix this, open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

If `npm` commands still fail due to being unrecognized, ensure Node.js is installed and added to your system PATH.
Alternatively, you can run commands directly using Node:
```powershell
node node_modules/next/dist/bin/next dev
node node_modules/next/dist/bin/next build
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Rename `.env.example` to `.env` and fill in your keys (especially `DATABASE_URL` which must be a PostgreSQL connection string).

3. **Database Setup**
   Push the schema to your remote PostgreSQL database and generate the Prisma Client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production (Vercel)**
   ```bash
   npm run build
   ```
