import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Progress } from '../../../src/components/ui/progress';
import TimelineSlider from './TimelineSlider';
import { API_BASE_URL } from '../config';

interface ClipCreatorPopupProps {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

type PopupState = 'editing' | 'processing' | 'completed';

const ClipCreatorPopup: React.FC<ClipCreatorPopupProps> = ({
  videoId,
  videoTitle,
  onClose,
}) => {
  const [state, setState] = useState<PopupState>('editing');
  const [title, setTitle] = useState(videoTitle);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shareLink, setShareLink] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const videoDuration = Math.min(endTime - startTime, 120);
  const isValidDuration = videoDuration > 0 && videoDuration <= 120;

  useEffect(() => {
    setDuration(endTime - startTime);
  }, [startTime, endTime]);

  const handleCreateClip = async () => {
    if (!isValidDuration) return;

    setState('processing');
    setIsMinimized(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_CLIP',
        data: {
          videoId,
          title,
          startTime,
          endTime,
          originalTitle: videoTitle,
        },
      });

      if (response.success) {
        // Simulate processing progress
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += Math.random() * 10;
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(progressInterval);
            setState('completed');
            setShareLink(`${API_BASE_URL}/clip/${response.clipId}`);
          }
          setProgress(currentProgress);
        }, 500);
      } else {
        throw new Error(response.error || 'Failed to create clip');
      }
    } catch (error) {
      console.error('Error creating clip:', error);
      alert('Failed to create clip. Please try again.');
      setState('editing');
      setIsMinimized(false);
    }
  };

  const handleRename = (newTitle: string) => {
    setTitle(newTitle);
    // TODO: Update clip title in Convex
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    // TODO: Show toast notification
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const renderEditingState = () => (
    <div className="bg-black text-white h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Create Clip</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-gray-700"
        >
          ✕
        </Button>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black flex items-center justify-center">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&autoplay=1&controls=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Timeline */}
          <div className="p-4 bg-gray-900">
            <TimelineSlider
              startTime={startTime}
              endTime={endTime}
              maxDuration={600} // 10 minutes max for selection
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
              <span className={duration > 120 ? 'text-red-400' : 'text-green-400'}>
                Duration: {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-700 p-4 flex flex-col">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Clip Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter clip title..."
            />
          </div>

          <div className="flex-1"></div>

          <Button
            onClick={handleCreateClip}
            disabled={!isValidDuration || !title.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Create Clip
          </Button>

          {duration > 120 && (
            <p className="text-red-400 text-sm mt-2">
              Maximum clip duration is 2 minutes
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMinimizedState = () => (
    <div 
      className="fixed top-4 left-4 w-80 bg-black text-white rounded-lg shadow-2xl border border-gray-700 cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={state === 'processing' ? handleMaximize : undefined}
      style={{ zIndex: 999999 }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold truncate flex-1">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:bg-gray-700 ml-2"
          >
            ✕
          </Button>
        </div>

        {state === 'processing' && (
          <>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </>
        )}

        {state === 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-sm">✓ Clip ready!</span>
            </div>
            <div className="flex space-x-2">
              <Input
                value={shareLink}
                readOnly
                className="bg-gray-800 border-gray-600 text-white text-xs flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Copy
              </Button>
            </div>
            <RenameInput
              initialValue={title}
              onSave={handleRename}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className={`fixed inset-0 transition-all duration-500 ${
        isMinimized ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={{ zIndex: 999999 }}
    >
      {!isMinimized && (
        <div className="absolute inset-0 bg-black bg-opacity-90" onClick={onClose} />
      )}
      
      <div className={`transition-all duration-500 ${
        isMinimized 
          ? 'fixed top-4 left-4 w-80 h-auto pointer-events-auto' 
          : 'absolute inset-4 pointer-events-auto'
      }`}>
        {isMinimized ? renderMinimizedState() : renderEditingState()}
      </div>
    </div>
  );
};

// Helper component for inline renaming
const RenameInput: React.FC<{
  initialValue: string;
  onSave: (value: string) => void;
}> = ({ initialValue, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    if (value.trim() && value !== initialValue) {
      onSave(value.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="bg-gray-800 border-gray-600 text-white text-sm"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="text-sm text-gray-300 cursor-pointer hover:text-white border border-transparent hover:border-gray-600 px-2 py-1 rounded transition-colors"
    >
      {value} <span className="text-gray-500">✎</span>
    </div>
  );
};

// Utility function
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default ClipCreatorPopup;