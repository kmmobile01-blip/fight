
import React from 'react';
import { PersonaType, UnionPersonaType } from '../../types';
import { getPersonaConfig, PersonaStats } from '../../utils/aiConstants';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CloseIcon } from '../Icons';

interface PersonaCardProps {
    side: 'company' | 'union';
    index: number;
    personaId: string;
    teamSize: number;
    onRemove?: (index: number) => void;
    onChange?: (index: number) => void;
    compact?: boolean;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
    side, index, personaId, teamSize, onRemove, onChange, compact = false
}) => {
    const config = getPersonaConfig(personaId);
    const isCompany = side === 'company';
    const borderColor = isCompany ? 'border-blue-200' : 'border-red-200';
    const themeColor = isCompany ? '#2563eb' : '#dc2626';
    const bgColor = isCompany ? 'bg-blue-100' : 'bg-red-100';
    const textColor = isCompany ? 'text-blue-800' : 'text-red-800';

    const getRadarData = (stats: PersonaStats) => [
        { subject: '分析', A: stats.analysis, fullMark: 10 },
        { subject: '共感', A: stats.empathy, fullMark: 10 },
        { subject: '法務', A: stats.legal, fullMark: 10 },
        { subject: '説得', A: stats.persuasion, fullMark: 10 },
        { subject: 'リスク', A: stats.risk, fullMark: 10 },
        { subject: '柔軟', A: stats.flexibility, fullMark: 10 },
    ];

    return (
        <div className={`relative p-4 rounded-xl border-2 bg-white ${borderColor} hover:shadow-lg transition-all flex flex-col h-full`}>
            <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isCompany ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {index === 0 ? 'リーダー' : `メンバー ${index + 1}`}
                </span>
                {onRemove && teamSize > 1 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="メンバーを外す"
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>
            
            <div className={`flex flex-col items-center mb-4 ${onChange ? 'cursor-pointer' : ''}`} onClick={() => onChange?.(index)}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 ${bgColor}`}>
                    {isCompany ? '🕴️' : '🗣️'}
                </div>
                <div className="text-center">
                    <div className="font-bold text-gray-800 text-base leading-tight">{config.name}</div>
                    <div className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">{config.title}</div>
                </div>
            </div>

            <div className="h-32 w-full mb-3 opacity-90 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData(config.stats)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                        <Radar
                            name={config.name}
                            dataKey="A"
                            stroke={themeColor}
                            fill={themeColor}
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-gray-600 leading-tight flex-1 overflow-y-auto mb-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800 scrollbar-thin">
                <div className="font-bold mb-1 text-gray-400 uppercase tracking-wider text-[8px]">性格・交渉スタイル</div>
                <div className="whitespace-pre-wrap">
                    {config.systemInstruction.split('# Behavior Rules')[0].split('# Communication Style')[0].replace(/# .+/g, '').trim().slice(0, 150)}...
                </div>
            </div>
            
            {onChange && (
                <button 
                    onClick={() => onChange(index)}
                    className={`mt-auto w-full py-1.5 rounded-lg font-bold text-xs border transition-colors ${isCompany ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                >
                    メンバー変更
                </button>
            )}
        </div>
    );
};
