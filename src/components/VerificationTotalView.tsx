
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationResult, IndividualResult } from '../types';
import { TableToolbar } from './TableToolbar';
import { DatabaseIcon } from './Icons';

interface VerificationTotalViewProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    voiceEnabled?: boolean;
}

interface EditableTotalData {
    planA: any;
    planB: any;
    planC: any;
    diffAB: any;
    diffBC: any;
    diffAC: any; // Added
}

export const VerificationTotalView: React.FC<VerificationTotalViewProps> = ({ resultA, resultB, resultC, voiceEnabled }) => {
    const years = useMemo(() => resultA?.summary?.map(s => s.year) || [], [resultA]);
    const [selectedYear, setSelectedYear] = useState<number>(years.length > 0 ? years[0] : 2026);
    
    // Local state for editable data
    const [localData, setLocalData] = useState<EditableTotalData | null>(null);

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("不当労働行為");
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

    useEffect(() => {
        if (!resultA?.individuals || !resultB?.individuals || !resultC?.individuals) {
            setLocalData(null);
            return;
        }

        const aggregateData = (individuals: IndividualResult[]) => {
            const sum = { 
                total: 0, base: 0, bonus: 0, housing: 0, allowance: 0, social: 0,
                family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0
            };
            
            individuals.forEach(ind => {
                sum.total += ind.total || 0;
                sum.base += ind.base || 0;
                sum.bonus += (ind.bonus || 0) + (ind.lumpSum || 0);
                sum.housing += ind.housing || 0; // Added Housing
                sum.allowance += ind.allowance || 0;
                sum.social += ind.socialInsurance || 0;
                sum.family += ind.allowanceDetail?.family || 0;
                sum.child += ind.allowanceDetail?.child || 0;
                sum.instructor += ind.allowanceDetail?.instructor || 0;
                sum.manager += ind.allowanceDetail?.manager || 0;
                sum.work += ind.allowanceDetail?.work || 0;
                sum.custom += ind.allowanceDetail?.custom || 0;
                sum.variable += ind.allowanceDetail?.variable || 0;
            });
            return sum;
        };

        const indA = resultA.individuals.filter(i => i.year === selectedYear);
        const indB = resultB.individuals.filter(i => i.year === selectedYear);
        const indC = resultC.individuals.filter(i => i.year === selectedYear);

        const dataA = aggregateData(indA);
        const dataB = aggregateData(indB);
        const dataC = aggregateData(indC);
        
        const createDiffs = (d1: any, d2: any) => {
            const diffs: any = {};
            Object.keys(d1).forEach(key => {
                diffs[key] = d1[key] - d2[key];
            });
            return diffs;
        };

        setLocalData({
            planA: dataA,
            planB: dataB,
            planC: dataC,
            diffAB: createDiffs(dataA, dataB),
            diffBC: createDiffs(dataB, dataC),
            diffAC: createDiffs(dataA, dataC), // Added
        });

    }, [resultA, resultB, resultC, selectedYear]);

    const handleValueChange = (planKey: 'planA' | 'planB' | 'planC', field: string, value: number) => {
        if (!localData) return;
        setLocalData(prev => {
            if (!prev) return null;
            const newData = { ...prev };
            newData[planKey] = { ...newData[planKey], [field]: value };
            
            // Recalculate Diffs
            const createDiffs = (d1: any, d2: any) => {
                const diffs: any = {};
                Object.keys(d1).forEach(key => {
                    diffs[key] = d1[key] - d2[key];
                });
                return diffs;
            };
            
            newData.diffAB = createDiffs(newData.planA, newData.planB);
            newData.diffBC = createDiffs(newData.planB, newData.planC);
            newData.diffAC = createDiffs(newData.planA, newData.planC); // Added
            return newData;
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, planKey: 'planA' | 'planB' | 'planC', itemKey: string) => {
        const rawValue = e.target.value.replace(/,/g, '');
        const numValue = parseInt(rawValue, 10);
        handleValueChange(planKey, itemKey, isNaN(numValue) ? 0 : numValue);
    };

    const fmt = (n: number) => Math.round(n).toLocaleString();
    const diffFmt = (n: number) => n > 0 ? `+${fmt(n)}` : fmt(n);
    const diffClass = (n: number) => n > 1000 ? "text-red-600 dark:text-red-400" : n < -1000 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400";

    const exportData = localData ? [{
        '年度': selectedYear,
        '項目': '全員合計',
        'A案_総支給': localData.planA.total,
        'B案_総支給': localData.planB.total,
        'C案_総支給': localData.planC.total,
        '差額AB': localData.diffAB.total,
        '差額BC': localData.diffBC.total,
        '差額AC': localData.diffAC.total // Added
    }] : [];
    
    return (
        <div className="flex flex-col h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <DatabaseIcon />
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">数値検証 (全員合計)</h2>
                        <span className="text-[10px] text-gray-500">※年度ごとの全従業員合計値を表示します。数値をクリックして修正可能です。</span>
                    </div>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold bg-white dark:bg-gray-700 dark:text-white">
                        {years.map(y => <option key={y} value={y}>{y}年度</option>)}
                    </select>
                </div>
                <TableToolbar title={`全員合計検証 (${selectedYear}年度)`} data={exportData} filename={`verification_total_${selectedYear}`} />
            </div>

            <div className="flex-1 overflow-auto p-6">
                {localData ? (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-right border-collapse">
                            <thead className="text-gray-700 dark:text-gray-200 font-bold bg-gray-100 dark:bg-gray-800 text-base">
                                <tr>
                                    <th className="p-4 text-left w-1/4">項目 (全員合計)</th>
                                    <th className="p-4 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100">A案 (改革)</th>
                                    <th className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100">B案 (現行)</th>
                                    <th className="p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">C案 (凍結)</th>
                                    <th className="p-4 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100">差額(A-B)</th>
                                    <th className="p-4 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100">差額(B-C)</th>
                                    <th className="p-4 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100">差額(A-C)</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono dark:text-gray-300 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                {[
                                    { label: '基本給', key: 'base' },
                                    { label: '賞与+一時金', key: 'bonus' },
                                    { label: '住宅手当', key: 'housing' }, // Added
                                    { label: '諸手当(計)', key: 'allowance' },
                                    { label: '　└ 家族手当', key: 'family' },
                                    { label: '　└ 子女教育', key: 'child' },
                                    { label: '　└ 指導手当', key: 'instructor' },
                                    { label: '　└ 業務手当', key: 'work' },
                                    { label: '　└ 管理手当', key: 'manager' },
                                    { label: '　└ 新設手当', key: 'custom' },
                                    { label: '　└ 変動手当', key: 'variable' },
                                    { label: '社会保険料', key: 'social' },
                                ].map(item => (
                                    <tr key={item.key} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${item.key === 'allowance' ? 'bg-gray-50 dark:bg-gray-800/30 font-bold' : ''}`}>
                                        <td className="p-4 text-left font-sans text-gray-600 dark:text-gray-400">{item.label}</td>
                                        <td className="p-0 relative">
                                            <input 
                                                type="text" 
                                                className="w-full h-full p-4 text-right bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-red-500 text-red-700 dark:text-red-400 font-medium"
                                                value={(localData.planA as any)[item.key].toLocaleString()}
                                                onChange={e => handleInputChange(e, 'planA', item.key)}
                                            />
                                        </td>
                                        <td className="p-0 relative">
                                            <input 
                                                type="text" 
                                                className="w-full h-full p-4 text-right bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 text-blue-700 dark:text-blue-400 font-medium"
                                                value={(localData.planB as any)[item.key].toLocaleString()}
                                                onChange={e => handleInputChange(e, 'planB', item.key)}
                                            />
                                        </td>
                                        <td className="p-0 relative">
                                            <input 
                                                type="text" 
                                                className="w-full h-full p-4 text-right bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-gray-500 text-gray-600 dark:text-gray-400 font-medium"
                                                value={(localData.planC as any)[item.key].toLocaleString()}
                                                onChange={e => handleInputChange(e, 'planC', item.key)}
                                            />
                                        </td>
                                        <td className={`p-4 font-bold ${diffClass((localData.diffAB as any)[item.key])} bg-yellow-50 dark:bg-yellow-900/10`}>{diffFmt((localData.diffAB as any)[item.key])}</td>
                                        <td className={`p-4 font-bold ${diffClass((localData.diffBC as any)[item.key])} bg-green-50 dark:bg-green-900/10`}>{diffFmt((localData.diffBC as any)[item.key])}</td>
                                        <td className={`p-4 font-bold ${diffClass((localData.diffAC as any)[item.key])} bg-red-50 dark:bg-red-900/10`}>{diffFmt((localData.diffAC as any)[item.key])}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="font-bold border-t-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 text-lg">
                                <tr>
                                    <td className="p-4 text-left font-sans">総支給額 (自動計算外)</td>
                                    <td className="p-4 text-red-700 dark:text-red-300">{fmt(localData.planA.total)}</td>
                                    <td className="p-4 text-blue-700 dark:text-blue-300">{fmt(localData.planB.total)}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300">{fmt(localData.planC.total)}</td>
                                    <td className={`p-4 font-black ${diffClass(localData.diffAB.total)} bg-yellow-100 dark:bg-yellow-800/30`}>{diffFmt(localData.diffAB.total)}</td>
                                    <td className={`p-4 font-black ${diffClass(localData.diffBC.total)} bg-green-100 dark:bg-green-800/30`}>{diffFmt(localData.diffBC.total)}</td>
                                    <td className={`p-4 font-black ${diffClass(localData.diffAC.total)} bg-red-100 dark:bg-red-800/30`}>{diffFmt(localData.diffAC.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                        <DatabaseIcon style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.5 }} />
                        <p className="font-bold">データがありません。</p>
                        <p className="text-sm">シミュレーションを実行するか、データを読み込んでください。</p>
                    </div>
                )}
            </div>
        </div>
    );
};
