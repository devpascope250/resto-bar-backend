'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  xxl: 'max-w-2xl',
  full: 'max-w-full'
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOutsideClick = true,
  showCloseButton = true
}: ModalProps) {
  // Handle header z-index and body overflow
  useEffect(() => {
    const header = document.querySelector('.header-zIndex');
    
    if (isOpen) {
      // When modal opens
      document.body.style.overflow = 'hidden';
      if (header) {
        header.classList.add('z-0');
        header.classList.remove('z-10');
      }
    } else {
      // When modal closes
      document.body.style.overflow = '';
      if (header) {
        header.classList.remove('z-0');
        header.classList.add('z-10');
      }
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      if (header) {
        header.classList.remove('z-0');
        header.classList.add('z-10');
      }
    };
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[49] modal-overlay transition-opacity duration-200"
        onClick={closeOnOutsideClick ? onClose : undefined}
      />

      {/* Modal container */}
      <div className="fixed top-4 left-0 right-0 bottom-0 flex items-start justify-center z-[1000] overflow-y-auto p-4">
        <div
          className={`relative rounded-lg bg-white shadow-xl w-full ${sizeClasses[size]} max-h-[calc(100vh-5rem)]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              {title && (
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          )}

          {/* Modal content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}