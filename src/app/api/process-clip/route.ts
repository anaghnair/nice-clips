import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { videoId, title, startTime, endTime, originalTitle } = await request.json();

    if (!videoId || !title || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const duration = endTime - startTime;
    if (duration > 120) {
      return NextResponse.json({ error: 'Clip duration cannot exceed 2 minutes' }, { status: 400 });
    }

    // Create clip record in Convex
    const clipId = await convex.mutation(api.clips.createClip, {
      videoId,
      title,
      startTime,
      endTime,
      originalTitle,
    });

    // Process the clip asynchronously
    processClipAsync(clipId, videoId, startTime, endTime);

    return NextResponse.json({ success: true, clipId });
  } catch (error) {
    console.error('Error in process-clip API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processClipAsync(clipId: Id<"clips">, videoId: string, startTime: number, endTime: number) {
  try {
    // Call the Python video processing function
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://nice-clips.vercel.app';
    
    const processingResponse = await fetch(`${baseUrl}/api/process-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        startTime,
        endTime,
        clipId,
      }),
    });

    if (!processingResponse.ok) {
      const errorText = await processingResponse.text();
      throw new Error(`Video processing failed: ${errorText}`);
    }

    const result = await processingResponse.json();
    
    // Update clip status to completed
    await convex.mutation(api.clips.updateClipStatus, {
      clipId,
      status: 'completed',
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
    });

    console.log(`Clip ${clipId} processed and uploaded successfully`);
  } catch (error) {
    console.error(`Error processing clip ${clipId}:`, error);
    
    // Update clip status to failed
    await convex.mutation(api.clips.updateClipStatus, {
      clipId,
      status: 'failed',
    });
  }
}