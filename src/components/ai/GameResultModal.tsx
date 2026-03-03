
import React from 'react';

export interface GameResult {
    level: string;
    title: string;
    description: string;
    reason: string;
    isPlayerWin: boolean;
    qualitativeAgreements?: string[];
}

interface GameResultModalProps {
    result: GameResult;
    onClose: () => void;
    onSaveLog?: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({ result, onClose, onSaveLog }) => {
    React.useEffect(() => {
        const shout = () => {
            const text = result.isPlayerWin ? "YOU WIN" : "YOU LOSE";
            const uttr = new SpeechSynthesisUtterance(text);
            uttr.lang = 'en-US';
            uttr.rate = 1.2;
            uttr.pitch = 1.0;
            window.speechSynthesis.speak(uttr);
        };
        // Small delay to ensure modal is visible
        const timer = setTimeout(shout, 500);
        return () => clearTimeout(timer);
    }, [result.isPlayerWin]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className={`w-full max-w-lg p-1 rounded-2xl bg-gradient-to-br ${result.isPlayerWin ? 'from-yellow-400 via-red-500 to-pink-500' : 'from-gray-600 to-gray-900'} shadow-2xl overflow-hidden`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 text-center border-4 border-black/10 dark:border-white/10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="text-5xl md:text-6xl mb-4 animate-bounce">
                        {result.isPlayerWin ? '🏆' : '💸'}
                    </div>
                    <h3 className={`text-3xl md:text-4xl font-black italic tracking-tighter mb-2 ${result.isPlayerWin ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-purple-600' : 'text-gray-800 dark:text-gray-100'}`}>
                        {result.title}
                    </h3>
                    <div className="inline-block bg-black dark:bg-gray-900 text-white px-4 py-1 rounded-full font-mono font-bold text-lg md:text-xl mb-6 shadow-lg">
                        {result.level}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-bold text-base md:text-lg mb-4 leading-relaxed">
                        {result.description}
                    </p>
                    {result.qualitativeAgreements && result.qualitativeAgreements.length > 0 && (
                        <div className="mb-6 text-left">
                            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                                🤝 合意された非金銭的条件:
                            </h4>
                            <ul className="space-y-1">
                                {result.qualitativeAgreements.map((item, idx) => (
                                    <li key={idx} className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-start gap-2">
                                        <span className="mt-0.5">✅</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm text-left text-gray-600 dark:text-gray-300 border-l-4 border-gray-400 dark:border-gray-500 whitespace-pre-wrap">
                        <strong>💡 解説:</strong><br/>
                        {result.reason}
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 mt-8 justify-center">
                        <button 
                            onClick={onClose}
                            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
                        >
                            閉じる
                        </button>
                        {onSaveLog && (
                            <button 
                                onClick={onSaveLog}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                💾 交渉ログを保存
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
