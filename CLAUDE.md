# nice clips - Architecture Overview

## Project Overview
A Chrome extension that allows users to create and share short video clips from YouTube videos. Users can select precise timestamps, generate clips (max 2 minutes), and share them via custom links with a beautiful video player.

## Tech Stack
- **Frontend Extension**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Web Dashboard**: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui  
- **Backend**: Convex (auth, database, real-time updates)
- **Video Processing**: Vercel API route (youtube-dl-exec(https://www.npmjs.com/package/youtube-dl-exec)check this page for learning about api params that this package provides + FFmpeg) 
- **Storage**: Cloudflare R2

## Core User Flow

### Extension Flow
1. User clicks extension on YouTube video
2. Full-screen popup opens with embedded YouTube video
3. Custom timeline appears below video with scrubbing controls
4. User sets start/end times (max 2min duration)
5. User clicks "Create Clip" button
6. Window smoothly animates to small top-left corner
7. Shows processing progress in real-time
8. Once complete, shows share link with rename option
9. Micro-interactions for saving/renaming clip names

### Dashboard Flow
1. Users access web dashboard to view all clips
2. Grid/list view of clip cards
3. Click to preview clip in modal
4. Access share links and rename clips
5. Real-time updates when new clips are processed


### API Endpoints
- `POST /api/process-clip` - Triggers video processing (Vercel API route)
- Convex functions handle all CRUD operations and real-time updates

### Key Features

#### Extension UI Components
- **FullScreenPopup**: Main container with smooth animations
- **EmbeddedPlayer**: YouTube iframe with custom controls
- **CustomTimeline**: Scrubbing timeline with start/end markers
- **ProcessingIndicator**: Animated progress states
- **ShareLinkManager**: Link display with rename functionality
- **CompactMode**: Minimized corner view during processing

#### Dashboard Components  
- **ClipGrid**: Responsive card layout
- **ClipCard**: Preview thumbnail, title, duration, actions
- **ClipModal**: Full preview with share options
- **RenamingInput**: Inline editing with auto-save

#### Shared Components (shadcn/ui based)
- Custom Button variants
- Input components with validation
- Progress indicators
- Toast notifications
- Modal/Dialog components
- Timeline scrubber component

### Technical Constraints
- Max clip duration: 120 seconds (2 minutes)
- Max video resolution: 1080p
- Processing timeout: 15 minutes (Vercel limit)
- File size optimization for web delivery

### Processing Pipeline
1. Extension sends clip request to Convex
2. Convex creates clip record, triggers Vercel function
3. Vercel function downloads YouTube segment using yt-dlp
4. FFmpeg trims video (stream copy for speed)
5. Upload processed clip to Cloudflare R2
6. Update Convex record with final URLs
7. Real-time UI updates via Convex subscriptions

### UX Considerations
- Smooth animations between extension states
- Real-time processing feedback
- Intuitive timeline scrubbing
- Quick rename functionality with auto-save
- Responsive design for all screen sizes
- Keyboard shortcuts for power users
- Error handling with user-friendly messages

### Performance Optimizations
- Use FFmpeg stream copy (no re-encoding) when possible
- Lazy load video thumbnails
- Efficient R2 uploads with compression
- Caching strategies for popular clips
- Optimized extension bundle size



## Convex Development Guidelines: See "convex/CLAUDE.md" for detailed Convex-specific development guidelines including:
  - Function syntax and patterns
  - Schema design
  - TypeScript best practices
  - Query optimization
  - File storage patterns