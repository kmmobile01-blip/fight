
import React from 'react';
import { CommitteeIcon, BotIcon, PrinterIcon, FileTextIcon } from '../Icons';

interface ReportGeneratorProps {
    mode: 'requirements' | 'analysis';
    reportText: string;
    loading: boolean;
    onGenerate: () => void;
    onReset: () => void;
    onReturnToTitle?: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ mode, reportText, loading, onGenerate, onReset, onReturnToTitle }) => {
    const handlePrint = () => window.print();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[85vh] flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {mode === 'requirements' ? <CommitteeIcon /> : <BotIcon />}
                        {mode === 'requirements' ? 'AI 春闘要求書案 作成' : 'AI 労担レポート (分析報告書)'}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {reportText && (
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded shadow hover:bg-gray-700 text-sm font-bold">
                            <PrinterIcon /> 印刷
                        </button>
                    )}
                    {onReturnToTitle && (
                        <button 
                            onClick={onReturnToTitle}
                            className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow shadow-red-900/20"
                        >
                            <span>🚪 終了</span>
                        </button>
                    )}
                </div>
            </div>

            {!reportText ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        {mode === 'requirements' ? <FileTextIcon /> : <BotIcon />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {mode === 'requirements' ? '春闘要求書のドラフトを作成します' : 'シミュレーション結果を分析します'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md font-medium">
                        現在のシミュレーション結果（人員推移・コスト増減）と、入力された決算データを基に、AIがドキュメントを自動生成します。
                    </p>
                    <button 
                        onClick={onGenerate}
                        disabled={loading}
                        className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105 ${
                            loading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'AIが執筆中...' : 'レポートを作成開始'}
                    </button>
                </div>
            ) : (
                <div className="flex-1 bg-white dark:bg-gray-900 p-8 rounded border border-gray-200 dark:border-gray-700 shadow-sm markdown-body overflow-y-auto font-serif leading-loose text-gray-900 dark:text-gray-200">
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        {reportText}
                    </div>
                    <div className="mt-8 pt-4 border-t dark:border-gray-700 flex justify-end">
                        <button 
                            onClick={onReset} 
                            className="text-gray-600 dark:text-gray-400 underline text-sm hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            やり直す
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
