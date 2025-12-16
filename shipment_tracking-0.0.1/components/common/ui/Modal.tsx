
import React from 'react';
import { Icons } from '../../Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-secondary-900/50 transition-opacity" 
        aria-hidden="true"
        onClick={onClose}
      ></div>
      
      {/* Modal Panel */}
      <div className={`
        relative w-full bg-white dark:bg-secondary-800 shadow-xl transform transition-transform duration-300 ease-out
        sm:rounded-xl ${sizeClasses[size]}
        max-h-[90vh] rounded-t-2xl animate-slide-in-up sm:animate-none
      `}>
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center pb-3 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100" id="modal-title">
              {title}
            </h3>
            <button onClick={onClose} className="p-1 rounded-full text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
              <Icons.X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 max-h-[calc(90vh-100px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
