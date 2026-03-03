
import React, { useEffect } from 'react';
import { SimulationConfig, Employee, ImpactRateYear } from '../types';

export const BonusSettingsView: React.FC<{
    configA: SimulationConfig;
    configB: SimulationConfig;
    onUpdate: (pattern: 'A' | 'B', type: string, field: string, subField: string | null, value: any) => void;
    voiceEnabled: boolean;
}> = ({ configA, configB, onUpdate, voiceEnabled }) => {
    const [activePattern, setActivePattern] = React.useState<'A' | 'B'>('A');
    const config = activePattern === 'A' ? configA : configB;
    const settings = config.employmentSettings;
    const types = ["正社員", "正社員(新卒)", "正社員(養成)", "正社員(延長)", "再雇用", "再雇用(嘱託)", "パート運転士(月給制)", "管理職"];

    // Use static classes to ensure Tailwind compiles them correctly
    const buttonClassA = activePattern === 'A' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    const buttonClassB = activePattern === 'B' ? 'bg-gray-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance("五ヶ月要求");
        u.lang = 'ja-JP';
        u.pitch = 1.0; 
        u.rate = 1.2;
        u.volume = 1.0;
        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;
        synth.speak(u);
    }, [voiceEnabled]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">賞与・住宅補助設定 ({activePattern === 'A' ? 'パターンA' : 'パターンB'})</h3>
                <div className="flex gap-2">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-2 rounded font-bold transition-all ${buttonClassA}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-2 rounded font-bold transition-all ${buttonClassB}`}>パターンB</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 sticky left-0 z-10 bg-gray-100 dark:bg-gray-700">雇用区分</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30">夏 (月数)</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30">冬 (月数)</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30">期末 (月数)</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/30">住宅補助 (世帯有)</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/30">単身</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map(type => {
                            const s = settings[type];
                            if(!s) return null;
                            return (
                                <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-600 p-2 font-bold sticky left-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">{type}</td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-blue-50/20 dark:bg-blue-900/10">
                                        <input type="number" step="0.05" className="w-20 text-right border dark:border-gray-500 rounded p-1 bg-white dark:bg-gray-700 dark:text-gray-100" value={s.bonusMonths?.summer || 0} onChange={e => onUpdate(activePattern, type, 'bonusMonths', 'summer', parseFloat(e.target.value)||0)}/>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-blue-50/20 dark:bg-blue-900/10">
                                        <input type="number" step="0.05" className="w-20 text-right border dark:border-gray-500 rounded p-1 bg-white dark:bg-gray-700 dark:text-gray-100" value={s.bonusMonths?.winter || 0} onChange={e => onUpdate(activePattern, type, 'bonusMonths', 'winter', parseFloat(e.target.value)||0)}/>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-blue-50/20 dark:bg-blue-900/10">
                                        <input type="number" step="0.05" className="w-20 text-right border dark:border-gray-500 rounded p-1 bg-white dark:bg-gray-700 dark:text-gray-100" value={s.bonusMonths?.end || 0} onChange={e => onUpdate(activePattern, type, 'bonusMonths', 'end', parseFloat(e.target.value)||0)}/>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-yellow-50/20 dark:bg-yellow-900/10">
                                        <div className="flex items-center justify-center gap-2">
                                            <input type="checkbox" checked={s.housingAid?.enabled || false} onChange={e => onUpdate(activePattern, type, 'housingAid', 'enabled', e.target.checked)}/>
                                            {s.housingAid?.enabled && (
                                                <input type="number" className="w-24 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.housingAid?.withFamily || 0} onChange={e => onUpdate(activePattern, type, 'housingAid', 'withFamily', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-yellow-50/20 dark:bg-yellow-900/10">
                                        {s.housingAid?.enabled && (
                                            <input type="number" className="w-24 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.housingAid?.noFamily || 0} onChange={e => onUpdate(activePattern, type, 'housingAid', 'noFamily', parseInt(e.target.value)||0)}/>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const LumpSumSettingsView: React.FC<{
    configA: SimulationConfig;
    configB: SimulationConfig;
    onUpdate: (pattern: 'A' | 'B', type: string, field: string, subField: string | null, value: any) => void;
    employees: Employee[];
    impactRatesA: Record<number, ImpactRateYear>;
    impactRatesB: Record<number, ImpactRateYear>;
    voiceEnabled: boolean;
}> = ({ configA, configB, onUpdate, employees, impactRatesA, impactRatesB, voiceEnabled }) => {
    const [activePattern, setActivePattern] = React.useState<'A' | 'B'>('A');
    const config = activePattern === 'A' ? configA : configB;
    const settings = config.employmentSettings;
    
    // Add "再雇用(嘱託)" to the list
    const types = ["正社員", "正社員(新卒)", "正社員(養成)", "正社員(延長)", "再雇用", "再雇用(嘱託)", "パート運転士(月給制)", "管理職"];
    const years = Array.from({ length: 11 }, (_, i) => 2025 + i);

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance("さらなる上積み");
        u.lang = 'ja-JP';
        // Updated to match VerificationView style
        u.pitch = 0.9; 
        u.rate = 1.1;
        u.volume = 1.0;
        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;
        synth.speak(u);
    }, [voiceEnabled]);

    const handleLumpSumChange = (type: string, year: number, value: number) => {
        const currentLumpSum: Record<number, number> = settings[type]?.lumpSum || {};
        const newLumpSum = { ...currentLumpSum, [year]: value };
        onUpdate(activePattern, type, 'lumpSum', null, newLumpSum);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 md:p-6 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b dark:border-gray-700 pb-2 gap-2">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">期末一時金設定 ({activePattern === 'A' ? 'パターンA' : 'パターンB'})</h3>
                <div className="flex gap-2 self-end md:self-auto">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-2 rounded font-bold transition-all text-sm md:text-base ${activePattern === 'A' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-2 rounded font-bold transition-all text-sm md:text-base ${activePattern === 'B' ? 'bg-gray-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>パターンB</button>
                </div>
            </div>

            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded text-sm text-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                <strong>春闘妥結用 一時金:</strong> ここで設定する金額は、毎年3月に支給される「期末一時金（臨時給）」として計算されます。<br/>
                賞与月数とは別に、定額で支給する場合に使用します。（例：組合員一律 50,000円など）
            </div>

            <div className="overflow-x-auto max-w-full pb-4">
                <table className="w-full text-sm border-collapse whitespace-nowrap">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 min-w-[140px] md:min-w-[200px] bg-gray-100 dark:bg-gray-700 sticky left-0 z-20 shadow-md md:shadow-none">雇用区分</th>
                            {years.map(year => (
                                <th key={year} className="border dark:border-gray-600 p-2 font-semibold min-w-[100px]">{year}年度</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {types.map(type => {
                            const s = settings[type];
                            if(!s) return null;
                            const isEnabled = s.lumpSumEnabled !== false;
                            
                            return (
                                <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className={`border dark:border-gray-600 p-2 font-bold sticky left-0 z-10 shadow-md md:shadow-none ${isEnabled ? 'bg-white dark:bg-gray-800 dark:text-gray-200' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <input 
                                                type="checkbox" 
                                                checked={isEnabled} 
                                                onChange={e => onUpdate(activePattern, type, 'lumpSumEnabled', null, e.target.checked)}
                                                title="この区分の支給を有効/無効にする"
                                                className="shrink-0"
                                            />
                                            <span className="truncate max-w-[120px] md:max-w-none">{type}</span>
                                        </div>
                                    </td>
                                    {years.map(year => (
                                        <td key={year} className={`border dark:border-gray-600 p-1 text-center ${!isEnabled ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                                            <input 
                                                type="number" 
                                                disabled={!isEnabled} 
                                                className="w-20 md:w-24 text-right border dark:border-gray-500 rounded p-1 font-medium bg-white dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-400 disabled:dark:text-gray-600 disabled:cursor-not-allowed text-sm" 
                                                value={s.lumpSum?.[year] || 0}
                                                onChange={e => handleLumpSumChange(type, year, parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
