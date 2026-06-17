import { useEffect } from 'react';
import Button from './Button';
import { X } from 'lucide-react';


const Modal = ({ isOpen, onClose, title, icon: Icon, children, onConfirm, confirmText = 'Confirm', footer, size = 'md', className = '', contentClassName = 'p-4' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
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
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950 w-full mx-4 z-10 animate-fade-in flex flex-col max-h-[90vh] ${sizeClasses[size] || sizeClasses.md} ${className}`}>
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 rounded-t-lg">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-gray-100">
            {Icon && <Icon size={20} className="text-emerald-700 dark:text-emerald-400" />}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className={`overflow-y-auto flex-1 custom-scrollbar ${contentClassName}`}>
          {children}
        </div>

        {/* Fixed Footer */}
        {footer ? (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            {footer}
          </div>
        ) : onConfirm ? (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;