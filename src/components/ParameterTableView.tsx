
import React, { useState, useEffect } from 'react';
import { PARAMETER_CATALOG, generateCurrentParamsJson } from '../utils/parameterDefinitions';
import { SimulationConfig, RaisePlanYear, RecruitmentPlanYear, ImpactRateYear } from '../types';
import { DatabaseIcon, ClipboardIcon, CheckIcon, SearchIcon, SettingsIcon } from './Icons';

interface ParameterTableViewProps {
    configA: SimulationConfig;
    configB: SimulationConfig;
    raisePlanA: Record<number, RaisePlanYear>;
    raisePlanB: Record<number, RaisePlanYear>;
    recruitmentPlanA: Record<number, RecruitmentPlanYear>;
    recruitmentPlanB: Record<number, RecruitmentPlanYear>;
    impactRatesA: Record<number, ImpactRateYear>;
    impactRatesB: Record<number, ImpactRateYear>;
    voiceEnabled: boolean;
    onReturnToTitle?: () => void;
}

export const ParameterTableView: React.FC<ParameterTableViewProps> = ({
    configA, configB, raisePlanA, raisePlanB, recruitmentPlanA, recruitmentPlanB, impactRatesA, impactRatesB, voiceEnabled, onReturnToTitle
}) => {
    const [filter, setFilter] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("労働協約");
        u.lang = 'ja-JP';
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

    const getValue = (path: string, planType: 'A' | 'B' | 'C') => {
        let config = configA;
        let raise = raisePlanA;
        let rec = recruitmentPlanA;
        let imp = impactRatesA;

        if (planType === 'B' || planType === 'C') {
            config = configB;
            raise = raisePlanB;
            rec = recruitmentPlanB;
            imp = impactRatesB;
        }

        let value: any = '-';

        try {
            if (path.startsWith('config.')) {
                const key = path.split('.')[1];
                value = (config as any)[key];
            }
            else if (path.startsWith('employmentSettings')) {
                const match = path.match(/employmentSettings\["(.+?)"\]\.(.+)/);
                if (match) {
                    const type = match[1];
                    const subPath = match[2];
                    let current = config.employmentSettings[type];
                    subPath.split('.').forEach(k => { current = (current as any)?.[k]; });
                    value = current;
                }
            }
            else if (path.includes('[year]')) {
                const root = path.split('[')[0];
                const sub = path.split('].')[1];
                
                const targetYear = 2026;

                if (root === 'raisePlan') {
                    if (planType === 'C') {
                        value = 0;
                    } else {
                        value = (raise[targetYear] as any)?.[sub];
                    }
                } else if (root === 'recruitmentPlan') {
                    value = (rec[targetYear] as any)?.[sub];
                } else {
                    value = (imp[targetYear] as any)?.[sub];
                }
            }
        } catch (e) {
            return 'Error';
        }

        return value;
    };

    const formatValue = (val: any) => {
        if (typeof val === 'boolean') return val ? 'あり' : 'なし';
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        if (typeof val === 'number') return val.toLocaleString();
        return val;
    };

    const filteredCatalog = PARAMETER_CATALOG.filter(p => 
        p.name.includes(filter) || p.path.includes(filter) || p.category.includes(filter)
    );

    const handleCopyJson = () => {
        const json = generateCurrentParamsJson(configA, raisePlanA, recruitmentPlanA, impactRatesA);
        navigator.clipboard.writeText(JSON.stringify(json, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl h-[85vh] flex flex-col transition-colors border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-900">
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <SettingsIcon /> 設定値比較・確認 (A/B/C)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        全シナリオのパラメータ設定値を一覧比較し、差異を検出します。
                    </p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input 
                            type="text" 
                            className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors font-bold"
                            placeholder="変数名・説明で検索..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <SearchIcon style={{ width: 14, height: 14 }} />
                        </div>
                    </div>
                    <button 
                        onClick={handleCopyJson}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow transition-all ${
                            copied ? 'bg-green-600 text-white' : 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
                        }`}
                    >
                        {copied ? <CheckIcon /> : <ClipboardIcon />}
                        {copied ? 'Copied!' : 'JSON出力'}
                    </button>
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

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-gray-100 dark:bg-gray-950">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0 z-10 shadow-md font-extrabold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-3 border-b border-gray-300 dark:border-gray-700 w-32">Category</th>
                            <th className="p-3 border-b border-gray-300 dark:border-gray-700">Parameter Name / Path</th>
                            <th className="p-3 border-b border-gray-300 dark:border-gray-700 w-32 text-center">Type</th>
                            <th className="p-3 border-b-4 border-red-500/50 dark:border-red-500 w-40 text-right bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100">
                                <div className="flex flex-col">
                                    <span>Plan A</span>
                                    <span className="text-[9px] opacity-70 font-normal">定年延長・改革案</span>
                                </div>
                            </th>
                            <th className="p-3 border-b-4 border-blue-500/50 dark:border-blue-500 w-40 text-right bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100">
                                <div className="flex flex-col">
                                    <span>Plan B</span>
                                    <span className="text-[9px] opacity-70 font-normal">現行制度・ベア有</span>
                                </div>
                            </th>
                            <th className="p-3 border-b-4 border-gray-500/50 dark:border-gray-500 w-40 text-right bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <div className="flex flex-col">
                                    <span>Plan C</span>
                                    <span className="text-[9px] opacity-70 font-normal">現状維持・凍結</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredCatalog.map((row, i) => {
                            const valA = getValue(row.path, 'A');
                            const valB = getValue(row.path, 'B');
                            const valC = getValue(row.path, 'C');

                            const isDiffAB = JSON.stringify(valA) !== JSON.stringify(valB);
                            const isDiffBC = JSON.stringify(valB) !== JSON.stringify(valC);

                            return (
                                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                    <td className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">{row.category}</td>
                                    <td className="p-3">
                                        <div className="font-bold text-gray-800 dark:text-gray-200">{row.name}</div>
                                        <div className="font-mono text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 break-all">{row.path}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{row.description}</div>
                                    </td>
                                    <td className="p-3 text-center text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900/50">{row.type}</td>
                                    
                                    {/* Plan A */}
                                    <td className="p-3 text-right font-mono font-bold text-red-700 dark:text-red-300 border-l border-gray-100 dark:border-gray-800">
                                        {formatValue(valA)}
                                    </td>

                                    {/* Plan B (Highlight if different from A) */}
                                    <td className={`p-3 text-right font-mono font-bold border-l border-gray-100 dark:border-gray-800 relative transition-colors duration-500
                                        ${isDiffAB 
                                            ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                                            : 'text-blue-700 dark:text-blue-300'
                                        }`}>
                                        {isDiffAB && <span className="absolute top-1 left-1 text-[8px] text-yellow-600 dark:text-yellow-400 font-bold px-1 rounded border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-black/50">DIFF</span>}
                                        {formatValue(valB)}
                                    </td>

                                    {/* Plan C (Highlight if different from B) */}
                                    <td className={`p-3 text-right font-mono font-bold border-l border-gray-100 dark:border-gray-800 relative transition-colors duration-500
                                        ${isDiffBC
                                            ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200' 
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {isDiffBC && <span className="absolute top-1 left-1 text-[8px] text-cyan-600 dark:text-cyan-400 font-bold px-1 rounded border border-cyan-200 dark:border-cyan-700 bg-white dark:bg-black/50">DIFF</span>}
                                        {formatValue(valC)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredCatalog.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 text-gray-400 dark:text-gray-600">
                        <DatabaseIcon style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.5 }} />
                        <p className="font-bold">該当するパラメータが見つかりません。</p>
                    </div>
                )}
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900 text-[10px] text-right text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 rounded"></span> A案との差異</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-100 dark:bg-cyan-900/50 border border-cyan-300 rounded"></span> B案との差異</div>
                </div>
                <span>※ [year] 表記の変数は、代表として2026年度の値を表示しています。Plan Cは自動算出（昇給ゼロ）の想定値です。</span>
            </div>
        </div>
    );
};
