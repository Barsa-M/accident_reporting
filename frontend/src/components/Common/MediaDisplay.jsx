import React, { useState } from 'react';
import { FiImage, FiVideo, FiFile, FiX, FiMaximize2 } from 'react-icons/fi';

const MediaDisplay = ({
  url,
  type,
  className = '',
  showControls = true,
  maxWidth = 'full',
  maxHeight = '96',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if it's a data URL (local file)
  const isDataUrl = url && url.startsWith('data:');
  
  // Determine media type
  const isImage = isDataUrl ? 
    url.includes('image/') || url.match(/\.(jpg|jpeg|png|gif)$/i) :
    url.match(/\.(jpg|jpeg|png|gif)$/i);
  
  const isVideo = isDataUrl ? 
    url.includes('video/') || url.match(/\.(mp4|mov|quicktime)$/i) :
    url.match(/\.(mp4|mov|quicktime)$/i);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsFullscreen(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderMedia = () => {
    if (isImage && !imageError) {
      return (
        <img
          src={url}
          alt="Media content"
          className={`w-full h-full object-cover rounded-lg transition-transform duration-200 ${
            isFullscreen ? 'cursor-zoom-out' : 'cursor-zoom-in hover:scale-105'
          }`}
          onClick={handleFullscreen}
          onError={handleImageError}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={url}
          controls
          className="w-full h-full object-cover rounded-lg"
          preload="metadata"
        />
      );
    }

    // Fallback for broken images or other files
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <FiFile className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-2">Media not available</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0d522c] hover:underline text-sm"
          >
            View File
          </a>
        </div>
      </div>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-3 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full"
        >
          <FiX className="h-6 w-6" />
        </button>
        <div className="max-w-[95vw] max-h-[95vh] p-4">
          {renderMedia()}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className={`w-full overflow-hidden rounded-lg shadow-sm`}>
        {renderMedia()}
      </div>
      {showControls && !imageError && (
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isImage && (
            <button
              onClick={handleFullscreen}
              className="p-2 bg-white/90 rounded-full hover:bg-white shadow-sm"
              title="View fullscreen"
            >
              <FiMaximize2 className="h-4 w-4 text-gray-600" />
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/90 rounded-full hover:bg-white shadow-sm"
            title="Open in new tab"
          >
            <FiFile className="h-4 w-4 text-gray-600" />
          </a>
        </div>
      )}
    </div>
  );
};

export default MediaDisplay; 