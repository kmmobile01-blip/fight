
import React, { useEffect } from 'react';
import { ImpactRateYear } from '../types';

export const ImpactSettingsView: React.FC<{
    ratesA: Record<number, ImpactRateYear>;
    ratesB: Record<number, ImpactRateYear>;
    onChange: (pattern: 'A' | 'B', year: number, field: keyof ImpactRateYear, value: any) => void;
    voiceEnabled: boolean;
}> = ({ ratesA, ratesB, onChange, voiceEnabled }) => {
    const [activePattern, setActivePattern] = React.useState<'A' | 'B'>('A');
    const rates = activePattern === 'A' ? ratesA : ratesB;

    const toggleTarget = (year: number, target: string, currentTargets: string[]) => {
        const newTargets = currentTargets.includes(target)
            ? currentTargets.filter(t => t !== target)
            : [...currentTargets, target];
        onChange(activePattern, year, 'rippleTargets', newTargets);
    };

    const targetOptions = [
        { key: 'base', label: '基本給' },
        { key: 'family', label: '家族' },
        { key: 'child', label: '教育' },
        { key: 'instructor', label: '指導' },
        { key: 'manager', label: '管理' },
        { key: 'work', label: '業務' }
    ];

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance("始業見直し");
        u.lang = 'ja-JP';
        u.pitch = 1.0; 
        u.rate = 1.1; 
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
                 <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">諸元設定 (社会保険料率・変動手当ハネ率)</h3>
                <div className="flex gap-2">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-2 rounded font-bold transition-all ${activePattern === 'A' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-2 rounded font-bold transition-all ${activePattern === 'B' ? 'bg-gray-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>パターンB</button>
                </div>
            </div>

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                シミュレーションに使用する法定福利費の概算レートと、基本給上昇に伴う変動手当（残業単価等）への影響係数を設定します。
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 w-20">年度</th>
                            <th className="border dark:border-gray-600 p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-900 dark:text-pink-200 w-32">社会保険料率(概算) %</th>
                            <th className="border dark:border-gray-600 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 w-32">変動手当ハネ率 (係数)</th>
                            <th className="border dark:border-gray-600 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 text-left">ハネ率計算対象項目</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(rates).map(y => {
                            const year = parseInt(y);
                            const r = rates[year];
                            const targets = r.rippleTargets || ['base']; 

                            return (
                                <tr key={year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-600 p-2 text-center font-bold dark:text-gray-200">{year}</td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-pink-50/30 dark:bg-pink-900/10">
                                        <input type="number" step="0.1" className="w-20 text-right border dark:border-gray-500 rounded p-1 bg-white dark:bg-gray-700 dark:text-gray-100" value={r.socialInsuranceRate} onChange={e => onChange(activePattern, year, 'socialInsuranceRate', parseFloat(e.target.value))}/> %
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 text-center bg-indigo-50/30 dark:bg-indigo-900/10">
                                        <input type="number" step="0.01" className="w-20 text-right border dark:border-gray-500 rounded p-1 bg-white dark:bg-gray-700 dark:text-gray-100" value={r.rippleRate} onChange={e => onChange(activePattern, year, 'rippleRate', parseFloat(e.target.value))}/>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-indigo-50/10 dark:bg-indigo-900/5">
                                        <div className="flex flex-wrap gap-2">
                                            {targetOptions.map(opt => (
                                                <label key={opt.key} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-colors ${targets.includes(opt.key) ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={targets.includes(opt.key)}
                                                        onChange={() => toggleTarget(year, opt.key, targets)}
                                                        className="hidden"
                                                    />
                                                    {opt.label}
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                ※ 管理職、嘱託、再雇用(嘱託)は、ここでの設定に関わらずハネ率計算の対象外（ゼロ）となります。
            </div>
        </div>
    );
};
