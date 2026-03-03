import React, { useState } from 'react';
import { PersonaType, UnionPersonaType } from '../types';
import { getPersonaConfig, COMPANY_PERSONAS_ORDER, UNION_PERSONAS_ORDER, PersonaStats } from '../utils/aiConstants';
import { HandshakeIcon, UsersIcon, TrashIcon, IdCardIcon, PlusCircleIcon, CloseIcon, Icon } from './Icons';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AiSetupViewProps {
    employeeCount: number;
    onClearData: () => void;
    companyPersonas: PersonaType[];
    onUpdateCompanyPersonas: (p: PersonaType[]) => void;
    unionPersonas: UnionPersonaType[];
    onUpdateUnionPersonas: (p: UnionPersonaType[]) => void;
}

export const AiSetupView: React.FC<AiSetupViewProps> = ({
    employeeCount,
    onClearData,
    companyPersonas,
    onUpdateCompanyPersonas,
    unionPersonas,
    onUpdateUnionPersonas
}) => {
    // Only selectorModal state is needed now, previewTarget is integrated into cards or modal if needed
    const [selectorModal, setSelectorModal] = useState<{ isOpen: boolean, side: 'company' | 'union', index: number } | null>(null);

    const handleUpdateMember = (side: 'company'|'union', index: number, newId: string) => {
        if (side === 'company') {
            const newArr = [...companyPersonas];
            newArr[index] = newId as PersonaType;
            onUpdateCompanyPersonas(newArr);
        } else {
            const newArr = [...unionPersonas];
            newArr[index] = newId as UnionPersonaType;
            onUpdateUnionPersonas(newArr);
        }
        setSelectorModal(null); // Close modal after selection
    };

    const handleAddMember = (side: 'company'|'union') => {
        if (side === 'company') {
            if (companyPersonas.length < 3) {
                onUpdateCompanyPersonas([...companyPersonas, 'normal']);
            }
        } else {
            if (unionPersonas.length < 3) {
                onUpdateUnionPersonas([...unionPersonas, 'wakui']);
            }
        }
    };

    const handleRemoveMember = (side: 'company'|'union', index: number) => {
        if (side === 'company') {
            if (companyPersonas.length > 1) {
                const newArr = companyPersonas.filter((_, i) => i !== index);
                onUpdateCompanyPersonas(newArr);
            }
        } else {
            if (unionPersonas.length > 1) {
                const newArr = unionPersonas.filter((_, i) => i !== index);
                onUpdateUnionPersonas(newArr);
            }
        }
    };

    const getRadarData = (stats: PersonaStats) => [
        { subject: '分析', A: stats.analysis, fullMark: 10 },
        { subject: '共感', A: stats.empathy, fullMark: 10 },
        { subject: '法務', A: stats.legal, fullMark: 10 },
        { subject: '説得', A: stats.persuasion, fullMark: 10 },
        { subject: 'リスク', A: stats.risk, fullMark: 10 },
        { subject: '柔軟', A: stats.flexibility, fullMark: 10 },
    ];

    const renderCharacterCard = (side: 'company' | 'union', index: number, currentId: string) => {
        const config = getPersonaConfig(currentId);
        const colorClass = side === 'company' ? 'blue' : 'red';
        const borderColor = side === 'company' ? 'border-blue-200' : 'border-red-200';
        const teamSize = side === 'company' ? companyPersonas.length : unionPersonas.length;

        return (
            <div key={index} className={`relative p-4 rounded-xl border-2 bg-white ${borderColor} hover:shadow-lg transition-all`}>
                <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${side === 'company' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {index === 0 ? 'リーダー' : `メンバー ${index + 1}`}
                    </span>
                    {teamSize > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(side, index); }}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="メンバーを外す"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col items-center mb-4 cursor-pointer" onClick={() => setSelectorModal({ isOpen: true, side, index })}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 ${side === 'company' ? 'bg-blue-100' : 'bg-red-100'}`}>
                        {side === 'company' ? '🕴️' : '🗣️'}
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-gray-800 text-lg">{config.name}</div>
                        <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">{config.title}</div>
                    </div>
                </div>

                <div className="h-32 w-full mb-3 opacity-80 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData(config.stats)}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                                <Radar
                                    name={config.name}
                                    dataKey="A"
                                    stroke={side === 'company' ? '#2563eb' : '#dc2626'}
                                    fill={side === 'company' ? '#2563eb' : '#dc2626'}
                                    fillOpacity={0.4}
                                />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-gray-500 leading-tight h-10 overflow-hidden line-clamp-2 text-center px-2">
                    {config.systemInstruction.slice(0, 80)}...
                </div>
                
                <button 
                    onClick={() => setSelectorModal({ isOpen: true, side, index })}
                    className={`mt-3 w-full py-2 rounded-lg font-bold text-sm border transition-colors ${side === 'company' ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                >
                    メンバー変更
                </button>
            </div>
        );
    };

    // Helper to render the selection modal
    const renderSelectorModal = () => {
        if (!selectorModal || !selectorModal.isOpen) return null;
        
        const isCompany = selectorModal.side === 'company';
        const list = isCompany ? COMPANY_PERSONAS_ORDER : UNION_PERSONAS_ORDER;
        const currentId = isCompany 
            ? companyPersonas[selectorModal.index] 
            : unionPersonas[selectorModal.index];

        return (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in" onClick={() => setSelectorModal(null)}>
                <div 
                    className={`bg-white w-full md:max-w-4xl md:rounded-xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`} 
                    onClick={e => e.stopPropagation()}
                >
                    <div className={`p-4 border-b flex justify-between items-center ${isCompany ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                        <h3 className={`font-bold text-lg ${isCompany ? 'text-blue-800' : 'text-red-800'}`}>
                            {isCompany ? '会社側' : '組合側'}メンバーを選択
                        </h3>
                        <button onClick={() => setSelectorModal(null)} className="p-2 text-gray-500 hover:bg-black/5 rounded-full">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {list.map((personaId) => {
                                const conf = getPersonaConfig(personaId);
                                const isActive = currentId === personaId;
                                return (
                                    <button
                                        key={personaId}
                                        onClick={() => handleUpdateMember(selectorModal.side, selectorModal.index, personaId)}
                                        className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                                            isActive 
                                            ? (isCompany ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-red-500 bg-white ring-2 ring-red-200') 
                                            : 'border-transparent bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2 w-full">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${isCompany ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                {isCompany ? '🕴️' : '🗣️'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-base truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{conf.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{conf.title}</div>
                                            </div>
                                            {isActive && (
                                                <div className={`text-xl ${isCompany ? 'text-blue-600' : 'text-red-600'}`}>
                                                    <Icon path="M5 13l4 4L19 7" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-2 w-full">
                                            {conf.systemInstruction}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[85vh] gap-6 relative">
            {/* Modal */}
            {renderSelectorModal()}

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <UsersIcon /> AIチーム編成 (Negotiation Setup)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">AI団体交渉モードで登場する、会社側・組合側双方の交渉メンバーを選抜します（各1〜3名）。</p>
                </div>
                {employeeCount > 0 && (
                    <button onClick={onClearData} className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg border border-red-200 transition-colors flex items-center gap-2">
                        <TrashIcon /> 全データをクリア
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto bg-gray-50 p-6 rounded-xl border border-gray-200">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Company Side */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b-4 border-blue-500 pb-2 mb-4 bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-black text-xl text-blue-800 flex items-center gap-2">
                                <HandshakeIcon /> 経営陣メンバー
                            </h3>
                            <span className="text-sm bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">{companyPersonas.length} / 3名</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {companyPersonas.map((id, idx) => renderCharacterCard('company', idx, id))}
                            
                            {companyPersonas.length < 3 && (
                                <button 
                                    onClick={() => handleAddMember('company')}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-xl text-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all min-h-[250px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                        <PlusCircleIcon />
                                    </div>
                                    <span className="font-bold">メンバーを追加</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Union Side */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b-4 border-red-500 pb-2 mb-4 bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-black text-xl text-red-800 flex items-center gap-2">
                                <UsersIcon /> 組合執行部メンバー
                            </h3>
                            <span className="text-sm bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full">{unionPersonas.length} / 3名</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {unionPersonas.map((id, idx) => renderCharacterCard('union', idx, id))}

                            {unionPersonas.length < 3 && (
                                <button 
                                    onClick={() => handleAddMember('union')}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-500 transition-all min-h-[250px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                                        <PlusCircleIcon />
                                    </div>
                                    <span className="font-bold">メンバーを追加</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};