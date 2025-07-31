import React, { useState, useRef, useEffect } from 'react';

interface TimelineSliderProps {
  startTime: number;
  endTime: number;
  maxDuration: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  startTime,
  endTime,
  maxDuration,
  onStartTimeChange,
  onEndTimeChange,
}) => {
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const startPercent = (startTime / maxDuration) * 100;
  const endPercent = (endTime / maxDuration) * 100;
  const duration = endTime - startTime;

  const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percent / 100) * maxDuration;

    if (isDragging === 'start') {
      const newStartTime = Math.max(0, Math.min(time, endTime - 1));
      onStartTimeChange(newStartTime);
    } else if (isDragging === 'end') {
      const newEndTime = Math.max(startTime + 1, Math.min(time, maxDuration));
      onEndTimeChange(newEndTime);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startTime, endTime, maxDuration]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    const rect = sliderRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const time = (percent / 100) * maxDuration;

    // Determine whether to move start or end time based on proximity
    const distanceToStart = Math.abs(time - startTime);
    const distanceToEnd = Math.abs(time - endTime);

    if (distanceToStart < distanceToEnd) {
      const newStartTime = Math.max(0, Math.min(time, endTime - 1));
      onStartTimeChange(newStartTime);
    } else {
      const newEndTime = Math.max(startTime + 1, Math.min(time, maxDuration));
      onEndTimeChange(newEndTime);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>0:00</span>
        <span>{formatTime(maxDuration)}</span>
      </div>
      
      <div
        ref={sliderRef}
        className="relative h-6 bg-gray-700 rounded-full cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-gray-700" />
        
        {/* Selected range */}
        <div
          className={`absolute top-0 h-full rounded-full ${
            duration > 120 ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />
        
        {/* Start time handle */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 hover:scale-110 transition-transform"
          style={{ left: `${startPercent}%`, marginLeft: '-8px' }}
          onMouseDown={handleMouseDown('start')}
        />
        
        {/* End time handle */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 hover:scale-110 transition-transform"
          style={{ left: `${endPercent}%`, marginLeft: '-8px' }}
          onMouseDown={handleMouseDown('end')}
        />
        
        {/* Time indicators */}
        <div
          className="absolute -top-6 text-xs text-gray-300 transform -translate-x-1/2"
          style={{ left: `${startPercent}%` }}
        >
          {formatTime(startTime)}
        </div>
        <div
          className="absolute -top-6 text-xs text-gray-300 transform -translate-x-1/2"
          style={{ left: `${endPercent}%` }}
        >
          {formatTime(endTime)}
        </div>
      </div>
      
      {/* Duration indicator */}
      <div className="text-center mt-2">
        <span className={`text-sm ${duration > 120 ? 'text-red-400' : 'text-green-400'}`}>
          Selected: {formatTime(duration)}
          {duration > 120 && ' (exceeds 2min limit)'}
        </span>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default TimelineSlider;