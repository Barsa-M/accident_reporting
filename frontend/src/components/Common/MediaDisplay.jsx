import React, { useState } from 'react';
import { FiImage, FiVideo, FiFile, FiX } from 'react-icons/fi';

const MediaDisplay = ({
  url,
  type,
  className = '',
  showControls = true,
  maxWidth = 'full',
  maxHeight = '96',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isImage = url.match(/\.(jpg|jpeg|png|gif)$/i);
  const isVideo = url.match(/\.(mp4|mov|quicktime)$/i);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsFullscreen(false);
  };

  const renderMedia = () => {
    if (isImage) {
      return (
        <img
          src={url}
          alt="Media content"
          className={`w-full h-full object-contain rounded-lg ${
            isFullscreen ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={handleFullscreen}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={url}
          controls
          className="w-full h-full object-contain rounded-lg"
        />
      );
    }

    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
        <FiFile className="h-8 w-8 text-gray-400" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-[#0d522c] hover:underline"
        >
          View File
        </a>
      </div>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
        >
          <FiX className="h-6 w-6" />
        </button>
        <div className="max-w-[90vw] max-h-[90vh]">
          {renderMedia()}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`max-w-${maxWidth} max-h-${maxHeight} overflow-hidden`}>
        {renderMedia()}
      </div>
      {showControls && (
        <div className="absolute top-2 right-2 flex space-x-2">
          {isImage && (
            <button
              onClick={handleFullscreen}
              className="p-1 bg-white/80 rounded-full hover:bg-white"
            >
              <FiImage className="h-4 w-4 text-gray-600" />
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 bg-white/80 rounded-full hover:bg-white"
          >
            <FiFile className="h-4 w-4 text-gray-600" />
          </a>
        </div>
      )}
    </div>
  );
};

export default MediaDisplay; 