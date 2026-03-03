
import React, { useState } from 'react';
import { PersonaType, UnionPersonaType } from '../../types';
import { getPersonaConfig, COMPANY_PERSONAS_ORDER, UNION_PERSONAS_ORDER } from '../../utils/aiConstants';
import { CloseIcon, PlusCircleIcon, PlayCircleIcon, HandshakeIcon, UsersIcon, Icon } from '../Icons';
import { PersonaCard } from './PersonaCard';

interface PersonaSelectorProps {
    companyPersonas: PersonaType[];
    onUpdateCompanyPersonas: (p: PersonaType[]) => void;
    unionPersonas: UnionPersonaType[];
    onUpdateUnionPersonas: (p: UnionPersonaType[]) => void;
    onStart: () => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
    companyPersonas, onUpdateCompanyPersonas, unionPersonas, onUpdateUnionPersonas, onStart
}) => {
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
        setSelectorModal(null);
    };

    const handleAddMember = (side: 'company'|'union') => {
        if (side === 'company' && companyPersonas.length < 3) {
            onUpdateCompanyPersonas([...companyPersonas, 'normal']);
        } else if (side === 'union' && unionPersonas.length < 3) {
            onUpdateUnionPersonas([...unionPersonas, 'wakui']);
        }
    };

    const handleRemoveMember = (side: 'company'|'union', index: number) => {
        if (side === 'company' && companyPersonas.length > 1) {
            onUpdateCompanyPersonas(companyPersonas.filter((_, i) => i !== index));
        } else if (side === 'union' && unionPersonas.length > 1) {
            onUpdateUnionPersonas(unionPersonas.filter((_, i) => i !== index));
        }
    };

    const renderSelectorModal = () => {
        if (!selectorModal || !selectorModal.isOpen) return null;
        const isCompany = selectorModal.side === 'company';
        const list = isCompany ? COMPANY_PERSONAS_ORDER : UNION_PERSONAS_ORDER;
        const currentId = isCompany ? companyPersonas[selectorModal.index] : unionPersonas[selectorModal.index];

        return (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in" onClick={() => setSelectorModal(null)}>
                <div className="bg-white w-full md:max-w-4xl md:rounded-xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
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
                                                <div className="text-[10px] text-gray-500 truncate">{conf.title}</div>
                                            </div>
                                            {isActive && (
                                                <div className={`text-xl ${isCompany ? 'text-blue-600' : 'text-red-600'}`}>
                                                    <Icon path="M5 13l4 4L19 7" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-3 w-full leading-tight italic">
                                            {conf.systemInstruction.split('\n')[0]}
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
        <div className="flex flex-col h-full overflow-y-auto scrollbar-thin bg-gray-100 dark:bg-gray-900">
            {renderSelectorModal()}
            
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <UsersIcon /> 団体交渉メンバー編成
                    </h2>
                    <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 mt-1">
                        交渉に臨むメンバーを選抜してください。リーダー（1人目）は交渉の主導権を握ります。
                    </p>
                </div>
                <button 
                    onClick={onStart}
                    className="w-full md:w-auto px-6 md:px-10 py-3 md:py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-base md:text-lg"
                >
                    <PlayCircleIcon /> 交渉開始
                </button>
            </div>

            <div className="p-4 md:p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Company Side */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b-4 border-blue-500 pb-2 mb-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <h3 className="font-black text-xl text-blue-800 dark:text-blue-400 flex items-center gap-2">
                            <HandshakeIcon /> 経営陣メンバー
                        </h3>
                        <span className="text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold px-3 py-1 rounded-full">{companyPersonas.length} / 3名</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {companyPersonas.map((id, idx) => (
                            <PersonaCard 
                                key={idx} 
                                side="company" 
                                index={idx} 
                                personaId={id} 
                                teamSize={companyPersonas.length}
                                onRemove={(i) => handleRemoveMember('company', i)}
                                onChange={(i) => setSelectorModal({ isOpen: true, side: 'company', index: i })}
                            />
                        ))}
                        {companyPersonas.length < 3 && (
                            <button 
                                onClick={() => handleAddMember('company')}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-xl text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all min-h-[250px]"
                            >
                                <PlusCircleIcon className="w-10 h-10 mb-2" />
                                <span className="font-bold">メンバー追加</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Union Side */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b-4 border-red-500 pb-2 mb-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <h3 className="font-black text-xl text-red-800 dark:text-red-400 flex items-center gap-2">
                            <UsersIcon /> 組合執行部メンバー
                        </h3>
                        <span className="text-sm bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-bold px-3 py-1 rounded-full">{unionPersonas.length} / 3名</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {unionPersonas.map((id, idx) => (
                            <PersonaCard 
                                key={idx} 
                                side="union" 
                                index={idx} 
                                personaId={id} 
                                teamSize={unionPersonas.length}
                                onRemove={(i) => handleRemoveMember('union', i)}
                                onChange={(i) => setSelectorModal({ isOpen: true, side: 'union', index: i })}
                            />
                        ))}
                        {unionPersonas.length < 3 && (
                            <button 
                                onClick={() => handleAddMember('union')}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all min-h-[250px]"
                            >
                                <PlusCircleIcon className="w-10 h-10 mb-2" />
                                <span className="font-bold">メンバー追加</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};
