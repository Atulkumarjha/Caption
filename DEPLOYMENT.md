# 🚀 Deployment Guide for CAPTION.AI

## Quick Deploy Options

### 🟢 **Option 1: Render.com (Recommended - FREE)**

#### Backend Deployment

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add deployment configs"
   git push origin atul-dev
   ```

2. **Create Render Web Service**
   - Go to [render.com](https://render.com) and sign in with GitHub
   - Click **New** → **Web Service**
   - Connect your repository
   - Configure:
     - **Name**: `caption-ai-backend`
     - **Root Directory**: `backend`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   
3. **Environment Variables** (Add in Render dashboard):
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

4. **Important**: Add build pack for FFmpeg
   - In dashboard, go to **Settings** → **Build & Deploy**
   - Add buildpack: `heroku/python`
   - FFmpeg is pre-installed on Render

5. **Deploy** - Click "Create Web Service"
   - Copy your backend URL: `https://caption-ai-backend.onrender.com`

#### Frontend Deployment

1. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build` (auto-detected)
     - **Output Directory**: `.next` (auto-detected)

2. **Environment Variables** (Add in Vercel dashboard):
   ```
   NEXT_PUBLIC_API_URL=https://caption-ai-backend.onrender.com
   ```

3. **Deploy** - Click "Deploy"
   - Your app will be live at: `https://caption-ai-xyz.vercel.app`

4. **Update Backend CORS**
   - Go back to Render dashboard
   - Update `FRONTEND_URL` to your actual Vercel URL
   - Redeploy backend

---

### 🔵 **Option 2: Railway (Easiest)**

#### One-Click Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add deployment configs"
   git push origin atul-dev
   ```

2. **Deploy Backend**
   - Go to [railway.app](https://railway.app)
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your repository
   - Railway auto-detects Python
   - Add environment variable: `FRONTEND_URL=https://your-frontend-url.vercel.app`
   - Copy generated URL

3. **Deploy Frontend to Vercel** (same as Option 1)
   - Set `NEXT_PUBLIC_API_URL` to Railway backend URL

---

### 🟣 **Option 3: Docker + Any VPS**

#### Build and Run with Docker

1. **Backend (in `/backend` directory)**
   ```bash
   cd backend
   docker build -t caption-backend .
   docker run -d -p 8000:8000 \
     -e FRONTEND_URL=https://your-frontend.com \
     caption-backend
   ```

2. **Frontend (deploy to Vercel as in Option 1)**

---

## 📋 Post-Deployment Checklist

### Backend Health Check
```bash
curl https://your-backend-url.com/
# Should return: {"message":"Caption API is running"}
```

### Frontend Connectivity Test
1. Open your deployed frontend URL
2. Upload a small test video
3. Check browser console for any CORS errors
4. Verify caption generation works end-to-end

### Common Issues & Fixes

#### ❌ CORS Error
- **Problem**: Frontend can't reach backend
- **Fix**: Update `FRONTEND_URL` in backend environment variables
- **Check**: Ensure no trailing slash in URLs

#### ❌ FFmpeg Not Found
- **Problem**: Video processing fails
- **Fix (Render)**: FFmpeg is pre-installed, check logs
- **Fix (Railway)**: Add nixpacks buildpack
- **Fix (Docker)**: Already included in Dockerfile

#### ❌ Speech Recognition Timeout
- **Problem**: Long videos fail to process
- **Fix**: Google Speech API has no timeout, but check audio extraction
- **Alternative**: Consider chunking larger files

#### ❌ File Upload Size Limit
- **Render Free Plan**: 10MB limit per request
- **Railway**: No limit but slow uploads on free tier
- **Fix**: Add file size validation in frontend before upload

---

## 🔧 Environment Variables Reference

### Backend (`backend/.env` - for local)
```bash
FRONTEND_URL=http://localhost:3000  # Production: Your Vercel URL
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000  # Production: Your backend URL
```

---

## 🎯 Performance Optimization

### For Production:

1. **Enable Caching**
   - Add Redis for session management (optional)
   - Cache generated subtitles

2. **Add File Size Limits**
   ```python
   # In backend/main.py
   MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
   ```

3. **Use Cloud Storage**
   - AWS S3 / Cloudflare R2 for video files
   - Avoid storing in temp/ directory

4. **Rate Limiting**
   ```python
   # Add to backend
   pip install slowapi
   ```

---

## 🚨 Important Notes

1. **Free Tier Limitations**:
   - Render: 750 hours/month, services sleep after 15 min inactivity
   - Vercel: Unlimited deployments, 100GB bandwidth/month
   - Railway: 500 hours/month on free plan

2. **Cold Starts**:
   - First request after sleep may take 30-60 seconds
   - Consider paid plans for production apps

3. **File Cleanup**:
   - Session cleanup runs every 30 minutes
   - Monitor disk usage on backend server

4. **Security**:
   - Add authentication for production
   - Implement API rate limiting
   - Validate file types and sizes

---

## 📞 Need Help?

- Render Logs: Dashboard → Your Service → Logs
- Vercel Logs: Dashboard → Your Project → Deployments → View Function Logs
- Railway Logs: Project → Service → Logs

---

## ✅ Success Criteria

Your deployment is complete when:
- [ ] Backend responds at `/` endpoint
- [ ] Frontend loads without errors
- [ ] Video upload works
- [ ] Caption generation completes
- [ ] Video download works
- [ ] No CORS errors in browser console

**🎉 Ready to deploy? Start with Option 1 (Render + Vercel) for the easiest free deployment!**
