
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { getPersonaConfig } from '../utils/aiConstants';
import { SYSTEM_SPECS } from '../utils/systemSpecs';
import { TerminalIcon, SendIcon, UserIcon, TrashIcon, Volume2Icon, PauseCircleIcon } from './Icons';
import { generateContentWithFallback, generateContentWithRetry, getGeminiApiKey } from '../utils/geminiHelper';
import { SimulationResult, SimulationConfig, FinancialPlan } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface OharaMikoChatViewProps {
    configA?: SimulationConfig;
    resultA?: SimulationResult;
    financialData?: FinancialPlan[];
    voiceEnabled?: boolean;
    onReturnToTitle?: () => void;
    isSeriousMode?: boolean; // Added prop
}

// Audio Decoding Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const OharaMikoChatView: React.FC<OharaMikoChatViewProps> = ({ configA, resultA, financialData, voiceEnabled, onReturnToTitle, isSeriousMode = true }) => {
    
    // Dynamic Persona Selection
    const personaId = isSeriousMode ? 'standard_admin' : 'ohara_miko';
    const personaConfig = getPersonaConfig(personaId);
    
    // Initial Message varies by mode
    const initialMsg = isSeriousMode 
        ? "システム操作ガイドです。ご不明な点があればお尋ねください。\nシミュレーション結果や設定内容についても回答可能です。"
        : "おこしやす。大原神子（おおはら　みこ）いいますねん。AI相談窓口へようこそ。まあ、今日も朝から晩まで、えらいお精が出ますこと。\nあんさんがそこまで必死に動いてはるのを見てますとね、まるで千本通から鹿ヶ谷まで、お一人で打ち水して歩いてはるような、気の遠くなるようなお志を感じて、ほんまに頭が下がりますわぁ。";

    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: initialMsg }
    ]);
    
    // Reset messages when mode changes
    useEffect(() => {
        setMessages([{ role: 'model', text: initialMsg }]);
    }, [isSeriousMode]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [speakingText, setSpeakingText] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentRequestIdRef = useRef<number>(0);
    const introPlayedRef = useRef<boolean>(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Cleanup audio context on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    const stopAudio = () => {
        // Clear any pending timeouts
        if (pendingTimeoutRef.current) {
            clearTimeout(pendingTimeoutRef.current);
            pendingTimeoutRef.current = null;
        }

        // Increment request ID to invalidate any pending async TTS requests
        currentRequestIdRef.current += 1;

        // Stop Gemini TTS source
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
            currentSourceRef.current = null;
        }
        // Stop Browser TTS
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setSpeakingText(null);
    };

    // Gemini TTS Function
    const playGeminiTTS = async (text: string) => {
        if (!getGeminiApiKey()) return;
        
        try {
            // Stop any playing audio first
            stopAudio();
            
            // Capture the request ID for this specific call
            const requestId = currentRequestIdRef.current;
            setSpeakingText(text);

            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
            // Clean text for TTS
            const cleanText = text.replace(/\*/g, '');

            const response = await generateContentWithRetry(ai, {
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: cleanText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                        },
                    },
                },
            });

            // Check if this request is still valid
            if (requestId !== currentRequestIdRef.current) return;

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
                }
                const ctx = audioContextRef.current;
                
                // Decode
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1,
                );
                
                // Final check before starting playback
                if (requestId !== currentRequestIdRef.current) return;

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                currentSourceRef.current = source;

                source.onended = () => {
                    // Only clear if this was the source playing
                    if (currentSourceRef.current === source) {
                        setSpeakingText(null);
                        currentSourceRef.current = null;
                    }
                };

                source.start();
            }
        } catch (e) {
            console.error("Gemini TTS Error:", e);
            setSpeakingText(null);
        }
    };

    // Speech Function Wrapper
    const toggleSpeech = (text: string) => {
        if (speakingText === text) {
            stopAudio();
        } else {
            playGeminiTTS(text);
        }
    };

    // Initial Greeting Voice (Only in Ura Mode)
    useEffect(() => {
        if (!voiceEnabled || isSeriousMode || introPlayedRef.current) return;
        
        introPlayedRef.current = true;
        
        // Stop browser synthesis
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        const playIntro = async () => {
            await playGeminiTTS("懲罰委員会");
            
            // Use ref to track timeout for cleanup
            pendingTimeoutRef.current = setTimeout(() => {
                playGeminiTTS(messages[0].text);
                pendingTimeoutRef.current = null;
            }, 1500);
        };

        playIntro();
        
        return () => {
            if (pendingTimeoutRef.current) {
                clearTimeout(pendingTimeoutRef.current);
            }
        };
    }, [voiceEnabled, isSeriousMode]); 

    const handleSend = async () => {
        if (!input.trim() || loading || !personaConfig) return;

        const userText = input.trim();
        setInput("");
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: userText }]);

        try {
            const apiKey = getGeminiApiKey();
            if (!apiKey) throw new Error("APIキーが設定されていません。");

            const ai = new GoogleGenAI({ apiKey });
            
            const historyText = messages.map(m => `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${m.text}`).join("\n");
            
            // Prepare context data
            let simulationContext = "（シミュレーション未実行）";
            if (resultA && resultA.summary && resultA.summary.length > 0) {
                const summary = resultA.summary.map(r => ({
                    year: r.year,
                    totalCost: Math.round(r.totalCost / 1000) + "千円",
                    headcount: r.activeCount,
                    avgSalary: r.avgSalary.toLocaleString() + "円",
                    baseUp: r.baseUpImpact.perCapita.toLocaleString() + "円"
                }));
                simulationContext = JSON.stringify(summary.slice(0, 5));
            }

            let settingsContext = "（設定データなし）";
            if (configA) {
                 settingsContext = JSON.stringify({
                     retirementAge: configA.extendedRetirementAge,
                     reemploymentAge: configA.reemploymentAge,
                     extensionCutRate: configA.cutRate,
                     extensionFixedSalary: configA.employmentSettings["正社員(延長)"].fixedSalary,
                     calculationMethod: configA.employmentSettings["正社員(延長)"].calculationMethod
                 });
            }

            let financialContext = "（財務データなし）";
            if (financialData) {
                financialContext = financialData.filter(f => f.checked).map(f => {
                    const totalRevenue = f.revenue.shared + f.revenue.charter + f.revenue.contract + f.revenue.other;
                    return `年度:${f.year}, 営業収益計(売上):${totalRevenue.toLocaleString()}千円, 経常損益:${f.profit.ordinary.toLocaleString()}千円`;
                }).join("\n");
            }

            const prompt = `
                ${personaConfig.systemInstruction}

                【現在のシステム状況 (コンテキスト)】
                以下のデータを踏まえて回答してください。
                
                [制度設定 (A案)]
                ${settingsContext}

                [シミュレーション結果 (A案サマリー: 単位 千円)]
                ${simulationContext}

                [財務データ (※重要：入力値は「千円」単位です)]
                ${financialContext}
                ※例: 売上 3,035,000 とある場合、それは 30億3500万円 (3,035,000千円) です。
                ※ユーザーが「売上」と聞いたら、必ず「営業収益計」の合計値を回答してください。
                ※回答する際は、必ず「〇〇億円」「〇〇万円」のように、日本円の適切な単位に換算して話してください。

                【システム仕様書 (基本知識)】
                ${SYSTEM_SPECS}
                
                [会話履歴]
                ${historyText}
                
                [ユーザーの質問]
                ${userText}
                
                【重要：回答ルール】
                1. 回答は現在の半分の長さで、極めて簡潔にしてください。
                2. マークダウン記号（*, **）は出力しないでください。
                3. 文末や区切りには、読み上げが自然になるように読点（、）を適切に入れてください。
            `;

            const response = await generateContentWithFallback(ai, {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const rawReply = response.text || "申し訳ありません。エラーが発生しました。";
            const cleanReply = rawReply.replace(/\*/g, '');
            
            setMessages(prev => [...prev, { role: 'model', text: cleanReply }]);
            
            if (voiceEnabled && !isSeriousMode) {
                playGeminiTTS(cleanReply);
            }

        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `申し訳ありません。通信エラーが発生しました。\nError: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        if(window.confirm("会話履歴をクリアしますか？")) {
            setMessages([{ role: 'model', text: initialMsg }]);
            stopAudio();
        }
    };
    
    // UI Theme based on Mode
    const themeColor = isSeriousMode ? "blue" : "purple";
    const bgClass = isSeriousMode ? "bg-gray-100 text-gray-800" : "bg-slate-900 text-gray-200";
    const headerClass = isSeriousMode ? "bg-gray-200 border-gray-300 text-gray-800" : "bg-purple-900 border-purple-600 text-white";
    const bubbleUser = isSeriousMode ? "bg-blue-100 text-gray-800 border-blue-200" : "bg-slate-800 border-slate-600 text-slate-200";
    const bubbleModel = isSeriousMode ? "bg-white text-gray-800 border-gray-300" : "bg-purple-900/80 border-purple-600 text-purple-100";

    return (
        <div className={`flex flex-col h-[85vh] ${bgClass} font-mono rounded-lg shadow-2xl overflow-hidden border-2 ${isSeriousMode ? 'border-gray-300' : 'border-purple-700'}`}>
            {/* Header */}
            <div className={`p-4 flex justify-between items-center shadow-md z-10 shrink-0 border-b ${headerClass}`}>
                <div className="flex items-center gap-3">
                    <div className={`${isSeriousMode ? 'bg-white border-gray-300' : 'bg-slate-900 border-purple-400'} p-2 rounded-full border`}>
                        <TerminalIcon style={{ color: isSeriousMode ? '#4b5563' : '#c084fc' }} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl tracking-widest italic" style={!isSeriousMode ? { textShadow: '2px 2px 0px #000' } : {}}>
                            {isSeriousMode ? "SYSTEM GUIDE" : "AI CONSULTATION"}
                        </h2>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isSeriousMode ? 'text-gray-500' : 'text-purple-200'}`}>
                            {personaConfig.title}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Stop Button (Only relevant if voice enabled/used) */}
                    {!isSeriousMode && (
                        <button 
                            onClick={stopAudio}
                            disabled={!speakingText}
                            className={`text-white p-2 rounded transition-all flex items-center gap-1 ${speakingText ? 'bg-red-500 hover:bg-red-600 shadow-lg animate-pulse' : 'bg-purple-800 opacity-50 cursor-not-allowed'}`}
                            title="音声停止"
                        >
                            <PauseCircleIcon />
                            <span className="text-xs font-bold hidden md:inline">停止</span>
                        </button>
                    )}
                    {/* Clear Button */}
                    <button 
                        onClick={handleClear}
                        className={`${isSeriousMode ? 'text-gray-500 hover:bg-gray-300' : 'text-purple-300 hover:text-white hover:bg-purple-800'} p-2 rounded transition-colors`}
                        title="履歴消去"
                    >
                        <TrashIcon />
                    </button>
                    {onReturnToTitle && (
                        <button 
                            onClick={onReturnToTitle}
                            className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow-lg border border-red-500 ml-2"
                            title="タイトル画面へ戻る"
                        >
                            <span>🚪 終了</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${!isSeriousMode ? "bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] bg-opacity-80" : ""}`}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[98%] gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 shadow-lg ${
                                m.role === 'user' 
                                ? (isSeriousMode ? 'bg-gray-300 border-gray-400' : 'bg-slate-700 border-slate-500') 
                                : (isSeriousMode ? 'bg-blue-100 border-blue-300' : 'bg-purple-800 border-fuchsia-500')
                            }`}>
                                {m.role === 'user' ? <UserIcon /> : <span className="text-xl">{isSeriousMode ? '🤖' : '🌸'}</span>}
                            </div>

                            {/* Bubble */}
                            <div className={`rounded-xl p-4 shadow-md relative border flex flex-col ${
                                m.role === 'user' ? `${bubbleUser} rounded-tr-none` : `${bubbleModel} rounded-tl-none`
                            }`}>
                                <div className="whitespace-pre-wrap break-all leading-relaxed text-sm md:text-base">
                                    {m.text}
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    {m.role === 'model' && !isSeriousMode && (
                                        <button 
                                            onClick={() => toggleSpeech(m.text)}
                                            className={`p-1 rounded-full hover:bg-purple-700/50 transition-colors flex items-center gap-1 ${speakingText === m.text ? 'text-green-400 animate-pulse' : 'text-purple-300'}`}
                                            title={speakingText === m.text ? "停止" : "読み上げ (Zephyr)"}
                                        >
                                            {speakingText === m.text ? <PauseCircleIcon style={{width: 16, height: 16}}/> : <Volume2Icon style={{width: 16, height: 16}}/>}
                                        </button>
                                    )}
                                    <div className={`text-[9px] opacity-50 font-bold uppercase ml-auto`}>
                                        {m.role === 'user' ? (isSeriousMode ? 'User' : 'あんさん') : personaConfig.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start w-full animate-pulse">
                        <div className="flex gap-3 items-center">
                             <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${isSeriousMode ? 'bg-blue-100 border-blue-300' : 'bg-purple-800 border-fuchsia-500'}`}>
                                <span className="text-xl">{isSeriousMode ? '🤖' : '🤔'}</span>
                            </div>
                            <div className={`${isSeriousMode ? 'text-gray-500' : 'text-purple-400'} text-xs font-bold tracking-widest`}>
                                {isSeriousMode ? "AIが応答を生成中..." : "うちが調べてあげます..."}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`${isSeriousMode ? 'bg-gray-200 border-gray-300' : 'bg-slate-800 border-slate-700'} p-4 border-t shrink-0`}>
                <div className="flex gap-2 max-w-5xl mx-auto">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="使い方、制度の内容、シミュレーション結果……何でも質問してください。"
                        className={`flex-1 border rounded-lg px-4 py-3 focus:ring-2 focus:border-transparent transition-all resize-none min-h-[50px] max-h-32 text-sm custom-scrollbar ${
                            isSeriousMode 
                            ? 'bg-white border-gray-300 focus:ring-blue-400 text-gray-800 placeholder-gray-400' 
                            : 'bg-slate-900 border-slate-600 focus:ring-purple-500 text-gray-200 placeholder-gray-500'
                        }`}
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className={`rounded-lg w-16 flex items-center justify-center transition-all shrink-0 font-bold border-b-4 active:border-b-0 active:translate-y-1 ${
                            loading || !input.trim() 
                            ? `${isSeriousMode ? 'bg-gray-300 border-gray-400 text-gray-500' : 'bg-slate-700 border-slate-900 text-slate-500'} cursor-not-allowed` 
                            : `${isSeriousMode ? 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500' : 'bg-gradient-to-br from-purple-600 to-fuchsia-700 border-purple-900 text-white hover:brightness-110 shadow-lg shadow-fuchsia-900/50'}`
                        }`}
                        title="送信"
                    >
                        {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <SendIcon />}
                    </button>
                </div>
            </div>
            <style>
                {`.custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: ${isSeriousMode ? '#f3f4f6' : '#0f172a'}; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isSeriousMode ? '#d1d5db' : '#4b5563'}; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isSeriousMode ? '#9ca3af' : '#6b7280'}; }`}
            </style>
        </div>
    );
};
