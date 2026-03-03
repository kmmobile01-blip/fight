
import React, { useEffect } from 'react';
import { SettingsIcon, CheckIcon } from './Icons';

interface ApiKeySettingsViewProps {
    voiceEnabled: boolean;
}

export const ApiKeySettingsView: React.FC<ApiKeySettingsViewProps> = ({ voiceEnabled }) => {
    
    // Voice Effect: "Daini Kumiai o Hossoku"
    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("第二組合を発足！");
        u.lang = 'ja-JP';
        u.pitch = 1.2; // Chun-Li style
        u.rate = 1.4;  
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [voiceEnabled]);

    const [customKey, setCustomKey] = React.useState('');
    const [isSaved, setIsSaved] = React.useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setCustomKey(savedKey);
            setIsSaved(true);
        }
    }, []);

    const handleSaveKey = () => {
        if (!customKey.trim()) {
            alert("APIキーを入力してください。");
            return;
        }
        localStorage.setItem('gemini_api_key', customKey.trim());
        setIsSaved(true);
        alert("APIキーを保存しました。これ以降、入力されたキーが優先的に使用されます。");
        window.location.reload(); // Reload to apply changes immediately
    };

    const handleClearKey = () => {
        localStorage.removeItem('gemini_api_key');
        setCustomKey('');
        setIsSaved(false);
        alert("カスタムAPIキーを削除しました。システムデフォルトのキーに戻ります。");
        window.location.reload();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in transition-colors">
            <div className="max-w-xl w-full p-8 border-4 border-double border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900">
                <div className="mb-8">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                        <SettingsIcon style={{ width: 48, height: 48 }} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2">APIキー設定</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-bold">Google Gemini API</p>
                </div>

                <div className="space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        AI機能を利用するためのAPIキーを設定します。<br/>
                        通常はシステムデフォルトのキーが使用されますが、<br/>
                        独自のキーを使用したい場合は以下に入力してください。
                    </p>

                    <div className="flex flex-col gap-4">
                        <input
                            type="password"
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handleSaveKey}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <span>💾</span> 保存して適用
                            </button>
                            {isSaved && (
                                <button 
                                    onClick={handleClearKey}
                                    className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-xl font-bold transition-colors"
                                >
                                    削除
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`text-left p-6 rounded-xl border ${isSaved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                        <h4 className={`font-bold mb-2 flex items-center gap-2 text-lg ${isSaved ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                            <CheckIcon /> ステータス確認
                        </h4>
                        <p className={`font-medium ${isSaved ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                            {isSaved 
                                ? "現在、ユーザー設定のカスタムAPIキーが使用されています。" 
                                : "現在、システムデフォルトのAPIキーが使用されています。"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
