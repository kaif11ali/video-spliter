# 🚀 Vercel Deployment Guide

This guide will help you deploy your Video Splitter static demo to Vercel.

## 📋 Prerequisites

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free)
- Your static demo files ready

## 🏗️ Deployment Steps

### Method 1: GitHub Integration (Recommended)

1. **Create a GitHub Repository**
   ```bash
   # Initialize git repository (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Commit files
   git commit -m "Initial commit - Video Splitter static demo"
   
   # Add your GitHub repository as remote
   git remote add origin https://github.com/YOUR_USERNAME/video-splitter-demo.git
   
   # Push to GitHub
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect it's a Vite project

3. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

### Method 2: Direct Upload

1. **Build the project locally**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

## ⚙️ Configuration

The project includes these configuration files:

### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
```

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Verify the build works locally: `npm run build`
- Check for any console errors in the build logs

### Videos Not Loading
- Ensure video files are in `public/videos/` directory
- Check file paths in the HTML are correct
- Verify video file formats are web-compatible (MP4, WebM)

### Styling Issues
- Ensure all CSS files are imported correctly
- Check for any missing font imports
- Verify responsive design works across devices

## 🌐 Domain Setup (Optional)

### Custom Domain
1. In your Vercel dashboard, go to your project
2. Go to "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

### Environment Variables
If you need environment variables:
1. Go to "Settings" → "Environment Variables" in Vercel
2. Add your variables
3. Redeploy the project

## 📊 Performance Optimization

### Images and Videos
- Compress video files for faster loading
- Use appropriate video formats (MP4 for compatibility, WebM for smaller size)
- Consider lazy loading for large assets

### Bundle Size
- The current build is optimized for size
- Videos are loaded separately to avoid blocking the main bundle
- CSS is minimized and critical styles are inlined

## 🚀 Going Live Checklist

- [ ] Test the demo locally with `npm run preview`
- [ ] Verify all links work (download buttons, social media)
- [ ] Check responsive design on mobile/tablet
- [ ] Test video playback across different browsers
- [ ] Verify Vercel build completes successfully
- [ ] Test the live URL after deployment
- [ ] Share your demo link!

## 📈 Analytics (Optional)

Add Vercel Analytics to track visitors:

1. In Vercel dashboard, go to "Analytics" tab
2. Enable analytics for your project
3. View traffic, page views, and performance metrics

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)
- [GitHub Repository](https://github.com/kaif11ali/video-spliter)

---

**Your Video Splitter demo will be live at: `https://your-project-name.vercel.app`**

Share your demo with the world! 🌟
