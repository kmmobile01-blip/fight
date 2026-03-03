
import React from 'react';
import { SearchIcon } from '../Icons';

export type NegotiatorRole = 'company' | 'union' | 'moderator';

export interface SourceData {
    title: string;
    uri: string;
}

export interface ChatMessageData {
    role: NegotiatorRole;
    personaId?: string;
    name?: string;
    text: string;
    round?: number;
    tactic?: string;
    sources?: SourceData[];
}

export const ChatMessage: React.FC<{ message: ChatMessageData }> = ({ message: m }) => {
    return (
        <div className={`flex w-full mb-4 ${m.role === 'company' ? 'justify-start' : m.role === 'union' ? 'justify-end' : 'justify-center'}`}>
            {m.role !== 'moderator' && (
                <div className={`
                    relative rounded-2xl p-3 md:p-5 shadow-sm border min-w-0
                    w-[95%] md:max-w-[85%]
                    ${
                    m.role === 'company' 
                    ? 'bg-blue-700 dark:bg-blue-800 text-white border-blue-600 dark:border-blue-700 rounded-tl-none mr-2 md:mr-auto' 
                    : 'bg-red-600 dark:bg-red-700 text-white border-red-600 dark:border-red-700 rounded-tr-none ml-2 md:ml-auto'
                }`}>
                    <div className="flex justify-between items-baseline mb-2 gap-2">
                        <div className={`text-xs font-bold ${m.role === 'company' ? 'text-blue-100' : 'text-red-100'}`}>
                            {m.name || "Unknown"} <span className="opacity-70 font-normal scale-90 inline-block">({m.role === 'company' ? '会社側' : '組合側'})</span>
                        </div>
                    </div>
                    
                    {/* Educational Tactic Badge */}
                    {m.tactic && (
                        <div className={`mb-3 inline-block text-xs font-bold px-2 py-1 rounded shadow-sm ${m.role === 'company' ? 'bg-white/20 border border-white/30 text-white' : 'bg-white/20 border border-white/30 text-white'}`}>
                            💡 戦術: {m.tactic}
                        </div>
                    )}

                    {/* Text Body: Matches Harassment View Style (break-all) */}
                    <div className="whitespace-pre-wrap break-all leading-relaxed text-sm md:text-base">
                        {m.text}
                    </div>

                    {/* Sources (Grounding) */}
                    {m.sources && m.sources.length > 0 && (
                        <div className={`mt-3 pt-2 border-t text-xs ${m.role === 'company' ? 'border-blue-500/30 text-blue-200' : 'border-red-500/30 text-red-200'}`}>
                            <div className="flex items-center gap-1 mb-1 font-bold">
                                <SearchIcon style={{width: 12, height: 12}} /> 参照情報:
                            </div>
                            <div className="space-y-1">
                                {m.sources.map((s, i) => (
                                    <a 
                                        key={i} 
                                        href={s.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={`block truncate hover:underline ${m.role === 'company' ? 'text-blue-100' : 'text-red-100'}`}
                                    >
                                        • {s.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Moderator Message */}
            {m.role === 'moderator' && (
                <div className={`
                    w-[95%] md:max-w-4xl px-4 py-3 md:px-6 md:py-4 rounded-xl font-bold shadow-sm my-2 text-center text-sm border mx-auto
                    ${
                    m.text.includes('コーチ') 
                    ? 'bg-gradient-to-r from-indigo-700 to-blue-600 text-white border-indigo-500' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                }`}>
                    <div className="whitespace-pre-wrap break-words">
                        {m.text}
                    </div>
                </div>
            )}
        </div>
    );
};
