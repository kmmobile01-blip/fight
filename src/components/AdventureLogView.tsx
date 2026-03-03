
import React, { useState, useRef, useEffect } from 'react';
import { BookOpenIcon, DownloadIcon, UploadIcon, TrashIcon, RefreshCwIcon } from './Icons';
import { SimulationConfig, RaisePlanYear, RecruitmentPlanYear, ImpactRateYear, FinancialPlan, CustomAllowance } from '../types';

interface AdventureLogViewProps {
    // Current State to Save
    configA: SimulationConfig;
    configB: SimulationConfig;
    raisePlanA: Record<number, RaisePlanYear>;
    raisePlanB: Record<number, RaisePlanYear>;
    recruitmentPlanA: Record<number, RecruitmentPlanYear>;
    recruitmentPlanB: Record<number, RecruitmentPlanYear>;
    impactRatesA: Record<number, ImpactRateYear>;
    impactRatesB: Record<number, ImpactRateYear>;
    customAllowances: CustomAllowance[];
    financialData: FinancialPlan[];
    negotiationMaterials: string;
    sharedCosts: {
        recruit: number;
        training: number;
        license: number;
        safety: number;
    };
    
    // Actions
    onReset: () => void;
    onLoad: (data: any) => boolean;
    onCancel: () => void;
    voiceEnabled: boolean;
    isSeriousMode: boolean; // Added
    onReturnToTitle?: () => void;
}

// Flatten helper (for CSV Export)
const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date)) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
             acc[pre + k] = JSON.stringify(obj[k]);
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
};

// Unflatten helper (for CSV Import)
const unflattenObject = (data: Record<string, any>): any => {
    const result: any = {};
    for (const i in data) {
        const keys = i.split('.');
        let current = result;
        for (let j = 0; j < keys.length; j++) {
            const key = keys[j];
            const isLast = j === keys.length - 1;
            
            if (isLast) {
                let val = data[i];
                if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                    try { val = JSON.parse(val); } catch(e) {}
                }
                if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
                    val = Number(val);
                }
                if (val === 'true') val = true;
                if (val === 'false') val = false;

                current[key] = val;
            } else {
                current[key] = current[key] || {};
                current = current[key];
            }
        }
    }
    return result;
};


