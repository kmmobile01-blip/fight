
import React from 'react';

interface NavBtnProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    active: string;
    set: (id: string) => void;
    isOpen?: boolean;
}

export const NavBtn: React.FC<NavBtnProps> = ({ id, label, icon, active, set, isOpen = true }) => (
    <button 
        onClick={() => set(id)} 
        className={`w-full flex items-center gap-3 px-2 py-2.5 rounded mb-1 text-sm font-bold transition-all 
            ${active === id 
                ? 'bg-red-50 text-red-900 border-l-4 border-red-600 shadow-sm dark:bg-red-900/30 dark:text-red-200 dark:border-red-500' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
            }
            ${isOpen ? 'justify-start' : 'justify-center pl-0 pr-0'} 
            md:justify-start
        `}
        title={label}
    >
        <span className={`flex-shrink-0 ${active === id ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{icon}</span>
        <span className={`${isOpen ? 'block' : 'hidden'} md:block whitespace-nowrap overflow-hidden text-ellipsis`}>{label}</span>
    </button>
);
