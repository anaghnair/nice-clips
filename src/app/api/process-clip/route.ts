import { NextRequest, NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { readFileSync, unlinkSync } from 'fs';

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
    // Download video info to get the best quality URL
    const videoInfo = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true,
      noWarnings: true,
      format: 'best[height<=1080][ext=mp4]/best[ext=mp4]/best',
    }) as { url?: string };

    if (!videoInfo || !videoInfo.url) {
      throw new Error('Could not extract video URL');
    }

    // Create temporary filenames
    const tempOutputPath = `/tmp/clip_${clipId}_${Date.now()}.mp4`;
    
    // Use FFmpeg to extract the clip
    await new Promise<void>((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpeg!, [
        '-ss', startTime.toString(),
        '-i', videoInfo.url as string,
        '-t', (endTime - startTime).toString(),
        '-c', 'copy', // Use stream copy for speed
        '-avoid_negative_ts', 'make_zero',
        tempOutputPath,
        '-y' // Overwrite output file
      ]);

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (error) => {
        reject(error);
      });
    });

    // Upload to Cloudflare R2
    const videoFileName = `clips/${clipId}.mp4`;
    const videoBuffer = readFileSync(tempOutputPath);
    
    const uploadResponse = await fetch(`https://44936cff27d6568454e39cf5ca432fb7.r2.cloudflarestorage.com/nice-clips-1/${videoFileName}`, {
      method: 'PUT',
      body: videoBuffer,
      headers: {
        'Content-Type': 'video/mp4',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to R2: ${uploadResponse.statusText}`);
    }

    // Clean up temporary file
    unlinkSync(tempOutputPath);

    const videoUrl = `https://44936cff27d6568454e39cf5ca432fb7.r2.cloudflarestorage.com/nice-clips-1/${videoFileName}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Update clip status to completed
    await convex.mutation(api.clips.updateClipStatus, {
      clipId,
      status: 'completed',
      videoUrl,
      thumbnailUrl,
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