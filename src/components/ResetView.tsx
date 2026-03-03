
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCwIcon, TrashIcon, CheckIcon } from './Icons';

interface ResetViewProps {
    onReset: () => void;
    onCancel: () => void;
}

export const ResetView: React.FC<ResetViewProps> = ({ onReset, onCancel }) => {
    const [step, setStep] = useState<'initial' | 'confirm'>('initial');
    const [isResetting, setIsResetting] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Cursed Music Generator (Dragon Quest 3 Style Curse Theme approximation)
    // Short, jarring, repetitive, dissonant melody.
    const playCursedNote = (ctx: AudioContext, time: number, freq: number, dur: number, type: OscillatorType = 'square') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Use Sawtooth/Square for 8-bit NES feel
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        // Tremolo effect for "shuddering" feel
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 15; // Fast vibrato
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(time);
        lfo.stop(time + dur);

        // Envelope
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur - 0.05);
        gain.gain.setValueAtTime(0, time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + dur);
    };

    const playResetSound = () => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // "Poof!" Vanishing sound
        // White noise burst with rapid decay
        const bufferSize = ctx.sampleRate * 2.0; // 2.0 sec buffer
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();

        // Downward slide whistle (8-bit style) - Cursed Melody
        const t = ctx.currentTime;
        playCursedNote(ctx, t, 880, 0.1, 'sawtooth');
        playCursedNote(ctx, t + 0.15, 440, 0.1, 'sawtooth');
        playCursedNote(ctx, t + 0.30, 220, 0.2, 'sawtooth');
        playCursedNote(ctx, t + 0.60, 110, 0.6, 'sawtooth');
        
        // Final dissonant chord at the end
        playCursedNote(ctx, t + 1.2, 55, 1.0, 'square');
        playCursedNote(ctx, t + 1.2, 69, 1.0, 'square'); // Tritone
    };

    const handleConfirmClick = () => {
        setStep('confirm');
    };

    const handleFinalReset = () => {
        setIsResetting(true);
        playResetSound();
        
        // Wait for sound to finish (approx 2.2s) before navigating
        setTimeout(() => {
            onReset();
        }, 2200);
    };

    useEffect(() => {
        // Cleanup audio context on unmount
        return () => {
            if (audioContextRef.current) {
                try {
                    audioContextRef.current.close();
                } catch(e) { console.debug(e); }
                audioContextRef.current = null;
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black text-purple-100 font-mono flex flex-col items-center justify-center p-8 animate-fade-in">
            {/* Visual Glitch Effects Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
            </div>

            <div className={`max-w-2xl w-full text-center relative z-10 border-4 border-purple-800 p-12 rounded-xl bg-gray-900 shadow-[0_0_50px_rgba(147,51,234,0.5)] transition-all duration-500 ${isResetting ? 'scale-95 opacity-50 blur-sm grayscale' : ''}`}>
                <div className="mb-8">
                    <RefreshCwIcon style={{ width: 80, height: 80, color: '#d8b4fe', margin: '0 auto' }} className={isResetting ? "animate-spin" : "animate-spin-slow"} />
                </div>
                
                <h1 className="text-4xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-600 tracking-widest" style={{ textShadow: '2px 2px 0px #4c1d95' }}>
                    CURSED RESET
                </h1>
                
                <p className="text-lg mb-8 leading-relaxed text-purple-200">
                    おきのどくですが<br/>
                    すべての　パラメータは<br/>
                    しょきちに　もどってしまいます。
                </p>

                <div className="flex gap-6 justify-center items-center">
                    {step === 'initial' ? (
                        <>
                            <button 
                                onClick={onCancel}
                                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded shadow-lg border border-gray-600 transition-transform hover:scale-105"
                            >
                                やめる
                            </button>
                            <button 
                                onClick={handleConfirmClick}
                                className="px-8 py-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-red-600 transition-transform hover:scale-105"
                            >
                                ぼうけんのしょを　けす
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => setStep('initial')}
                                disabled={isResetting}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded border border-gray-500 disabled:opacity-50"
                            >
                                いいえ
                            </button>
                            <button 
                                onClick={handleFinalReset}
                                disabled={isResetting}
                                className={`px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded shadow-[0_0_30px_rgba(255,0,0,0.8)] border-4 border-yellow-400 transition-transform flex items-center gap-2 ${isResetting ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 animate-pulse'}`}
                            >
                                {isResetting ? (
                                    <span className="flex items-center gap-2">
                                        消失中... <span className="animate-ping">💀</span>
                                    </span>
                                ) : (
                                    <>
                                        <TrashIcon /> ほんとうに　いいですか？
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
                
                <p className="mt-8 text-xs text-purple-500 opacity-60">
                    ※従業員マスタデータ（CSV読込内容）は保持されます。<br/>
                    昇給計画・採用計画・制度設定のみがリセットされます。
                </p>
            </div>
        </div>
    );
};
