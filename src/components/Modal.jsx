import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  // Prevent scrolling on the body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Overlay: Fixed, centered, semi-transparent background with blur
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      
      {/* Modal Container: Matches your cards (White, Rounded-xl, Shadow-2xl) */}
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#800000]/5">
          <h3 className="text-lg font-bold text-[#333]">
            {title || "Notification"}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 text-gray-600 text-base leading-relaxed">
          {children}
        </div>

        {/* Footer / Actions */}
        {actions && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;