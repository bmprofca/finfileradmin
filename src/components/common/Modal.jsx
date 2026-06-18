import { useEffect } from 'react';
import Button from './Button';
import { X } from 'lucide-react';


const Modal = ({ isOpen, onClose, title, icon: Icon, children, onConfirm, confirmText = 'Confirm', footer, size = 'md', className = '', contentClassName = 'p-4' }) => {
  const sizeClasses = {
    sm: 'max-w-md max-h-[50vh]',
    md: 'max-w-lg max-h-[60vh]',
    lg: 'max-w-xl max-h-[70vh]',
    xl: 'max-w-2xl max-h-[75vh]',
    '2xl': 'max-w-3xl max-h-[78vh]',
    '3xl': 'max-w-4xl max-h-[80vh]',
    '4xl': 'max-w-5xl max-h-[82vh]',
    '5xl': 'max-w-6xl max-h-[85vh]',
    full: 'max-w-full max-h-[90vh]',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950 w-full mx-4 z-10 animate-fade-in flex flex-col ${sizeClasses[size] || sizeClasses.md} ${className}`}>
        {/* Fixed Header */}
        <div className="shrink-0 rounded-t-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="flex justify-between items-center px-5 py-4 bg-gray-50/80 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-3 text-slate-800 dark:text-gray-100">
              {Icon && (
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                </span>
              )}
              {title}
            </h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Scrollable Body */}
        <div className={`overflow-y-auto flex-1 custom-scrollbar ${contentClassName}`}>
          {children}
        </div>

        {/* Fixed Footer */}
        {footer ? (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50/80 dark:bg-gray-800/50 rounded-b-lg">
            {footer}
          </div>
        ) : onConfirm ? (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50/80 dark:bg-gray-800/50 rounded-b-lg">
            <Button variant="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;