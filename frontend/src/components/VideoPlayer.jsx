import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showBigPlayAnim, setShowBigPlayAnim] = useState(false);
  const [animType, setAnimType] = useState('play'); // 'play' or 'pause'

  // Format time (e.g. 0:04 / 1:10)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerBigPlayAnim('pause');
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      triggerBigPlayAnim('play');
    }
  };

  // Trigger large center play/pause indicator animation
  const triggerBigPlayAnim = (type) => {
    setAnimType(type);
    setShowBigPlayAnim(true);
    setTimeout(() => {
      setShowBigPlayAnim(false);
    }, 500);
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Seek video position
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Volume seek
  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume > 0 ? volume : 0.5;
      if (volume === 0) setVolume(0.5);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Track fullscreen changes (e.g. if user presses Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Autohide controls on inactivity
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }
    let timeoutId;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(timeoutId);
    };
  }, [isPlaying]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full max-w-[720px] mx-auto rounded-[16px] overflow-hidden bg-black shadow-apple-lg border border-black/10 group select-none transition-all duration-300 ${
        isFullscreen ? 'h-screen max-w-none rounded-none flex items-center justify-center' : 'aspect-video'
      }`}
    >
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        className={`w-full h-full object-contain cursor-pointer`}
      />

      {/* Large Center Play/Pause Animated Overlay */}
      {showBigPlayAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white scale-[1.3] opacity-0 animate-ping-once">
            {animType === 'play' ? (
              <Play className="w-7 h-7 fill-current ml-1" />
            ) : (
              <Pause className="w-7 h-7 fill-current" />
            )}
          </div>
        </div>
      )}

      {/* Glassmorphic Premium Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 flex flex-col gap-2.5 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Seek Bar */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-[11px] font-semibold text-white/80 select-none min-w-[34px] text-right font-mono">
            {formatTime(currentTime)}
          </span>
          
          <div className="relative flex-grow flex items-center group/seek">
            {/* Custom styled range input */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-[#0071e3] h-1 hover:h-1.5 rounded-full cursor-pointer bg-white/20 appearance-none outline-none transition-all duration-150"
              style={{
                background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          <span className="text-[11px] font-semibold text-white/80 select-none min-w-[34px] font-mono">
            {formatTime(duration)}
          </span>
        </div>

        {/* Lower buttons row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {/* Play/Pause control */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border-none cursor-pointer p-0"
              title={isPlaying ? "Pause" : "Lire"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Mute/Volume control */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border-none cursor-pointer p-0"
                title={isMuted ? "Activer le son" : "Couper le son"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Slider for volume on hover */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 focus:w-16 accent-[#0071e3] h-1 rounded-full cursor-pointer bg-white/20 appearance-none outline-none transition-all duration-300"
                style={{
                  background: `linear-gradient(to right, #0071e3 0%, #0071e3 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border-none cursor-pointer p-0"
            title="Plein écran"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
