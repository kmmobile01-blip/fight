
import React from 'react';
import { HandshakeIcon } from '../Icons';
import { PersonaType, UnionPersonaType } from '../../types';
import { getPersonaConfig, COMPANY_PERSONAS_ORDER, UNION_PERSONAS_ORDER } from '../../utils/aiConstants';

interface NegotiationTeamPanelProps {
    employeeCount: number;
    companyPersonas: PersonaType[];
    onUpdateCompanyPersonas: (p: PersonaType[]) => void;
    unionPersonas: UnionPersonaType[];
    onUpdateUnionPersonas: (p: UnionPersonaType[]) => void;
    
    // Legacy prop
    onClearData?: any; 
}

export const NegotiationTeamPanel: React.FC<NegotiationTeamPanelProps> = ({
    companyPersonas,
    onUpdateCompanyPersonas,
    unionPersonas,
    onUpdateUnionPersonas
}) => {
    const handlePersonaChange = (side: 'company'|'union', index: number, newId: string) => {
        if (side === 'company') {
            const newArr = [...companyPersonas];
            newArr[index] = newId as PersonaType;
            onUpdateCompanyPersonas(newArr);
        } else {
            const newArr = [...unionPersonas];
            newArr[index] = newId as UnionPersonaType;
            onUpdateUnionPersonas(newArr);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <HandshakeIcon /> AI団体交渉チーム編成
                </h3>
            </div>

            <div className="space-y-6">
                {/* Company Side */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-900">
                    <div className="text-xs font-bold text-red-800 dark:text-red-300 uppercase mb-2 tracking-wider">Company Side (経営側)</div>
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <select 
                                key={i}
                                value={companyPersonas[i] || 'normal'} 
                                onChange={(e) => handlePersonaChange('company', i, e.target.value)}
                                className="w-full text-base h-12 border-red-200 dark:border-red-800 rounded-lg p-3 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 dark:text-white shadow-sm"
                            >
                                {COMPANY_PERSONAS_ORDER.map(p => (
                                    <option key={p} value={p}>{getPersonaConfig(p).name}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                </div>

                {/* Union Side */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                    <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2 tracking-wider">Union Side (組合側)</div>
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <select 
                                key={i}
                                value={unionPersonas[i] || 'kiyomi'} 
                                onChange={(e) => handlePersonaChange('union', i, e.target.value)}
                                className="w-full text-base h-12 border-blue-200 dark:border-blue-800 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white shadow-sm"
                            >
                                {UNION_PERSONAS_ORDER.map(p => (
                                    <option key={p} value={p}>{getPersonaConfig(p).name}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                ※ ここで選抜したメンバーが、AI団体交渉モードで登場します。キャラクターの性格（強硬派・理論派など）によって交渉難易度が変化します。
            </div>
        </div>
    );
};
