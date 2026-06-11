import { useEffect } from 'react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = 'Confirm' }) => {
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
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10 animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
        {onConfirm && (
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;