
import React, { useEffect } from 'react';
import { RaisePlanYear, Employee, SimulationConfig } from '../types';
import { getSalarySystem, DateUtils } from '../utils/simulationLogic';
import { HandshakeIcon } from './Icons';

const determineStatusForCount = (emp: Employee, year: number, config: SimulationConfig) => {
    const date = new Date(year, 3, 1);
    
    // Check for Management -> Shokutaku first
    if (emp.employmentType.includes('嘱託')) return '嘱託';
    
    // Original Management
    if (emp.employmentType.includes('管理職')) {
        const age = DateUtils.getAge(emp.birthDate, date);
        const retirementAge = config.extendedRetirementAge || 60;
        // Management retires and becomes Shokutaku
        if (age >= retirementAge) return '再雇用(嘱託)'; 
        return '管理職';
    }
    
    // Regular Employee Logic
    const age = DateUtils.getAge(emp.birthDate, date);
    const retirementAge = config.extendedRetirementAge || 60;
    
    // Standard Retirement Transition
    if (age >= retirementAge) {
        return '再雇用'; 
    }

    // Check for Extension (Between 60 and RetirementAge)
    if (retirementAge > 60 && age >= 60) {
        return '延長';
    }
    
    const tenure = DateUtils.getTenure(emp.hireDate, date);
    
    if (emp.employmentType.includes('パート')) return 'パート';

    if (tenure < 1) {
        if (emp.employmentType.includes('養成')) return '養成';
        return '新卒';
    }
    return '正社員';
};