export const AdventureLogView: React.FC<AdventureLogViewProps> = ({ 
    configA, configB, raisePlanA, raisePlanB, recruitmentPlanA, recruitmentPlanB, 
    impactRatesA, impactRatesB, customAllowances, financialData, negotiationMaterials, sharedCosts,
    onReset, onLoad, onCancel, voiceEnabled, isSeriousMode, onReturnToTitle
}) => {
    const [mode, setMode] = useState<'menu' | 'reset_confirm'>('menu');
    const [isResetting, setIsResetting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initial Voice (Only in Ura Mode)
    useEffect(() => {
        // Voice is now handled in App.tsx handleNavChange
    }, [voiceEnabled, isSeriousMode]);

    // Cleanup audio
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                try { audioContextRef.current.close(); } catch(e) {}
                audioContextRef.current = null;
            }
        };
    }, []);

    // --- Actions ---

    const handleExport = () => {
        const fullState = {
            configA, configB,
            raisePlanA, raisePlanB,
            recruitmentPlanA, recruitmentPlanB,
            impactRatesA, impactRatesB,
            customAllowances,
            financialData,
            negotiationMaterials,
            sharedRecruitCost: sharedCosts.recruit,
            sharedTrainingCost: sharedCosts.training,
            sharedLicenseCost: sharedCosts.license,
            sharedSafetyValue: sharedCosts.safety
        };

        const flat = flattenObject(fullState);
        
        // Convert to CSV
        const csvRows = [
            ["Key", "Value"]
        ];
        Object.keys(flat).forEach(key => {
            let val = flat[key];
            // Escape special CSV chars
            if (typeof val === 'string') {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            csvRows.push([key, val]);
        });
        
        const csvString = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sf26_settings_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        // Sound Effect (Only Ura Mode)
        if (!isSeriousMode && voiceEnabled) playSaveSound();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                // Simple CSV parser
                const lines = text.split(/\r\n|\n/);
                const data: Record<string, any> = {};
                
                lines.forEach((line, i) => {
                    if (i === 0) return; // Skip header
                    if (!line.trim()) return;
                    
                    // Regex to handle quoted CSV values
                    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (parts && parts.length >= 2) {
                        const key = parts[0];
                        let val = parts[1];
                        
                        // Remove quotes
                        if (val.startsWith('"') && val.endsWith('"')) {
                            val = val.slice(1, -1).replace(/""/g, '"');
                        }
                        
                        const firstComma = line.indexOf(',');
                        if (firstComma > -1) {
                            const realKey = line.substring(0, firstComma).trim();
                            let realVal = line.substring(firstComma + 1).trim();
                             if (realVal.startsWith('"') && realVal.endsWith('"')) {
                                realVal = realVal.slice(1, -1).replace(/""/g, '"');
                            }
                            data[realKey] = realVal;
                        }
                    }
                });

                const restoredState = unflattenObject(data);
                const success = onLoad(restoredState);
                
                if (success) {
                    if (!isSeriousMode && voiceEnabled) playLoadSound();
                    alert("設定データを読み込みました。");
                } else {
                    alert("読み込みに失敗しました。データ形式を確認してください。");
                }
            } catch (err) {
                console.error(err);
                alert("ファイルの解析に失敗しました。");
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleFinalReset = () => {
        setIsResetting(true);
        if (!isSeriousMode && voiceEnabled) playResetSound();
        
        // Wait for sound to finish
        setTimeout(() => {
            onReset();
            onCancel(); // Go back to dashboard
        }, isSeriousMode ? 500 : 2200);
    };

    // --- Sound Effects ---

    const playSaveSound = () => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    };
    
    const playLoadSound = () => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    };

    const playResetSound = () => {
        // Dragon Quest Curse Style
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        
        const playNote = (time: number, freq: number, type: OscillatorType = 'square') => {
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             osc.type = type;
             osc.frequency.value = freq;
             gain.gain.setValueAtTime(0.1, time);
             gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
             osc.connect(gain);
             gain.connect(ctx.destination);
             osc.start(time);
             osc.stop(time + 0.2);
        };
        
        const t = ctx.currentTime;
        playNote(t, 220); 
        playNote(t+0.2, 207);
        playNote(t+0.4, 196);
        playNote(t+0.6, 185); // Downward chromatic
        
        // Add Noise
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.5, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        noise.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(t);
    };

    // --- Dynamic Labels ---
    const labels = {
        title: isSeriousMode ? "設定データ管理" : "ぼうけんのしょ",
        subTitle: isSeriousMode ? "Configuration Management" : "Data Management (Parameters Settings)",
        btnExport: isSeriousMode ? "エクスポート" : "記録する",
        descExport: isSeriousMode ? "現在の設定値をCSVファイルとして保存します。" : "現在の設定値をCSVファイル\nとして保存します。",
        btnImport: isSeriousMode ? "インポート" : "ふっかつのじゅもん",
        descImport: isSeriousMode ? "CSVファイルを読み込み設定を復元します。" : "CSVファイルを読み込み\n設定を復元します。",
        btnReset: isSeriousMode ? "初期化" : "設定リセット",
        descReset: isSeriousMode ? "全ての設定をデフォルトに戻します。" : "全ての設定を初期状態に\n戻します。(取扱注意)",
        resetTitle: isSeriousMode ? "設定初期化の確認" : "RESET CONFIRMATION",
        resetMsg: isSeriousMode ? "全ての設定パラメータを初期状態に戻します。\nよろしいですか？（この操作は取り消せません）" : "すべてのパラメータを\n初期状態に戻します。\nよろしいですか？",
        resetBtnYes: isSeriousMode ? "初期化を実行" : "はい",
        resetBtnNo: isSeriousMode ? "キャンセル" : "いいえ",
    };

    if (mode === 'reset_confirm') {
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 text-white flex flex-col items-center justify-center p-8 animate-fade-in backdrop-blur-sm">
                <div className={`max-w-2xl w-full text-center relative z-10 border-4 p-12 rounded-xl transition-all duration-500 ${
                    isSeriousMode ? 'bg-white text-gray-800 border-gray-300' : 'bg-gray-900 text-purple-100 border-purple-800 shadow-[0_0_50px_rgba(147,51,234,0.5)]'
                } ${isResetting ? 'scale-95 opacity-50 blur-sm grayscale' : ''}`}>
                    <div className="mb-8">
                        <RefreshCwIcon style={{ width: 80, height: 80, color: isSeriousMode ? '#4b5563' : '#d8b4fe', margin: '0 auto' }} className={isResetting ? "animate-spin" : isSeriousMode ? "" : "animate-spin-slow"} />
                    </div>
                    <h1 className={`text-4xl font-black mb-6 ${isSeriousMode ? 'text-gray-800' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-600 tracking-widest'}`}>{labels.resetTitle}</h1>
                    <p className={`text-lg mb-8 leading-relaxed ${isSeriousMode ? 'text-gray-600 font-bold whitespace-pre-wrap' : 'text-purple-200'}`}>
                        {labels.resetMsg}
                    </p>
                    <div className="flex gap-6 justify-center items-center">
                         <button onClick={() => setMode('menu')} disabled={isResetting} className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded border border-gray-400 disabled:opacity-50">{labels.resetBtnNo}</button>
                         <button onClick={handleFinalReset} disabled={isResetting} className={`px-8 py-4 font-black text-xl rounded transition-transform flex items-center gap-2 ${
                             isSeriousMode 
                             ? 'bg-red-600 hover:bg-red-700 text-white border-none' 
                             : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(255,0,0,0.8)] border-4 border-yellow-400 hover:scale-110 animate-pulse'
                         } ${isResetting ? 'cursor-not-allowed opacity-80' : ''}`}>
                            {isResetting ? <span className="flex items-center gap-2">{isSeriousMode ? '処理中...' : <>消失中... <span className="animate-ping">💀</span></>}</span> : <><TrashIcon /> {labels.resetBtnYes}</>}
                         </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-[85vh] rounded-lg shadow-2xl p-4 md:p-8 flex flex-col items-center justify-center relative overflow-y-auto transition-colors ${
            isSeriousMode ? 'bg-gray-50 text-gray-800' : 'bg-gradient-to-br from-gray-900 to-slate-800 text-white font-mono'
        }`}>
            {/* Background Texture (Only Ura Mode) */}
            {!isSeriousMode && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 pointer-events-none"></div>}

            <div className="z-10 w-full max-w-4xl">
                <div className="text-center mb-12">
                    <BookOpenIcon style={{width: 64, height: 64, margin: '0 auto', marginBottom: '1rem', color: isSeriousMode ? '#4b5563' : '#fbbf24'}} />
                    <h2 className={`text-4xl font-black mb-2 ${isSeriousMode ? 'text-gray-800' : 'tracking-widest text-yellow-400 drop-shadow-lg'}`}>{labels.title}</h2>
                    <p className={`text-sm ${isSeriousMode ? 'text-gray-500' : 'text-gray-400'}`}>{labels.subTitle}</p>
                    {onReturnToTitle && (
                        <button 
                            onClick={onReturnToTitle}
                            className="mt-4 bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded-full shadow-lg font-bold transition-all text-sm inline-flex items-center gap-2"
                        >
                            <span>🚪 タイトル画面へ戻る</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Slot 1: Export */}
                    <button 
                        onClick={handleExport}
                        className={`group border-4 rounded-xl p-6 transition-all transform hover:-translate-y-2 relative overflow-hidden flex flex-col items-center gap-4 ${
                            isSeriousMode 
                            ? 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md' 
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-blue-500'
                        }`}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors ${
                            isSeriousMode ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-900 border-gray-700 group-hover:border-blue-500'
                        }`}>
                            <DownloadIcon style={{width: 32, height: 32, color: '#60a5fa'}} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">{labels.btnExport}</h3>
                            <p className={`text-xs whitespace-pre-wrap ${isSeriousMode ? 'text-gray-500' : 'text-gray-400'}`}>{labels.descExport}</p>
                        </div>
                    </button>

                    {/* Slot 2: Import */}
                    <div 
                        className={`group border-4 rounded-xl p-6 transition-all transform hover:-translate-y-2 relative overflow-hidden flex flex-col items-center gap-4 cursor-pointer ${
                            isSeriousMode 
                            ? 'bg-white border-gray-200 hover:border-green-500 hover:shadow-md' 
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-green-500'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors ${
                            isSeriousMode ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-900 border-gray-700 group-hover:border-green-500'
                        }`}>
                            <UploadIcon style={{width: 32, height: 32, color: '#4ade80'}} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">{labels.btnImport}</h3>
                            <p className={`text-xs whitespace-pre-wrap ${isSeriousMode ? 'text-gray-500' : 'text-gray-400'}`}>{labels.descImport}</p>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
                    </div>

                    {/* Slot 3: Reset */}
                    <button 
                        onClick={() => setMode('reset_confirm')}
                        className={`group border-4 rounded-xl p-6 transition-all transform hover:-translate-y-2 relative overflow-hidden flex flex-col items-center gap-4 ${
                            isSeriousMode 
                            ? 'bg-white border-gray-200 hover:border-red-500 hover:shadow-md' 
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-red-500'
                        }`}
                    >
                        <div className={`p-4 rounded-full border-2 transition-colors ${
                            isSeriousMode ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-900 border-gray-700 group-hover:border-red-500'
                        }`}>
                            <TrashIcon style={{width: 32, height: 32, color: '#f87171'}} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">{labels.btnReset}</h3>
                            <p className={`text-xs whitespace-pre-wrap ${isSeriousMode ? 'text-gray-500' : 'text-gray-400'}`}>{labels.descReset}</p>
                        </div>
                    </button>
                </div>
                
                <div className="mt-12 text-center">
                    <button onClick={onCancel} className={`${isSeriousMode ? 'text-gray-500 hover:text-gray-800' : 'text-gray-400 hover:text-white'} underline text-sm transition-colors`}>
                        ダッシュボードへ戻る
                    </button>
                </div>
            </div>
        </div>
    );
};
