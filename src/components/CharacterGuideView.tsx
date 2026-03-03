import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { getPersonaConfig, COMPANY_PERSONAS_ORDER, UNION_PERSONAS_ORDER, CAPABILITY_DEFINITIONS } from '../utils/aiConstants';
import { IdCardIcon, HandshakeIcon, CommitteeIcon } from './Icons';

export const CharacterGuideView = ({ onReturnToTitle }: { onReturnToTitle?: () => void }) => {
    const [activeTab, setActiveTab] = useState<'company' | 'union'>('company');

    const personas = activeTab === 'company' ? COMPANY_PERSONAS_ORDER : UNION_PERSONAS_ORDER;
    const themeColor = activeTab === 'company' ? 'red' : 'blue';
    const bgColor = activeTab === 'company' ? 'bg-red-50' : 'bg-blue-50';
    const borderColor = activeTab === 'company' ? 'border-red-200' : 'border-blue-200';
    const textColor = activeTab === 'company' ? 'text-red-800' : 'text-blue-800';

    const extractSection = (text: string, sectionName: string) => {
        const match = text.match(new RegExp(`# ${sectionName}\\n([\\s\\S]*?)(?=\\n#|$)`));
        return match ? match[1].trim() : "";
    };

    return (
        <div className="bg-white rounded-lg shadow min-h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <IdCardIcon /> AIキャラ名鑑 (ネゴシエーター・ファイル)
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('company')}
                            className={`px-6 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
                                activeTab === 'company' 
                                ? 'bg-red-600 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-300'
                            }`}
                        >
                            <HandshakeIcon /> 会社側 (経営陣)
                        </button>
                        <button 
                            onClick={() => setActiveTab('union')}
                            className={`px-6 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
                                activeTab === 'union' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-300'
                            }`}
                        >
                            <CommitteeIcon /> 組合側 (労働者)
                        </button>
                    </div>
                    {onReturnToTitle && (
                        <button 
                            onClick={onReturnToTitle}
                            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-bold transition-all text-sm flex items-center gap-1"
                        >
                            <span>🚪 終了</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content - Removed overflow-y-auto to let page scroll */}
            <div className={`flex-1 p-6 ${bgColor}`}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {personas.map(personaId => {
                        const config = getPersonaConfig(personaId);
                        // FIX: Add null check for config
                        if (!config) return null;
                        const stats = config.stats;
                        const personality = extractSection(config.systemInstruction, "Personality");
                        const style = extractSection(config.systemInstruction, "Communication Style");
                        const rules = extractSection(config.systemInstruction, "Behavior Rules");

                        const chartData = [
                            { subject: '分析力', A: stats.analysis, fullMark: 10 },
                            { subject: 'シナリオ', A: stats.scenario, fullMark: 10 },
                            { subject: '共感力', A: stats.empathy, fullMark: 10 },
                            { subject: '法的知識', A: stats.legal, fullMark: 10 },
                            { subject: '感情制御', A: stats.control, fullMark: 10 },
                            { subject: '説得力', A: stats.persuasion, fullMark: 10 },
                            { subject: '柔軟性', A: stats.flexibility, fullMark: 10 },
                            { subject: 'リスク管理', A: stats.risk, fullMark: 10 },
                            { subject: '信頼性', A: stats.trust, fullMark: 10 },
                            { subject: 'ビジョン', A: stats.vision, fullMark: 10 },
                        ];

                        return (
                            <div key={personaId} className={`bg-white rounded-xl shadow-lg border-2 ${borderColor} overflow-hidden flex flex-col md:flex-row`}>
                                {/* Left: Profile & Chart */}
                                <div className="w-full md:w-1/3 p-4 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner ${activeTab === 'company' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                        {activeTab === 'company' ? '🕴️' : '🗣️'}
                                    </div>
                                    <h3 className={`text-xl font-black ${textColor} text-center leading-tight mb-1`}>{config.name}</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4 px-2 py-1 bg-gray-200 rounded">{config.title}</p>
                                    
                                    <div className="w-full h-48 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                                <PolarGrid gridType="polygon" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#666' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                                <Radar
                                                    name={config.name}
                                                    dataKey="A"
                                                    stroke={activeTab === 'company' ? '#dc2626' : '#2563eb'}
                                                    fill={activeTab === 'company' ? '#dc2626' : '#2563eb'}
                                                    fillOpacity={0.4}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right: Details */}
                                <div className="w-full md:w-2/3 p-5 text-sm leading-relaxed text-gray-700 flex flex-col">
                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-gray-400 pl-2 mb-2 text-xs uppercase">Personality (性格)</h4>
                                        <div className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border border-gray-100 max-h-32 overflow-y-auto custom-scrollbar">
                                            {personality}
                                        </div>
                                    </div>
                                    <div className="mb-4 flex-1">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-gray-400 pl-2 mb-2 text-xs uppercase">Style & Behavior (交渉スタイル)</h4>
                                        <div className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border border-gray-100 max-h-32 overflow-y-auto custom-scrollbar">
                                            {style}
                                            <div className="my-2 border-t border-dashed border-gray-300"></div>
                                            {rules}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Capability Definitions Legend */}
                <div className="mt-8 bg-white rounded-xl shadow p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                        📊 能力値（パラメータ）の定義
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                        {Object.values(CAPABILITY_DEFINITIONS).map((d, i) => {
                            const desc = d as string;
                            return (
                                <div key={i} className="flex gap-2 items-start p-2 hover:bg-gray-50 rounded transition-colors">
                                    <span className="font-black text-gray-400 select-none">#{i+1}</span>
                                    <span className="font-medium">{desc.substring(desc.indexOf(' ') + 1)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
            `}</style>
        </div>
    );
};
