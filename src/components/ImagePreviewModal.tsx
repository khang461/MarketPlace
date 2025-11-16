import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
}) => {
  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && hasPrevious) {
      handlePrevious();
    } else if (e.key === 'ArrowRight' && hasNext) {
      handleNext();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Previous button */}
        {hasPrevious && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Image */}
        <div
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={currentImage}
            alt={`Preview ${currentIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>

        {/* Next button */}
        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewModal;

