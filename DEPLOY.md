# Deployment Guide

## Push to GitHub

1. **Create a new repository on GitHub** (if you don't have one):
   - Go to https://github.com/new
   - Name it (e.g., "finboard")
   - Don't initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Add remote and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Deploy to Vercel (Recommended for Next.js)

1. **Install Vercel CLI** (optional, or use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables if needed (e.g., `NEXT_PUBLIC_FINNHUB_KEY`)
   - Click "Deploy"

3. **Deploy via CLI**:
   ```bash
   vercel
   ```

## Environment Variables

Make sure to add these in your deployment platform:
- `NEXT_PUBLIC_FINNHUB_KEY` - Your Finnhub API key (if using)

## Build Command

The project uses standard Next.js build:
```bash
npm run build
```

