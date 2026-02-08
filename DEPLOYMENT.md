# 🚀 Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free): https://vercel.com
- Render account (free): https://render.com

---

## 📦 Deploy Backend (Render)

### Step 1: Push Code to GitHub
Your code is already at: https://github.com/writetosahilkhan-dotcom/multi-satellite-data-fusion.git

### Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select: `writetosahilkhan-dotcom/multi-satellite-data-fusion`
5. Render will auto-detect `render.yaml`
6. Click **"Apply"**

### Step 3: Get Backend URL
- After deployment completes, copy your backend URL
- Format: `https://multi-satellite-backend.onrender.com`

---

## 🌐 Deploy Frontend (Vercel)

### Step 1: Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New"** → **"Project"**
3. Import: `writetosahilkhan-dotcom/multi-satellite-data-fusion`
4. Configure project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 2: Add Environment Variable

In Vercel project settings:
- Go to **Settings** → **Environment Variables**
- Add variable:
  - **Name**: `NEXT_PUBLIC_API_URL`
  - **Value**: Your Render backend URL (from Step 3 above)
  - Example: `https://multi-satellite-backend.onrender.com`

### Step 3: Redeploy
- Go to **Deployments** tab
- Click **"Redeploy"** on latest deployment

---

## ✅ Verify Deployment

1. **Backend Health Check**:
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status": "healthy", "timestamp": "..."}`

2. **Frontend**:
   - Visit your Vercel URL: `https://your-project.vercel.app`
   - Check if backend status shows "API Connected" (green dot)

3. **Test Demo Mode**:
   - Press **D** key to start Kerala flood demo
   - Verify sound effects and animations work

---

## 🔧 Troubleshooting

### Backend Issues
- **Cold Start**: Render free tier sleeps after inactivity (takes ~30 sec to wake)
- **Logs**: Check Render dashboard → your service → Logs tab

### Frontend Issues
- **API Connection Failed**: 
  - Verify `NEXT_PUBLIC_API_URL` environment variable is set
  - Check backend is running (visit health endpoint)
- **Build Errors**: Check Vercel build logs in dashboard

### CORS Issues
Backend already configured for CORS in `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📝 Notes

- **Render Free Tier**: 
  - Backend sleeps after 15 min inactivity
  - 750 hours/month free
  
- **Vercel Free Tier**:
  - Unlimited deployments
  - 100 GB bandwidth/month

- **Local Development**:
  - Keep using `http://localhost:8000` for backend
  - Create `.env.local` in frontend with local API URL

---

## 🎯 Production URLs

After deployment, update your README with:
- Live Demo: `https://your-project.vercel.app`
- API Docs: `https://your-backend.onrender.com/docs`
- Health: `https://your-backend.onrender.com/health`
