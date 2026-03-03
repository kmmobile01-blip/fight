
import React, { useRef, useEffect, useState } from 'react';
import { UploadIcon, TrashIcon, DatabaseIcon, FileTextIcon, PlayCircleIcon } from './Icons';

interface DataImportViewProps {
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearData: () => void;
    employeeCount: number;
    voiceEnabled: boolean;
    onNavigate: (id: string) => void;
}

export const DataImportView: React.FC<DataImportViewProps> = ({ onFileUpload, onClearData, employeeCount, voiceEnabled, onNavigate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Ken Voice Effect: "Sutoken Seiritsu"
    useEffect(() => {
        // Voice logic removed as requested
    }, [voiceEnabled]);

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    // Drag & Drop Handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = e.dataTransfer.files;
            // Create a synthetic event to match the expected interface of onFileUpload
            const mockEvent = {
                target: { files: files, value: '' }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            
            onFileUpload(mockEvent);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in transition-colors">
            <div className="max-w-2xl w-full">
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-center gap-3">
                        <DatabaseIcon /> データ管理・読込
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        人事システムから出力された従業員データファイルを読み込みます。<br/>
                        <span className="font-bold text-blue-600 dark:text-blue-400">※いつでも最新のデータに更新（上書き）可能です。</span>
                    </p>
                </div>

                <div 
                    className={`
                        border-4 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer group shadow-inner
                        ${isDragging 
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 scale-105' 
                            : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600 hover:scale-[1.02]'
                        }
                    `}
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-full shadow-lg mb-6 group-hover:rotate-12 transition-transform duration-300 pointer-events-none">
                        <UploadIcon style={{ width: 64, height: 64, color: '#3b82f6' }} />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-2 pointer-events-none">
                        {isDragging ? "ドロップして読み込み" : "ファイルをアップロード"}
                    </h3>
                    <p className="text-base text-blue-600 dark:text-blue-400 font-medium mb-6 pointer-events-none">
                        ドラッグ＆ドロップ または クリックして選択
                    </p>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                        onChange={onFileUpload} 
                    />
                    <div className="text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
                        対応: CSV (Shift-JIS/UTF-8), Excel (.xlsx/.xls)
                    </div>
                </div>

                {employeeCount > 0 && (
                    <div className="mt-10 space-y-4 animate-slide-up">
                        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-between">
                            <div className="text-left">
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Status</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <FileTextIcon /> 
                                    <span>現在 <span className="text-blue-600 dark:text-blue-400 text-2xl">{employeeCount}</span> 名のデータがロードされています</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('本当に全データを削除しますか？')) onClearData(); }}
                                className="px-6 py-3 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <TrashIcon /> データを全削除
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button 
                                onClick={() => onNavigate('settings')}
                                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                            >
                                <span>シミュレーション設定へ進む</span>
                                <div className="bg-white/20 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                                    <PlayCircleIcon />
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
