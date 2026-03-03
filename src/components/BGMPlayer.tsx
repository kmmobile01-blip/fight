import React, { useState, useRef, useEffect } from 'react';
import { MusicIcon, PlayCircleIcon, PauseCircleIcon, Volume2Icon, UploadIcon } from './Icons';

export const BGMPlayer = () => {
    const [playing, setPlaying] = useState(false);
    const [src, setSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("♪ 女ふたり－京都、バスに揺られて");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Web Audio API refs for fallback synth
    const audioCtxRef = useRef<AudioContext | null>(null);
    const isPlayingRef = useRef(false);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    const melodyIndexRef = useRef(0);

    // Kyoto-esque melody (Miyako-bushi scale: D, Eb, G, A, Bb)
    // Approximate gentle Japanese melody vibe
    const melody = [
        { note: 293.66, dur: 0.5 }, // D4
        { note: 311.13, dur: 0.5 }, // Eb4
        { note: 392.00, dur: 1.0 }, // G4
        { note: 440.00, dur: 0.5 }, // A4
        { note: 466.16, dur: 0.5 }, // Bb4
        { note: 440.00, dur: 1.0 }, // A4
        { note: 392.00, dur: 0.5 }, // G4
        { note: 311.13, dur: 0.5 }, // Eb4
        { note: 293.66, dur: 2.0 }, // D4
        { note: 0, dur: 0.5 },      // Rest
        { note: 293.66, dur: 0.5 }, // D4
        { note: 392.00, dur: 0.5 }, // G4
        { note: 440.00, dur: 0.5 }, // A4
        { note: 466.16, dur: 1.0 }, // Bb4
        { note: 440.00, dur: 0.5 }, // A4
        { note: 392.00, dur: 0.5 }, // G4
        { note: 311.13, dur: 0.5 }, // Eb4
        { note: 293.66, dur: 2.0 }, // D4
        { note: 0, dur: 1.0 },      // Rest
    ];

    const scheduleNote = (ctx: AudioContext) => {
        const noteData = melody[melodyIndexRef.current % melody.length];
        
        if (noteData.note > 0) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Use a mix of sine and triangle for a gentle retro synth tone
            osc.type = 'triangle';
            osc.frequency.value = noteData.note;
            
            // Envelope
            gain.gain.setValueAtTime(0, nextNoteTimeRef.current);
            gain.gain.linearRampToValueAtTime(0.05, nextNoteTimeRef.current + 0.05); // Attack
            gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTimeRef.current + noteData.dur * 0.8); // Decay
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(nextNoteTimeRef.current);
            osc.stop(nextNoteTimeRef.current + noteData.dur);
        }

        nextNoteTimeRef.current += noteData.dur * 0.8; // Tempo factor
        melodyIndexRef.current++;
    };

    const scheduler = () => {
        if (!isPlayingRef.current || !audioCtxRef.current) return;
        // Schedule ahead
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
            scheduleNote(audioCtxRef.current);
        }
        timerIDRef.current = window.setTimeout(scheduler, 25);
    };

    const startSynth = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        isPlayingRef.current = true;
        nextNoteTimeRef.current = audioCtxRef.current.currentTime;
        melodyIndexRef.current = 0;
        scheduler();
    };

    const stopSynth = () => {
        isPlayingRef.current = false;
        if (timerIDRef.current) {
            clearTimeout(timerIDRef.current);
            timerIDRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopSynth();
    }, []);

    const togglePlay = () => {
        if (src) {
            // File mode
            if (audioRef.current) {
                if (playing) {
                    audioRef.current.pause();
                } else {
                    audioRef.current.play();
                }
                setPlaying(!playing);
            }
        } else {
            // Synth mode
            if (playing) {
                stopSynth();
                setPlaying(false);
            } else {
                startSynth();
                setPlaying(true);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            stopSynth();
            const url = URL.createObjectURL(file);
            setSrc(url);
            setPlaying(false);
            setTimeout(() => {
                if(audioRef.current) {
                    audioRef.current.play().then(()=>setPlaying(true)).catch(e=>console.log(e));
                }
            }, 100);
        }
    };

    return (
        <div className="bg-[#450a0a] border-t-2 border-yellow-600 p-3 text-white shadow-lg relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600 opacity-50"></div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={togglePlay}
                    className="text-yellow-400 hover:text-yellow-200 transition-colors shrink-0"
                >
                    {playing ? <PauseCircleIcon /> : <PlayCircleIcon />}
                </button>
                
                <div className="flex-1 overflow-hidden">
                    <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider mb-0.5 flex justify-between">
                        <span>Bus Radio System</span>
                        <div className="flex gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${playing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-[9px] opacity-70">{src ? 'FILE' : 'SYNTH'}</span>
                        </div>
                    </div>
                    <div className="whitespace-nowrap overflow-hidden relative h-5">
                        <div className={`text-sm font-bold text-white absolute whitespace-nowrap ${playing ? 'animate-marquee' : ''}`}>
                            {fileName} {(!src) && "(Music Box Ver.)"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white"
                        title="音楽ファイルをロード"
                    >
                        <UploadIcon style={{ width: 14, height: 14 }} />
                    </button>
                </div>
            </div>

            <audio 
                ref={audioRef} 
                src={src || undefined} 
                loop 
                onEnded={() => setPlaying(false)}
            />
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="audio/*" 
                onChange={handleFileChange}
            />
            
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 10s linear infinite;
                }
            `}</style>
        </div>
    );
};