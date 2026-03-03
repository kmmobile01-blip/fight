

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getPersonaConfig } from '../utils/aiConstants';
import { SYSTEM_SPECS } from '../utils/systemSpecs';
import { TerminalIcon, SendIcon, UserIcon, TrashIcon } from './Icons';
import { generateContentWithFallback, getGeminiApiKey } from '../utils/geminiHelper';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const ChunLiChatView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'model', 
            text: "ニーハオ！私が春麗よ。\nこのシステムの仕様でわからないことがあったら、なんでも聞いてね！\n百裂脚みたいに、速く正確に答えてみせるわ！" 
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chunliConfig = getPersonaConfig('chunli');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading || !chunliConfig) return;

        const userText = input.trim();
        setInput("");
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: userText }]);

        try {
            const apiKey = getGeminiApiKey();
            if (!apiKey) throw new Error("APIキーがセットされていないみたい。設定を確認して！");

            const ai = new GoogleGenAI({ apiKey });
            
            const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Chun-Li'}: ${m.text}`).join("\n");
            
            const prompt = `
                ${chunliConfig.systemInstruction}

                【システム仕様書】
                以下の情報を元に、ユーザーの質問に答えてください。
                ${SYSTEM_SPECS}
                
                [History]
                ${historyText}
                
                [User Input]
                ${userText}
            `;

            const response = await generateContentWithFallback(ai, {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const reply = response.text || "ごめんなさい、ちょっと考えがまとまらないわ。（エラー発生）";
            
            setMessages(prev => [...prev, { role: 'model', text: reply }]);

        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `やだっ、通信エラーよ！\nError: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        if(window.confirm("本当に履歴をクリアする？ スピニングバードキック！")) {
            setMessages([{ role: 'model', text: "はい、スッキリしたわね！ さあ、新たな気持ちで始めましょう！" }]);
        }
    };

    return (
        <div className="flex flex-col h-[85vh] bg-slate-900 text-gray-200 font-mono rounded-lg shadow-2xl overflow-hidden border-2 border-blue-700">
            {/* Header */}
            <div className="bg-blue-800 p-4 flex justify-between items-center shadow-md z-10 shrink-0 border-b border-blue-600">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2 rounded-full border border-blue-400">
                        <TerminalIcon style={{ color: '#60a5fa' }} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl text-white tracking-widest italic" style={{ textShadow: '2px 2px 0px #000' }}>
                            DEV. SPINNING BIRD KICK
                        </h2>
                        <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                            Chun-Li's Technical Dojo
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleClear}
                    className="text-blue-300 hover:text-white hover:bg-blue-700 p-2 rounded transition-colors"
                    title="履歴消去"
                >
                    <TrashIcon />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-900 bg-opacity-80 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
                {messages.map((m, i) => (
                    <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[98%] gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 shadow-lg ${
                                m.role === 'user' 
                                ? 'bg-slate-700 border-slate-500' 
                                : 'bg-blue-700 border-yellow-400'
                            }`}>
                                {m.role === 'user' ? <UserIcon /> : <span className="text-xl">🥋</span>}
                            </div>

                            {/* Bubble */}
                            <div className={`rounded-xl p-4 shadow-md relative border ${
                                m.role === 'user'
                                ? 'bg-slate-800 border-slate-600 text-slate-200 rounded-tr-none'
                                : 'bg-blue-900/80 border-blue-500 text-blue-50 rounded-tl-none'
                            }`}>
                                <div className="whitespace-pre-wrap break-all leading-relaxed text-sm md:text-base">
                                    {m.text}
                                </div>
                                <div className={`text-[9px] mt-2 opacity-50 font-bold uppercase text-right`}>
                                    {m.role === 'user' ? 'YOU' : 'CHUN-LI'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start w-full animate-pulse">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-yellow-400 flex items-center justify-center">
                                <span className="text-xl">🤔</span>
                            </div>
                            <div className="text-blue-300 text-xs font-bold tracking-widest">
                                気功拳を練っているわ...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-slate-800 p-4 border-t border-slate-700 shrink-0">
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
                        placeholder="システムの仕様について、質問は？"
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500 transition-all resize-none min-h-[50px] max-h-32 text-sm custom-scrollbar"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className={`rounded-lg w-16 flex items-center justify-center transition-all shrink-0 font-bold border-b-4 active:border-b-0 active:translate-y-1 ${
                            loading || !input.trim() 
                            ? 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed' 
                            : 'bg-gradient-to-br from-blue-600 to-cyan-700 border-blue-900 text-white hover:brightness-110 shadow-lg shadow-cyan-900/50'
                        }`}
                        title="送信"
                    >
                        {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <SendIcon />}
                    </button>
                </div>
            </div>
            {/* FIX: Add template literal braces around style content */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
            `}</style>
        </div>
    );
};
