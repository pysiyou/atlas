import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface TableActionMenuProps {
  children: React.ReactNode;
}

export const TableActionMenu: React.FC<TableActionMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors focus:outline-none cursor-pointer ${
          isOpen 
            ? 'bg-sky-50 text-sky-600' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        title="Actions"
      >
        <Icon name="menu-dots" className="w-5 h-5" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1 origin-top-right focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface TableActionItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

export const TableActionItem: React.FC<TableActionItemProps> = ({ 
  onClick, 
  icon, 
  label, 
  variant = 'default' 
}) => {
  return (
    <button
      onClick={() => {
        onClick();
        // Menu closing is handled by the parent's click outside or navigation
        // But for direct actions we might want to close it manually if we had access to setIsOpen
        // However, usually navigation or state change will happen. 
        // For now let's rely on standard flow.
      }}
      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer ${
        variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      }`}
    >
      {icon && <span className={variant === 'danger' ? 'text-red-600' : 'text-gray-500'}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};
