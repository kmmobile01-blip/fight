
import React, { useState, useEffect } from 'react';
import { PlayCircleIcon, LockIcon, FlashIcon } from '../Icons';

interface SplashScreenProps {
    onStart: () => void;
    isSeriousMode?: boolean;
    onToggleMode?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, isSeriousMode = true, onToggleMode }) => {
    const [isFiring, setIsFiring] = useState(false);

    // Warm up speech synthesis on mount (only if not serious)
    useEffect(() => {
        if (isSeriousMode) return;
        const synth = window.speechSynthesis;
        const loadVoices = () => { synth.getVoices(); };
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }, [isSeriousMode]);

    const handleStart = () => {
        if (isSeriousMode) {
            onStart();
            return;
        }

        // Fun Mode Logic
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance("団結！頑張ろう！");
        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja'));
        u.lang = 'ja-JP';
        if (preferredVoice) u.voice = preferredVoice;
        u.pitch = 1.2; 
        u.rate = 1.4;
        u.volume = 1.0;
        synth.speak(u);

        setIsFiring(true);
        setTimeout(() => {
            onStart();
        }, 2200);
    };
    
    // Helper to safely call toggle with stopPropagation
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Critical to prevent start action
        e.preventDefault();
        if (onToggleMode) onToggleMode();
    };

    // Serious Mode Render
    if (isSeriousMode) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-800 relative overflow-hidden font-sans">
                <div className="z-10 text-center animate-fade-in-up p-8 flex flex-col items-center">
                    <div className="text-blue-900 font-bold tracking-widest mb-2 text-sm uppercase">Kyoto Bus Co., Ltd.</div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-gray-900 leading-tight">
                        人事戦略シミュレーション<br/>システム
                    </h1>
                    <p className="text-gray-500 mb-12 text-base font-medium tracking-wide">HR Strategy Simulation System Ver 4.9</p>
                    
                    <button 
                        onClick={handleStart}
                        className="group relative px-10 py-3 bg-blue-900 text-white overflow-hidden rounded-lg shadow-lg hover:bg-blue-800 transition-all hover:-translate-y-0.5 active:translate-y-0 mb-8"
                    >
                        <div className="relative flex items-center gap-3 font-bold text-lg">
                            <span>システムを開始</span>
                            <PlayCircleIcon />
                        </div>
                    </button>
                </div>
                <div className="absolute bottom-8 text-xs text-gray-400 font-mono">
                    Confidential / Internal Use Only
                </div>
                
                {/* Discreet Mode Toggle Button (Absolute Bottom Right) */}
                <div className="absolute bottom-4 right-4 z-50">
                    <button 
                        onClick={handleToggle}
                        className="flex items-center gap-2 text-xs text-gray-300 hover:text-red-500 hover:underline transition-colors opacity-50 hover:opacity-100 p-2"
                        title="上級者モードへ切替"
                    >
                        <FlashIcon style={{width: 12}}/>
                        Advanced Mode
                    </button>
                </div>
            </div>
        );
    }

    // Fun Mode Render
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
            
            <div className={`z-10 text-center transition-all duration-300 flex flex-col items-center ${isFiring ? 'scale-110' : 'animate-fade-in-up'}`}>
                <div className="text-yellow-500 font-bold tracking-[0.5em] mb-6 text-base animate-pulse">HR STRATEGY SIMULATION SYSTEM</div>
                
                <h1 className="text-5xl md:text-9xl font-black mb-8 md:mb-16 tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-2xl leading-none md:leading-tight py-4 px-4 transform scale-100 md:scale-125" style={{ fontFamily: '"Russo One", sans-serif', textShadow: '0 0 30px rgba(234, 179, 8, 0.6)' }}>
                    SPRING<br/>FIGHTER<br/>'26
                </h1>
                
                {!isFiring ? (
                    <>
                        <button 
                            onClick={handleStart}
                            className="group relative px-12 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer mb-8"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-600 to-red-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative flex items-center gap-3 font-bold text-xl tracking-widest animate-pulse">
                                <PlayCircleIcon />
                                <span>PUSH START BUTTON</span>
                            </div>
                        </button>
                    </>
                ) : (
                    <div className="relative flex flex-col items-center justify-center h-48 animate-bounce gap-4">
                        <div className="text-6xl font-black text-cyan-300 italic tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,1)]" style={{ fontFamily: '"Russo One", sans-serif' }}>
                            団結！！
                        </div>
                        <div className="text-7xl font-black text-yellow-300 italic tracking-tighter drop-shadow-[0_0_20px_rgba(250,204,21,1)]" style={{ fontFamily: '"Russo One", sans-serif' }}>
                            頑張ろう！！
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600 rounded-full blur-[80px] opacity-50 animate-ping -z-10"></div>
                    </div>
                )}
            </div>
            
            <div className="absolute bottom-8 text-xs text-gray-500 font-mono">
                Ver 4.9.0 (Build 20260312) / Powered by Gemini 2.0 Flash
            </div>

            {/* Mode Toggle Button (Absolute Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-50">
                <button 
                    onClick={handleToggle}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors opacity-70 hover:opacity-100 p-2"
                >
                    <LockIcon style={{width: 12}}/>
                    Standard Mode
                </button>
            </div>
        </div>
    );
};
