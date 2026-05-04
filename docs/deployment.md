# Deployment Guide: Railway + Vercel

This guide explains how to deploy the Zomato AI Recommendation system using:
- **Railway** for the backend (Node.js/Express API)
- **Vercel** for the frontend (React + Vite)

---

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Groq API Key**: Get your API key from [console.groq.com](https://console.groq.com)
3. **Accounts**:
   - Railway account at [railway.app](https://railway.app)
   - Vercel account at [vercel.com](https://vercel.com)

---

## Part 1: Backend Deployment on Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Connect your GitHub repository
4. Select the repository: `pbehuray/m1-zomato`

### Step 2: Configure Service

**Service Name**: `zomato-backend` (or any name you prefer)

**Root Directory**: `backend`

**Build Command**:
```bash
npm install
```

**Start Command**:
```bash
node src/server.js
```

**Environment Variables** (click "Variables" → "New Variable"):
```
GROQ_API_KEY = your_actual_groq_api_key_here
FRONTEND_URL = https://your-frontend.vercel.app
NODE_ENV = production
PORT = 3001
```

**Region**: Choose the region closest to your users (e.g., Oregon, Singapore)

**Plan**:
- Free: 512MB RAM, 0.5 CPU (spins down after inactivity)
- Hobby ($5/mo): 512MB RAM, always on
- Pro ($20/mo): 1GB RAM, better performance

### Step 3: Deploy

Click **"Deploy"**. Railway will:
1. Clone your repository
2. Run `npm install` in the `backend/` directory
3. Start the server with `node src/server.js`
4. Assign a URL like `https://zomato-backend-production.up.railway.app`

### Step 4: Verify Deployment

Once deployed, test the health endpoint:
```bash
curl https://your-backend.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Create Vercel Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Connect your GitHub repository
4. Select the repository: `pbehuray/m1-zomato`

### Step 2: Configure Project

**Framework Preset**: **Vite**

**Root Directory**: `frontend`

**Build Command**: `npm run build`

**Output Directory**: `dist`

**Install Command**: `npm install`

**Environment Variables** (click "Environment Variables"):
```
VITE_API_URL = https://your-backend.onrender.com
```

### Step 3: Deploy

Click **"Deploy"**. Vercel will:
1. Clone your repository
2. Install dependencies in the `frontend/` directory
3. Build the React app with Vite
4. Deploy to CDN with a URL like `https://your-frontend.vercel.app`

### Step 4: Update Backend CORS

After getting your Vercel URL, go back to Railway:
1. Open your Railway project
2. Go to **"Variables"** section
3. Update `FRONTEND_URL` to your actual Vercel URL
4. Click **"Save"** (this will trigger a redeploy)

---

## Part 3: Configuration Files

### Backend Configuration

The backend uses the following configuration:

**backend/package.json** - Dependencies and scripts
```json
{
  "scripts": {
    "start": "node src/server.js"
  }
}
```

**backend/src/server.js** - Express server
- Uses `process.env.PORT` (Render provides this automatically)
- CORS configured to allow requests from `FRONTEND_URL`

### Frontend Configuration

**frontend/vercel.json** - Vercel deployment config
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend.onrender.com"
  }
}
```

**frontend/src/services/api.js** - API service
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000
})
```

---

## Part 4: Troubleshooting

### Backend Issues

**Issue: "npm command not found"**
- Ensure "Root Directory" is set to `backend` in Railway settings
- Check that `package.json` exists in the `backend/` directory
- Verify Nixpacks is using Node.js (check `nixpacks.toml` if present)

**Issue: "Module not found"**
- Verify all dependencies are in `backend/package.json`
- Check that imports use relative paths correctly

**Issue: CORS errors**
- Ensure `FRONTEND_URL` matches your Vercel URL exactly
- Check that the backend CORS configuration is correct

**Issue: Service spins down (Free tier)**
- Upgrade to Hobby tier ($5/mo) for always-on service
- Or accept 30-50 second cold start on free tier

### Frontend Issues

**Issue: Build fails**
- Ensure all dependencies are in `frontend/package.json`
- Check that Vite config is correct (`vite.config.js`)

**Issue: API calls failing**
- Verify `VITE_API_URL` is set in Vercel environment variables
- Check browser console for CORS errors
- Test backend URL directly with curl

**Issue: Environment variables not working**
- Vercel requires variables to start with `VITE_` for client-side access
- After adding variables, redeploy the project

---

## Part 5: Cost Summary

### Railway (Backend)
- **Free**: $0 (spins down after inactivity)
- **Hobby**: $5/mo (512MB RAM, always on)
- **Pro**: $20/mo (1GB RAM, better performance)

### Vercel (Frontend)
- **Hobby**: $0 (100GB bandwidth, 6 builds/day)
- **Pro**: $20/mo (1TB bandwidth, unlimited builds)

**Total Minimum Cost**: $5/mo (Hobby backend + Free frontend)

---

## Part 6: Monitoring & Logs

### Railway Logs
1. Go to your project in Railway dashboard
2. Click **"Logs"** tab
3. View real-time logs, build logs, and deployment history

### Vercel Logs
1. Go to your project in Vercel dashboard
2. Click **"Logs"** tab
3. View build logs and deployment history

### Health Monitoring
- Backend health endpoint: `https://your-backend.up.railway.app/api/health`
- Set up uptime monitoring with services like UptimeRobot or Pingdom

---

## Part 7: CI/CD

Both Railway and Vercel provide automatic deployments on git push:

**Railway**: Automatically deploys when you push to the connected branch

**Vercel**: Automatically deploys when you push to the connected branch

To enable automatic deployments:
1. Connect your GitHub repository
2. Select the branch to deploy (usually `main` or `master`)
3. Enable "Auto-deploy" in project settings

---

## Part 8: Custom Domains (Optional)

### Add Custom Domain to Vercel
1. Go to Vercel project → **"Settings"** → **"Domains"**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed by Vercel

### Add Custom Domain to Railway
1. Go to Railway project → **"Settings"** → **"Domains"**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed by Railway

---

## Part 9: Security Checklist

- [ ] API keys stored in environment variables (never in code)
- [ ] CORS restricted to frontend domain
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Rate limiting configured (if needed)
- [ ] Input validation enabled (using Joi)
- [ ] Logging doesn't expose sensitive data
- [ ] Dependencies regularly updated

---

## Part 10: Scaling Considerations

### Backend Scaling (Railway)
- **Vertical**: Upgrade plan for more RAM/CPU
- **Horizontal**: Use Railway's load balancer with multiple instances
- **Database**: Add PostgreSQL if you need persistent storage

### Frontend Scaling (Vercel)
- Vercel automatically scales globally with CDN
- No manual scaling needed for static sites

---

## Quick Reference URLs

After deployment, you'll have:
- **Backend**: `https://your-backend.up.railway.app`
- **Frontend**: `https://your-frontend.vercel.app`
- **Health Check**: `https://your-backend.up.railway.app/api/health`
- **Recommendations API**: `https://your-backend.up.railway.app/api/recommendations`

---

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- GitHub Repository: `pbehuray/m1-zomato`
