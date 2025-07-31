'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useState } from 'react';
import { Id } from '../../convex/_generated/dataModel';

export default function Dashboard() {
  const clips = useQuery(api.clips.getAllClips);
  const updateTitle = useMutation(api.clips.updateClipTitle);
  const deleteClip = useMutation(api.clips.deleteClip);
  const [selectedClip, setSelectedClip] = useState<Record<string, unknown> | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRename = async (clipId: Id<"clips">, newTitle: string) => {
    await updateTitle({ clipId, title: newTitle });
  };

  const handleDelete = async (clipId: Id<"clips">) => {
    if (confirm('Are you sure you want to delete this clip?')) {
      await deleteClip({ clipId });
    }
  };

  const copyShareLink = (shareId: string) => {
    const link = `${window.location.origin}/clip/${shareId}`;
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  if (clips === undefined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading clips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Nice Clips</h1>
          <p className="text-gray-400">
            Create and share short video clips from YouTube videos using our Chrome extension.
          </p>
        </div>

        {/* Extension Download CTA */}
        <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Get Started</h2>
          <p className="text-gray-400 mb-4">
            Install the Chrome extension to start creating clips from any YouTube video.
          </p>
          <Button className="bg-red-600 hover:bg-red-700">
            Install Chrome Extension
          </Button>
        </div>

        {/* Clips Grid */}
        {clips.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No clips yet</h3>
            <p className="text-gray-400">
              Install the extension and create your first clip from any YouTube video.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-6">Your Clips ({clips.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clips.map((clip) => (
                <ClipCard
                  key={clip._id}
                  clip={clip}
                  onView={() => setSelectedClip(clip)}
                  onRename={(newTitle) => handleRename(clip._id, newTitle)}
                  onDelete={() => handleDelete(clip._id)}
                  onShare={() => copyShareLink(clip.shareId)}
                />
              ))}
            </div>
          </>
        )}

        {/* Clip Preview Modal */}
        {selectedClip && (
          <Dialog open={!!selectedClip} onOpenChange={() => setSelectedClip(null)}>
            <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedClip.title as string}</DialogTitle>
              </DialogHeader>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {selectedClip.status === 'completed' && selectedClip.videoUrl ? (
                  <video
                    controls
                    className="w-full h-full"
                    poster={selectedClip.thumbnailUrl as string}
                  >
                    <source src={selectedClip.videoUrl as string} type="video/mp4" />
                  </video>
                ) : selectedClip.status === 'processing' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                      <p className="text-gray-400">Processing...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-red-400">Processing failed</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-400">
                  Duration: {formatTime(selectedClip.duration as number)} • Created: {new Date(selectedClip.createdAt as number).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => copyShareLink(selectedClip.shareId as string)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    Share
                  </Button>
                  <Button
                    onClick={() => window.open(`/clip/${selectedClip.shareId as string}`, '_blank')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// Clip Card Component
interface ClipCardProps {
  clip: Record<string, unknown>;
  onView: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onShare: () => void;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, onView, onRename, onDelete, onShare }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(clip.title as string);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== (clip.title as string)) {
      onRename(newTitle.trim());
    }
    setIsRenaming(false);
  };

  const getStatusColor = () => {
    switch (clip.status as string) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-800 relative">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl as string}
            alt={clip.title as string}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              {clip.status === 'processing' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
              )}
              <p className={`text-sm ${getStatusColor()}`}>
                {(clip.status as string) === 'processing' ? 'Processing...' : 
                 (clip.status as string) === 'failed' ? 'Failed' : 'No thumbnail'}
              </p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatTime(clip.duration as number)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        {isRenaming ? (
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setNewTitle(clip.title as string);
                setIsRenaming(false);
              }
            }}
            className="bg-gray-800 border-gray-600 text-white mb-2"
            autoFocus
          />
        ) : (
          <h3 
            className="font-semibold mb-2 cursor-pointer hover:text-gray-300 transition-colors truncate"
            onClick={() => setIsRenaming(true)}
            title="Click to rename"
          >
            {clip.title as string}
          </h3>
        )}

        {/* Meta */}
        <div className="text-sm text-gray-400 mb-3">
          <div className="flex justify-between">
            <span>{new Date(clip.createdAt as number).toLocaleDateString()}</span>
            <span className={getStatusColor()}>{clip.status as string}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={onView}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onShare}
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="border-red-600 text-red-400 hover:bg-red-900/20"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