export const RaisePlanView: React.FC<{ 
    planA: Record<number, RaisePlanYear>; 
    planB: Record<number, RaisePlanYear>; 
    configA: SimulationConfig;
    configB: SimulationConfig;
    onChange: (pattern: 'A' | 'B', year: number, field: string, value: any) => void;
    onYearUpdate: (pattern: 'A' | 'B', year: number, newYearPlan: RaisePlanYear) => void;
    onConfigUpdate: (pattern: 'A' | 'B', field: keyof SimulationConfig, value: any) => void; // Added
    employees: Employee[];
    voiceEnabled: boolean;
}> = ({ planA, planB, configA, configB, onChange, onYearUpdate, onConfigUpdate, employees, voiceEnabled }) => {
    const [activePattern, setActivePattern] = React.useState<'A' | 'B'>('A');
    const plan = activePattern === 'A' ? planA : planB;
    const config = activePattern === 'A' ? configA : configB;
    const colorClass = activePattern === 'A' ? 'red' : 'gray';
    const isSyncedB = activePattern === 'B' && configB.syncBaseUpWithA;

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("ベースアップ");
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

    const getYearData = (year: number) => {
        const counts = {
            l1: 0, l2: 0, l3: 0, new: 0,
            newGrad: 0, trainee: 0, reemp: 0, parttime: 0, management: 0, shokutaku: 0, extended: 0, reempShokutaku: 0
        };

        employees.forEach(e => {
            if (e.hireDate < new Date(year, 3, 1)) {
                const st = determineStatusForCount(e, year, config);
                if (st === '正社員') {
                    const sys = getSalarySystem(e.hireDate);
                    if (sys === 'legacy1') counts.l1++;
                    else if (sys === 'legacy2') counts.l2++;
                    else if (sys === 'legacy3') counts.l3++;
                    else counts.new++;
                } else if (st === '新卒') {
                    counts.newGrad++;
                } else if (st === '養成') {
                    counts.trainee++;
                } else if (st === '延長') {
                    counts.extended++;
                } else if (st === '再雇用') {
                    counts.reemp++;
                } else if (st === 'パート') {
                    counts.parttime++;
                } else if (st === '管理職') {
                    counts.management++;
                } else if (st === '嘱託') {
                    counts.shokutaku++;
                } else if (st === '再雇用(嘱託)') {
                    counts.reempShokutaku++;
                }
            }
        });
        
        const seishainCount = counts.l1 + counts.l2 + counts.l3 + counts.new + counts.newGrad + counts.trainee + counts.extended;
        const teishoEligibleCount = seishainCount; 

        return { counts, seishainCount, teishoEligibleCount };
    };

    const handleAverageAmountChange = (year: number, newValue: number) => {
        if (!onYearUpdate) return;
        
        const { counts, seishainCount } = getYearData(year);
        const totalBudget = newValue * seishainCount;

        // Create new plan object
        const newYearPlan: RaisePlanYear = {
            ...plan[year],
            averageAmount: newValue,
            detailed: {
                ...plan[year].detailed,
                // Distribute average to Seishain fields ONLY
                seishain_l1: newValue,
                seishain_l2: newValue,
                seishain_new: newValue,
                newgrad_new: newValue,
                trainee_new: newValue,
                extended: newValue, 
                // Do NOT distribute to Management, Shokutaku, Re-emp, Part-time
                // They should remain as they were (or 0 if not set)
                // Note: seishain_l3 is calculated below
            }
        };

        // Recalc L3
        const allocatedWithoutL3 = 
            (newValue * counts.l1) + 
            (newValue * counts.l2) + 
            (newValue * counts.new) + 
            (newValue * counts.newGrad) + 
            (newValue * counts.trainee) +
            (newValue * counts.extended);
        
        const remainder = totalBudget - allocatedWithoutL3;
        const l3Val = counts.l3 > 0 ? Math.floor(remainder / counts.l3) : 0;
        
        newYearPlan.detailed.seishain_l3 = l3Val;

        onYearUpdate(activePattern, year, newYearPlan);
    };

    const handleManualDistributionChange = (year: number, field: string, value: number) => {
        // If updating specific field
        if (field.startsWith('detailed.')) {
            const key = field.split('.')[1];
            
            // Check if it's one of the "Excluded" types (Management, etc)
            const isExcluded = ['reemp', 'parttime', 'management', 'shokutaku', 'reemp_shokutaku'].includes(key);

            if (isExcluded) {
                // For excluded types, just update the field directly. No L3 Recalc needed.
                const newYearPlan = {
                    ...plan[year],
                    detailed: {
                        ...plan[year].detailed,
                        [key]: value
                    }
                };
                onYearUpdate(activePattern, year, newYearPlan);
                return;
            }
        }

        // For Seishain fields, use the L3 balancing logic
        const p = plan[year];
        const { seishainCount, counts } = getYearData(year);
        const key = field.split('.')[1];
        
        const newDetailed = { ...p.detailed, [key]: value };
        
        const budgetForSeishain = p.averageAmount * seishainCount;
        
        const allocatedOthers = 
            (newDetailed.seishain_l1 || 0) * counts.l1 +
            (newDetailed.seishain_l2 || 0) * counts.l2 +
            (newDetailed.seishain_new || 0) * counts.new +
            (newDetailed.newgrad_new || 0) * counts.newGrad +
            (newDetailed.trainee_new || 0) * counts.trainee +
            (newDetailed.extended || 0) * counts.extended;
        
        const remaining = budgetForSeishain - allocatedOthers;
        const l3Val = counts.l3 > 0 ? Math.floor(remaining / counts.l3) : 0;
        
        newDetailed.seishain_l3 = l3Val;

        onYearUpdate(activePattern, year, { ...p, detailed: newDetailed });
    };

    const handleInputValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Handle empty string as 0 to prevent NaN, but allow typing
        const val = e.target.value;
        return val === '' ? 0 : parseInt(val);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative transition-colors">
            {isSyncedB && (
                <div className="absolute top-4 right-4 z-20 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md flex items-center gap-2 animate-pulse">
                    <HandshakeIcon /> パターンA 連動中 (ベア固定)
                </div>
            )}

            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                 <h3 className={`font-bold text-lg text-${colorClass}-800 dark:text-${colorClass}-300 border-l-4 border-${colorClass}-800 dark:border-${colorClass}-400 pl-2`}>
                    ベースアップ・定期昇給計画 ({activePattern === 'A' ? 'パターンA: 定年延長案' : 'パターンB: 現行制度'})
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-2 rounded font-bold transition-all ${activePattern === 'A' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-2 rounded font-bold transition-all ${activePattern === 'B' ? 'bg-gray-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>パターンB</button>
                </div>
            </div>
            
            {/* Auto Raise Toggle */}
            <div className="mb-6 bg-white dark:bg-gray-700 p-4 rounded-lg border shadow-sm flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">定期昇給の自動適用</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        ONにすると、毎年4月に年齢・勤続年数に応じた定期昇給（1,600円/年）が自動加算されます。<br/>
                        <span className="text-red-500 dark:text-red-400">※OFF（デフォルト）の場合、ベアのみが加算され、定期昇給は0円となります。</span>
                    </p>
                </div>
                <div className="flex items-center">
                    <button 
                        onClick={() => onConfigUpdate(activePattern, 'autoRaiseEnabled', !config.autoRaiseEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.autoRaiseEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                        <span className={`${config.autoRaiseEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                    <span className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-300">{config.autoRaiseEnabled ? '適用する' : '適用しない'}</span>
                </div>
            </div>

            {/* Sync Base Up Toggle */}
            <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                        <HandshakeIcon /> ベースアップ（ベア）設定の連動
                    </h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                        ONにすると、パターンAで設定した「平均ベア額」を、パターンBにも自動的に反映します。<br/>
                        <span className="font-bold">※ONの場合、パターンBの個別配分設定は無効化され、全員に平均額が一律適用されます。</span>
                    </p>
                </div>
                <div className="flex items-center">
                    <button 
                        onClick={() => onConfigUpdate('B', 'syncBaseUpWithA', !configB.syncBaseUpWithA)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${configB.syncBaseUpWithA ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                        <span className={`${configB.syncBaseUpWithA ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                    <span className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-300">{configB.syncBaseUpWithA ? '連動する' : '連動しない'}</span>
                </div>
            </div>

            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                <strong>ベア配分ルール:</strong> 「一人平均ベア額」を入力すると、正社員系（新卒・養成・延長含む）に自動配分されます。<br/>
                <span className="font-bold text-red-600 dark:text-red-400">自動計算:</span> 旧3区分（H12.4.1～H23.9.30入社）は、平均ベア原資の残額から自動的に算出されます。<br/>
                <span className="font-bold text-blue-600 dark:text-blue-400">重要:</span> 管理職、嘱託、再雇用(嘱託)、パートには<strong>ベアは自動配分されません（0円固定）</strong>。必要な場合は個別設定欄に入力してください。
            </div>

            <div className={`overflow-x-auto ${isSyncedB ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
                <table className="w-full text-sm border-collapse whitespace-nowrap">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 min-w-[60px]" rowSpan={2}>年度</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/40" colSpan={3}>原資確定 (正社員系)</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40" colSpan={7}>正社員 配分 (入社時期別・延長含む)</th>
                            <th className="border dark:border-gray-600 p-2" rowSpan={2}>定昇<br/>(平均)</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800" colSpan={5}>個別設定 (原則ベアなし)</th>
                        </tr>
                        <tr>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/40 min-w-[100px]">平均ベア</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/40">対象人数</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/40 font-bold">正社員原資</th>
                            
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40 text-xs">～'99/3<br/>(旧1)</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40 text-xs">～'00/3<br/>(旧2)</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40 text-xs text-red-600 dark:text-red-400 font-bold">～'11/9<br/>(旧3)</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40 text-xs">'11/10～<br/>(新)</th>
                            
                            {/* Moved to Main Allocation */}
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40 text-xs">新卒</th>
                            <th className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/40 text-xs">養成</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/20 text-xs font-bold text-orange-800 dark:text-orange-200">延長社員</th>

                            {/* Individual Settings Order: Manager -> Shokutaku -> Re-emp -> Re-emp(Shoku) -> Part */}
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">管理職</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">嘱託</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">再雇用</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">再雇用(嘱)</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">パート</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(plan).map(y => {
                            const year = parseInt(y);
                            const p = plan[year];
                            const { counts, seishainCount, teishoEligibleCount } = getYearData(year);
                            
                            const budget = (p.averageAmount || 0) * seishainCount;
                            
                            return (
                                <tr key={year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-600 p-2 font-bold text-center dark:text-gray-300">{year}</td>
                                    
                                    {/* Budget Calculation */}
                                    <td className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/20">
                                        <input type="number" className="w-24 text-right border dark:border-gray-600 rounded px-1 font-bold text-blue-900 dark:text-blue-200 bg-white dark:bg-gray-800" 
                                            value={p.averageAmount || 0} onChange={e => handleAverageAmountChange(year, handleInputValue(e))}/>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/20 text-right text-gray-700 dark:text-gray-400 text-xs">{seishainCount.toLocaleString()}名</td>
                                    <td className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/20 text-right font-bold text-blue-900 dark:text-blue-300">{(budget/1000).toLocaleString(undefined, {maximumFractionDigits: 0})}千円</td>

                                    {/* Distribution Inputs */}
                                    <td className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/20 relative group">
                                        <input type="number" className="w-16 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-800 dark:text-gray-200" value={p.detailed?.seishain_l1 || 0} onChange={e => handleManualDistributionChange(year, 'detailed.seishain_l1', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-500">{counts.l1.toLocaleString()}名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/20 relative">
                                        <input type="number" className="w-16 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-800 dark:text-gray-200" value={p.detailed?.seishain_l2 || 0} onChange={e => handleManualDistributionChange(year, 'detailed.seishain_l2', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-500">{counts.l2.toLocaleString()}名</span>
                                    </td>
                                    
                                    {/* Auto Calculated L3 (Editable) */}
                                    <td className="border dark:border-gray-600 p-2 bg-yellow-100 dark:bg-yellow-800/40 relative">
                                        <input 
                                            type="number" 
                                            className="w-16 text-right border border-red-300 dark:border-red-700 rounded px-1 bg-white dark:bg-gray-800 font-bold text-red-700 dark:text-red-300" 
                                            value={p.detailed?.seishain_l3 || 0} 
                                            onChange={e => handleManualDistributionChange(year, 'detailed.seishain_l3', handleInputValue(e))}
                                        />
                                        <span className="absolute bottom-0 right-1 text-[9px] text-red-500 dark:text-red-300 font-bold">自動:{counts.l3.toLocaleString()}名</span>
                                    </td>

                                    <td className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/20 relative">
                                        <input type="number" className="w-16 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-800 dark:text-gray-200" value={p.detailed?.seishain_new || 0} onChange={e => handleManualDistributionChange(year, 'detailed.seishain_new', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-500">{counts.new.toLocaleString()}名</span>
                                    </td>

                                    <td className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/20 relative">
                                        <input type="number" className="w-16 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-800 dark:text-gray-200" value={p.detailed?.newgrad_new || 0} onChange={e => handleManualDistributionChange(year, 'detailed.newgrad_new', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-500">{counts.newGrad.toLocaleString()}名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-yellow-50 dark:bg-yellow-900/20 relative">
                                        <input type="number" className="w-16 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-800 dark:text-gray-200" value={p.detailed?.trainee_new || 0} onChange={e => handleManualDistributionChange(year, 'detailed.trainee_new', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-500">{counts.trainee.toLocaleString()}名</span>
                                    </td>

                                    {/* Extended (New) - Auto-linked */}
                                    <td className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/20 relative">
                                        <input type="number" className="w-16 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-700 dark:text-gray-200 font-bold text-orange-700 dark:text-orange-300" value={p.detailed?.extended || 0} onChange={e => handleManualDistributionChange(year, 'detailed.extended', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-400 dark:text-gray-500">{counts.extended.toLocaleString()}名</span>
                                    </td>

                                    {/* Teisho */}
                                    <td className="border dark:border-gray-600 p-2 relative">
                                        <input type="number" className="w-20 text-right border dark:border-gray-600 rounded px-1 dark:bg-gray-800 dark:text-gray-200" value={p.yearlyRaise || 0} onChange={e => onChange(activePattern, year, 'yearlyRaise', handleInputValue(e))}/>
                                        <div className="text-[9px] text-gray-600 dark:text-gray-400 text-right mt-1">対象: {teishoEligibleCount.toLocaleString()}名</div>
                                    </td>

                                    {/* Individual Settings Order: Manager -> Shokutaku -> Re-emp -> Re-emp(Shoku) -> Part */}
                                    <td className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-600 relative">
                                        <input type="number" className="w-14 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-700 dark:text-gray-200" value={p.detailed?.management || 0} onChange={e => handleManualDistributionChange(year, 'detailed.management', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-400 dark:text-gray-500">{counts.management.toLocaleString()}名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 relative">
                                        <input type="number" className="w-14 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-700 dark:text-gray-200" value={p.detailed?.shokutaku || 0} onChange={e => handleManualDistributionChange(year, 'detailed.shokutaku', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-400 dark:text-gray-500">{counts.shokutaku.toLocaleString()}名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 relative">
                                        <input type="number" className="w-14 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-700 dark:text-gray-200" value={p.detailed?.reemp || 0} onChange={e => handleManualDistributionChange(year, 'detailed.reemp', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-400 dark:text-gray-500">{counts.reemp.toLocaleString()}名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 relative">
                                        <input type="number" className="w-14 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-700 dark:text-gray-200" value={p.detailed?.reemp_shokutaku || 0} onChange={e => handleManualDistributionChange(year, 'detailed.reemp_shokutaku', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-400 dark:text-gray-500">{counts.reempShokutaku.toLocaleString()}名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 relative">
                                        <input type="number" className="w-14 text-right border dark:border-gray-600 rounded px-1 bg-white dark:bg-gray-700 dark:text-gray-200" value={p.detailed?.parttime || 0} onChange={e => handleManualDistributionChange(year, 'detailed.parttime', handleInputValue(e))}/>
                                        <span className="absolute bottom-0 right-1 text-[9px] text-gray-400 dark:text-gray-500">{counts.parttime.toLocaleString()}名</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">※ 区分別人数は、各年度4月1日時点での在籍予測数です。退職等により変動します。</p>
        </div>
    );
};
