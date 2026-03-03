
import React from 'react';
import { HomeIcon, MenuIcon } from '../Icons';

interface MobileHeaderProps {
    title: string;
    onOpenSidebar: () => void;
    onReturnToTitle?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onOpenSidebar, onReturnToTitle }) => {
    return (
        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-2">
                <button 
                    onClick={onOpenSidebar}
                    className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                    title="メニューを開く"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
                {onReturnToTitle && (
                    <button 
                        onClick={onReturnToTitle}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="タイトルに戻る"
                    >
                        <HomeIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate flex-1 text-right">{title}</h1>
        </header>
    );
};
