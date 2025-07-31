# Nice Clips - Deployment Guide

## Production Configuration ✅

The application is now fully configured for production with:

- **Convex URL**: `https://reliable-buzzard-788.convex.cloud`
- **Cloudflare R2**: `https://44936cff27d6568454e39cf5ca432fb7.r2.cloudflarestorage.com/nice-clips-1`

## Deployment Steps

### 1. Web Dashboard (Vercel)
```bash
# Deploy to Vercel
npm run build  # ✅ Builds successfully
vercel --prod
```

**Environment Variables needed on Vercel:**
- `NEXT_PUBLIC_CONVEX_URL=https://reliable-buzzard-788.convex.cloud`

### 2. Chrome Extension
```bash
# Build extension
npm run build:extension  # ✅ Builds successfully

# The built extension is in extension/dist/
# Upload extension/ folder to Chrome Web Store
```

### 3. Convex Database
```bash
# Deploy Convex functions
npx convex deploy
```

## File Storage

The system is configured to upload processed clips to Cloudflare R2:
- **Bucket**: `nice-clips-1`
- **Base URL**: `https://44936cff27d6568454e39cf5ca432fb7.r2.cloudflarestorage.com/nice-clips-1`
- **File format**: `clips/{clipId}.mp4`

## Current Status

✅ All builds successful  
✅ Cloudflare R2 integration complete  
✅ Convex database configured  
✅ Extension ready for Chrome Web Store  
✅ Web app ready for Vercel deployment  

## Usage Flow

1. User installs Chrome extension
2. User clicks extension on YouTube video
3. Full-screen popup opens with timeline scrubber
4. User selects start/end time (max 2 minutes)
5. User clicks "Create Clip"
6. Extension minimizes, shows processing progress
7. API downloads video segment, processes with FFmpeg
8. Processed clip uploads to Cloudflare R2
9. User gets shareable link
10. Clips viewable on web dashboard

## Next Steps

1. Deploy web app to Vercel
2. Submit extension to Chrome Web Store
3. Test full end-to-end flow
4. Monitor processing performance