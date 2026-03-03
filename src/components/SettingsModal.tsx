import React, { useState, useEffect } from 'react';
import { SimulationConfig } from '../types';
import { CloseIcon } from './Icons';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: SimulationConfig;
    onSave: (settings: any) => void;
    title: string;
}

export const SettingsModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config, onSave, title }) => {
    const [localConfig, setLocalConfig] = useState<SimulationConfig | null>(null);
    const [activeType, setActiveType] = useState('管理職');

    useEffect(() => { if (isOpen && config) { setLocalConfig(JSON.parse(JSON.stringify(config))); } }, [isOpen, config]);

    if (!isOpen || !localConfig) return null;

    const handleSettingChange = (type: string, field: string, subField: string | null, value: any) => {
        setLocalConfig(prev => {
            if (!prev) return null;
            const newSettings = { ...prev.employmentSettings };
            if (subField) { (newSettings[type] as any)[field][subField] = value; } 
            else { (newSettings[type] as any)[field] = value; }
            return { ...prev, employmentSettings: newSettings };
        });
    };
    
    const empTypes = ['管理職'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold">{title} - 特殊設定</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                
                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-4 rounded border">
                    <p className="mb-2">※ 賞与、一時金、住宅補助、手当支給対象の設定は、メイン画面の各タブへ移動しました。ここでは、パターン固有の特殊な計算ロジックのみを設定します。</p>
                    <p className="font-bold text-red-600">
                        【シミュレーション前提】<br/>
                        定年到達後、一般社員は「再雇用」、管理職は「再雇用(嘱託)」へ移行し、再雇用上限到達後は全員「パート運転士」へ移行する前提で試算されます。
                    </p>
                </div>

                <div className="flex mb-4 border-b overflow-x-auto gap-2">
                    {empTypes.map(type => (
                        <button 
                            key={type} 
                            onClick={() => setActiveType(type)} 
                            className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors font-bold ${
                                activeType === type 
                                ? 'bg-blue-600 text-white border-b-2 border-blue-600' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {type} 設定
                        </button>
                    ))}
                </div>
                
                <div className="space-y-6 bg-blue-50/30 p-6 rounded-lg border border-blue-100">
                    {activeType === '管理職' && (
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2 border-l-4 border-red-500 pl-2 text-lg">定年後 嘱託移行時の給与設定</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                管理職が定年(60歳/65歳)を迎えて「再雇用(嘱託)」身分へ移行する際、現役時代の基本給に対して適用する支給率を設定します。
                            </p>
                            <div className="flex justify-between items-center bg-white p-6 rounded-lg border shadow-sm">
                                <label className="font-bold text-gray-700">嘱託移行時の支給率 (カット率)</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min="30" max="100" className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                                        value={Math.round((localConfig.employmentSettings['管理職'].cutRate || 1.0) * 100)} 
                                        onChange={e => handleSettingChange('管理職', 'cutRate', null, Number(e.target.value) / 100)}
                                    />
                                    <div className="font-black text-2xl text-blue-600 w-20 text-right">
                                        {Math.round((localConfig.employmentSettings['管理職'].cutRate || 1.0) * 100)}<span className="text-sm text-gray-500">%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                                <strong>計算例:</strong> 現役時基本給 400,000円 × 70% ＝ 嘱託時基本給 280,000円
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-bold">キャンセル</button>
                    <button onClick={() => onSave(localConfig.employmentSettings)} className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transform hover:-translate-y-0.5 transition-all">保存して適用</button>
                </div>
            </div>
        </div>
    );
};