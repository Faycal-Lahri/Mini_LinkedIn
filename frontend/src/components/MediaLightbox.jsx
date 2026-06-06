import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, FileText } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

const MediaLightbox = ({ isOpen, onClose, mediaType, src, srcList = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && mediaType === 'IMAGE' && srcList.length > 1) handlePrev();
      if (e.key === 'ArrowRight' && mediaType === 'IMAGE' && srcList.length > 1) handleNext();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, srcList, mediaType]);

  if (!isOpen) return null;

  const hasMultipleImages = mediaType === 'IMAGE' && srcList.length > 1;
  const currentSrc = mediaType === 'IMAGE' && srcList.length > 0 ? srcList[currentIndex] : src;

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? srcList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === srcList.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = currentSrc;
    link.download = currentSrc.split('/').pop() || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-6 transition-all duration-300 animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Upper bar with action buttons */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-55 pointer-events-none">
        {/* Info indicators */}
        <div className="text-white/80 font-sans text-xs md:text-sm font-semibold bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/5 pointer-events-auto">
          {mediaType === 'IMAGE' && srcList.length > 1 ? (
            <span>{currentIndex + 1} / {srcList.length}</span>
          ) : (
            <span>Visualisation Média</span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Open in new tab */}
          <a
            href={currentSrc}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            title="Ouvrir dans un onglet"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-none cursor-pointer p-0"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 text-white backdrop-blur-md border border-white/10 hover:bg-[#ff3b30] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-none cursor-pointer p-0"
            title="Fermer (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="w-full max-w-[90vw] max-h-[80vh] flex items-center justify-center relative animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Arrows for Images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrev}
              className="absolute -left-6 md:-left-16 w-12 h-12 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-none cursor-pointer p-0 z-30"
              title="Précédent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute -right-6 md:-right-16 w-12 h-12 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-none cursor-pointer p-0 z-30"
              title="Suivant"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Media Renderers */}
        {mediaType === 'IMAGE' && (
          <img
            src={currentSrc}
            alt="Aperçu Lightbox"
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-apple-2xl border border-white/5 animate-fadeIn select-none"
            draggable="false"
          />
        )}

        {mediaType === 'VIDEO' && (
          <div className="w-full max-w-[720px] aspect-video rounded-2xl overflow-hidden shadow-apple-2xl">
            <VideoPlayer src={currentSrc} />
          </div>
        )}

        {mediaType === 'PDF' && (
          <div className="w-full max-w-[960px] h-[75vh] bg-white rounded-2xl shadow-apple-2xl overflow-hidden border border-black/5 flex flex-col">
            <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-sans text-xs md:text-sm font-bold text-gray-800 truncate max-w-[200px] md:max-w-[400px]">
                  {currentSrc.split('/').pop()}
                </span>
              </div>
              <a
                href={currentSrc}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] text-xs font-bold transition-all press-effect cursor-pointer"
                style={{ textDecoration: 'none' }}
              >
                Plein écran
              </a>
            </div>
            
            <div className="flex-grow bg-[#86868b]/20 relative">
              <iframe
                src={`${currentSrc}#toolbar=0`}
                className="w-full h-full border-none"
                title="Visualiseur PDF"
              />
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Track at bottom for Multiple Images */}
      {hasMultipleImages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 z-30">
          {srcList.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 border-none cursor-pointer p-0 ${
                idx === currentIndex ? 'bg-[#0071e3] scale-125' : 'bg-white/40 hover:bg-white/70'
              }`}
              title={`Aller à l'image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaLightbox;
