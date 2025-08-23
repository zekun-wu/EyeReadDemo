import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './AudioPlayer.css';

const AudioPlayer = forwardRef(({ audioUrl, onError, showTranscriptButton = true, onToggleTranscript, showingTranscript = false }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  
  const audioRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && !error) {
        audioRef.current.play().catch(handleError);
      }
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const handleError = () => {
    setError(true);
    setIsPlaying(false);
    if (onError) {
      onError();
    }
  };

  const togglePlayPause = () => {
    if (error || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(handleError);
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || error) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickProgress = (clickX / width) * 100;
    const newTime = (clickProgress / 100) * duration;

    audioRef.current.currentTime = newTime;
    setProgress(clickProgress);
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const replayAudio = () => {
    if (audioRef.current && !error) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(handleError);
    }
  };

  if (error) {
    return (
      <div className="audio-player error">
        <div className="error-message">
          <span className="error-icon">🔇</span>
          <p>Audio couldn't load, but you can still read the story below!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onError={handleError}
      />
      
      <div className="audio-controls">
        <button
          className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayPause}
          disabled={error}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
        </button>

        <div className="progress-container">
          <div 
            className="progress-bar"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="progress-thumb"
              style={{ left: `${progress}%` }}
            />
          </div>
          
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="duration">{formatTime(duration)}</span>
          </div>
        </div>

        <button
          className="replay-btn"
          onClick={replayAudio}
          disabled={error}
          aria-label="Replay audio"
        >
          🔄
        </button>

        {showTranscriptButton && (
          <button
            className="transcript-toggle-btn"
            onClick={onToggleTranscript}
            aria-label={showingTranscript ? "Hide transcript" : "Show transcript"}
          >
            {showingTranscript ? "📖" : "📝"} {showingTranscript ? "Hide" : "Transcript"}
          </button>
        )}
      </div>

      <div className="audio-visualization">
        <div className={`sound-waves ${isPlaying ? 'animate' : ''}`}>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
