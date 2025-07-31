'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '../../../components/ui/button';

export default function SharedClipPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  
  const clip = useQuery(api.clips.getClipByShareId, { shareId });

  if (clip === undefined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading clip...</p>
        </div>
      </div>
    );
  }

  if (clip === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Clip Not Found</h1>
          <p className="text-gray-400 mb-6">The clip you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 hover:bg-red-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (clip.status === 'processing') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Processing Clip</h1>
          <p className="text-gray-400">Your clip is being processed. Please check back in a few minutes.</p>
        </div>
      </div>
    );
  }

  if (clip.status === 'failed') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Processing Failed</h1>
          <p className="text-gray-400 mb-6">Sorry, there was an error processing this clip.</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 hover:bg-red-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{clip.title}</h1>
          <div className="flex items-center space-x-4 text-gray-400">
            <span>Duration: {formatTime(clip.duration)}</span>
            <span>•</span>
            <span>Created: {new Date(clip.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {clip.videoUrl ? (
              <video
                controls
                className="w-full h-full"
                poster={clip.thumbnailUrl}
              >
                <source src={clip.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400">Video processing complete, but file not yet available</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              View More Clips
            </Button>
            <Button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                // TODO: Show toast notification
                alert('Link copied to clipboard!');
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Share Clip
            </Button>
          </div>
        </div>

        {/* Original Video Link */}
        <div className="max-w-4xl mx-auto mt-8 p-4 bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-2">Original Video</h3>
          <p className="text-gray-400 text-sm mb-2">{clip.originalTitle}</p>
          <a
            href={`https://www.youtube.com/watch?v=${clip.videoId}&t=${Math.floor(clip.startTime)}s`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Watch on YouTube →
          </a>
        </div>
      </div>
    </div>
  );
}