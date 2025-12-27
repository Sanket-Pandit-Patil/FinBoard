# Vercel Deployment Steps

## Current Step
You're being asked to select a scope. Choose "Sanket Patil's projects" and press Enter.

## Next Steps (Vercel CLI will ask):

1. **Link to existing project?** → Type `N` (No) to create a new project
2. **What's your project's name?** → Type `finboard` or press Enter for default
3. **In which directory is your code located?** → Press Enter (it should auto-detect `./`)
4. **Want to override the settings?** → Type `N` (No) unless you need custom settings

## After Deployment:
- Vercel will provide you with a deployment URL
- Your site will be live at: `https://finboard-xxxxx.vercel.app`
- You can add a custom domain later in Vercel dashboard

## Environment Variables:
If you need to add environment variables (like `NEXT_PUBLIC_FINNHUB_KEY`):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add your variables there

## Auto-Deploy:
- Every push to `main` branch will automatically trigger a new deployment
- You can see deployment status in Vercel dashboard

