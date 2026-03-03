
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationResult, IndividualResult } from '../types';
import { TableToolbar } from './TableToolbar';
import { SearchIcon, DatabaseIcon } from './Icons';

interface VerificationViewProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    voiceEnabled?: boolean;
}

interface EditableRowData {
    id: number;
    name: string;
    planA: any;
    planB: any;
    planC: any;
    diffAB: any;
    diffBC: any;
    diffAC: any; // Added
}

export const VerificationView: React.FC<VerificationViewProps> = ({ resultA, resultB, resultC, voiceEnabled }) => {
    const years = useMemo(() => resultA?.summary?.map(s => s.year) || [], [resultA]);
    const [selectedYear, setSelectedYear] = useState<number>(years.length > 0 ? years[0] : 2026);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Local state for editable data (initialized from props but mutable)
    const [localData, setLocalData] = useState<EditableRowData[]>([]);

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("労働強化");
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
            setLocalData([]);
            return;
        }

        const getIndividualData = (ind: IndividualResult | undefined) => {
            if (!ind) return { 
                total: 0, base: 0, bonus: 0, housing: 0, allowance: 0, social: 0, type: '-',
                family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0
            };
            return {
                total: ind.total || 0,
                base: ind.base || 0,
                bonus: (ind.bonus || 0) + (ind.lumpSum || 0),
                housing: ind.housing || 0, // Added Housing
                allowance: ind.allowance || 0,
                social: ind.socialInsurance || 0,
                type: ind.type,
                // Breakdown Details
                family: ind.allowanceDetail?.family || 0,
                child: ind.allowanceDetail?.child || 0,
                instructor: ind.allowanceDetail?.instructor || 0,
                manager: ind.allowanceDetail?.manager || 0,
                work: ind.allowanceDetail?.work || 0,
                custom: ind.allowanceDetail?.custom || 0,
                variable: ind.allowanceDetail?.variable || 0,
            };
        };

        const individualsForYear = resultA.individuals.filter(i => i.year === selectedYear);

        const calculated = individualsForYear.map(indA => {
            const indB = resultB.individuals.find(i => i.id === indA.id && i.year === selectedYear);
            const indC = resultC.individuals.find(i => i.id === indA.id && i.year === selectedYear);

            const dataA = getIndividualData(indA);
            const dataB = getIndividualData(indB);
            const dataC = getIndividualData(indC);
            
            const createDiffs = (d1: any, d2: any) => ({
                total: d1.total - d2.total,
                base: d1.base - d2.base,
                bonus: d1.bonus - d2.bonus,
                housing: d1.housing - d2.housing, // Added Housing Diff
                allowance: d1.allowance - d2.allowance,
                social: d1.social - d2.social,
                family: d1.family - d2.family,
                child: d1.child - d2.child,
                instructor: d1.instructor - d2.instructor,
                manager: d1.manager - d2.manager,
                work: d1.work - d2.work,
                custom: d1.custom - d2.custom,
                variable: d1.variable - d2.variable,
            });

            return {
                id: indA.id,
                name: indA.name,
                planA: dataA,
                planB: dataB,
                planC: dataC,
                diffAB: createDiffs(dataA, dataB), // 制度要因
                diffBC: createDiffs(dataB, dataC), // 賃上要因
                diffAC: createDiffs(dataA, dataC), // 実質増
            };
        });
        
        setLocalData(calculated);

    }, [resultA, resultB, resultC, selectedYear]);

    const handleValueChange = (id: number, planKey: 'planA' | 'planB' | 'planC', field: string, value: number) => {
        setLocalData(prev => prev.map(row => {
            if (row.id === id) {
                const newData = { ...row };
                // Update the specific field
                newData[planKey] = { ...newData[planKey], [field]: value };
                
                const createDiffs = (d1: any, d2: any) => ({
                    total: d1.total - d2.total,
                    base: d1.base - d2.base,
                    bonus: d1.bonus - d2.bonus,
                    housing: d1.housing - d2.housing, // Added Housing Diff
                    allowance: d1.allowance - d2.allowance,
                    social: d1.social - d2.social,
                    family: d1.family - d2.family,
                    child: d1.child - d2.child,
                    instructor: d1.instructor - d2.instructor,
                    manager: d1.manager - d2.manager,
                    work: d1.work - d2.work,
                    custom: d1.custom - d2.custom,
                    variable: d1.variable - d2.variable,
                });
                
                newData.diffAB = createDiffs(newData.planA, newData.planB);
                newData.diffBC = createDiffs(newData.planB, newData.planC);
                newData.diffAC = createDiffs(newData.planA, newData.planC);
                
                return newData;
            }
            return row;
        }));
    };

    const filteredData = useMemo(() => {
        return localData
            .filter(d => d.name.includes(searchTerm) || String(d.id).includes(searchTerm))
            .sort((a, b) => b.diffAB.total - a.diffAB.total);
    }, [localData, searchTerm]);

    const fmt = (n: number) => n.toLocaleString();
    const diffFmt = (n: number) => n > 0 ? `+${fmt(n)}` : fmt(n);
    const diffClass = (n: number) => n > 100 ? "text-red-600 dark:text-red-400" : n < -100 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400";

    const exportData = useMemo(() => filteredData.map(d => ({
        '年度': selectedYear,
        'ID': d.id,
        '氏名': d.name,
        'A案区分': d.planA.type,
        'B案区分': d.planB.type,
        'A案_総支給': d.planA.total,
        'B案_総支給': d.planB.total,
        'C案_総支給': d.planC.total,
        '制度要因(A-B)': d.diffAB.total,
        '賃上要因(B-C)': d.diffBC.total,
        '実質増加額(A-C)': d.diffAC.total,
        // Detailed Allowance Export
        'A案_住宅手当': d.planA.housing, 'B案_住宅手当': d.planB.housing,
        'A案_家族手当': d.planA.family, 'B案_家族手当': d.planB.family,
        'A案_子女手当': d.planA.child, 'B案_子女手当': d.planB.child,
        'A案_指導手当': d.planA.instructor, 'B案_指導手当': d.planB.instructor,
        'A案_業務手当': d.planA.work, 'B案_業務手当': d.planB.work,
        'A案_管理手当': d.planA.manager, 'B案_管理手当': d.planB.manager,
        'A案_変動手当': d.planA.variable, 'B案_変動手当': d.planB.variable,
    })), [filteredData, selectedYear]);
    
    return (
        <div className="flex flex-col h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <DatabaseIcon />
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">数値検証 (個人別・項目別差異分析)</h2>
                        <span className="text-[10px] text-gray-500">※表内の数値をクリックすると直接修正できます（シミュレーション結果には反映されません）</span>
                    </div>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold bg-white dark:bg-gray-700 dark:text-white">
                        {years.map(y => <option key={y} value={y}>{y}年度</option>)}
                    </select>
                    <div className="relative">
                        <SearchIcon style={{ position: 'absolute', top: 10, left: 10, width: 16, height: 16, color: '#9ca3af' }} />
                        <input 
                            type="text" 
                            className="w-64 border border-gray-300 dark:border-gray-600 rounded p-2 pl-8 text-sm bg-white dark:bg-gray-700 dark:text-white" 
                            placeholder="氏名・IDで検索..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
                <TableToolbar title="" data={exportData} filename={`verification_detail_${selectedYear}`} />
            </div>

            <div className="flex-1 overflow-auto">
                <div className="sticky top-0 z-10 grid grid-cols-[60px_1fr_100px_100px_100px_100px_100px_100px_100px] gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400">
                    <div className="text-center">ID</div>
                    <div className="text-left">氏名 (区分)</div>
                    <div className="text-right text-gray-800 dark:text-gray-200">A案(改)</div>
                    <div className="text-right text-gray-800 dark:text-gray-200">B案(現)</div>
                    <div className="text-right text-gray-500 dark:text-gray-400">C案(凍)</div>
                    <div className="text-right bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100">差額(A-B)</div>
                    <div className="text-right bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100">差額(B-C)</div>
                    <div className="text-right bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100">差額(A-C)</div>
                    <div className="text-center">詳細</div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredData.map(d => (
                        <details key={d.id} className="group">
                            <summary className="grid grid-cols-[60px_1fr_100px_100px_100px_100px_100px_100px_100px] gap-2 px-4 py-3 list-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm items-center">
                                <div className="text-xs text-center text-gray-500 dark:text-gray-400">{d.id}</div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800 dark:text-gray-200">{d.name}</div>
                                    <div className="text-[10px] text-gray-500">{d.planA.type}</div>
                                </div>
                                <div className="text-right font-mono text-gray-800 dark:text-gray-300">{fmt(d.planA.total)}</div>
                                <div className="text-right font-mono text-gray-800 dark:text-gray-300">{fmt(d.planB.total)}</div>
                                <div className="text-right font-mono text-gray-500 dark:text-gray-500">{fmt(d.planC.total)}</div>
                                
                                <div className={`text-right font-mono font-bold ${diffClass(d.diffAB.total)}`}>{diffFmt(d.diffAB.total)}</div>
                                <div className={`text-right font-mono font-bold ${diffClass(d.diffBC.total)}`}>{diffFmt(d.diffBC.total)}</div>
                                <div className={`text-right font-mono font-bold ${diffClass(d.diffAC.total)}`}>{diffFmt(d.diffAC.total)}</div>
                                <div className="text-center text-xs text-blue-500">▼</div>
                            </summary>
                            <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-y border-gray-200 dark:border-gray-700">
                                <table className="w-full text-xs text-right border-collapse">
                                    <thead className="text-gray-600 dark:text-gray-400 font-sans bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                            <th className="p-2 text-left">項目 (編集可)</th>
                                            <th className="p-2">A案 (改革)</th>
                                            <th className="p-2">B案 (現行)</th>
                                            <th className="p-2">C案 (凍結)</th>
                                            <th className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">差額(A-B)</th>
                                            <th className="p-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">差額(B-C)</th>
                                            <th className="p-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">差額(A-C)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono dark:text-gray-300 bg-white dark:bg-gray-900/50">
                                        {[
                                            { label: '基本給', key: 'base' },
                                            { label: '賞与+一時金', key: 'bonus' },
                                            { label: '住宅手当', key: 'housing' },
                                            { label: '諸手当(計)', key: 'allowance' },
                                            // Detailed Breakdown
                                            { label: '　└ 家族手当', key: 'family' },
                                            { label: '　└ 子女教育', key: 'child' },
                                            { label: '　└ 指導手当', key: 'instructor' },
                                            { label: '　└ 業務手当', key: 'work' },
                                            { label: '　└ 管理手当', key: 'manager' },
                                            { label: '　└ 新設手当', key: 'custom' },
                                            { label: '　└ 変動手当', key: 'variable' },
                                            { label: '社会保険料', key: 'social' },
                                        ].map(item => (
                                            <tr key={item.key} className={`border-b border-gray-100 dark:border-gray-800 ${item.key === 'allowance' ? 'font-bold bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
                                                <td className="p-2 text-left font-sans font-medium text-gray-700 dark:text-gray-300">{item.label}</td>
                                                <td className="p-0">
                                                    <input 
                                                        type="number" 
                                                        className="w-full h-full p-2 text-right bg-transparent border-none focus:ring-1 focus:ring-red-500 text-red-700 dark:text-red-400 font-medium"
                                                        value={(d.planA as any)[item.key]}
                                                        onChange={e => handleValueChange(d.id, 'planA', item.key, parseInt(e.target.value)||0)}
                                                    />
                                                </td>
                                                <td className="p-0">
                                                    <input 
                                                        type="number" 
                                                        className="w-full h-full p-2 text-right bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-blue-700 dark:text-blue-400 font-medium"
                                                        value={(d.planB as any)[item.key]}
                                                        onChange={e => handleValueChange(d.id, 'planB', item.key, parseInt(e.target.value)||0)}
                                                    />
                                                </td>
                                                <td className="p-0">
                                                    <input 
                                                        type="number" 
                                                        className="w-full h-full p-2 text-right bg-transparent border-none focus:ring-1 focus:ring-gray-500 text-gray-600 dark:text-gray-400 font-medium"
                                                        value={(d.planC as any)[item.key]}
                                                        onChange={e => handleValueChange(d.id, 'planC', item.key, parseInt(e.target.value)||0)}
                                                    />
                                                </td>
                                                <td className={`p-2 font-bold ${diffClass((d.diffAB as any)[item.key])} bg-yellow-50 dark:bg-yellow-900/10`}>{diffFmt((d.diffAB as any)[item.key])}</td>
                                                <td className={`p-2 font-bold ${diffClass((d.diffBC as any)[item.key])} bg-green-50 dark:bg-green-900/10`}>{diffFmt((d.diffBC as any)[item.key])}</td>
                                                <td className={`p-2 font-bold ${diffClass((d.diffAC as any)[item.key])} bg-red-50 dark:bg-red-900/10`}>{diffFmt((d.diffAC as any)[item.key])}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="font-bold border-t-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                            <td className="p-2 text-left font-sans">総支給額 (自動計算外)</td>
                                            <td className="p-2 text-red-700 dark:text-red-300">{fmt(d.planA.total)}</td>
                                            <td className="p-2 text-blue-700 dark:text-blue-300">{fmt(d.planB.total)}</td>
                                            <td className="p-2 text-gray-700 dark:text-gray-300">{fmt(d.planC.total)}</td>
                                            <td className={`p-2 font-black ${diffClass(d.diffAB.total)} bg-yellow-100 dark:bg-yellow-800/30`}>{diffFmt(d.diffAB.total)}</td>
                                            <td className={`p-2 font-black ${diffClass(d.diffBC.total)} bg-green-100 dark:bg-green-800/30`}>{diffFmt(d.diffBC.total)}</td>
                                            <td className={`p-2 font-black ${diffClass(d.diffAC.total)} bg-red-100 dark:bg-red-800/30`}>{diffFmt(d.diffAC.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </details>
                    ))}
                    {filteredData.length === 0 && (
                        <div className="text-center p-12 text-gray-400 dark:text-gray-500">
                            該当するデータがありません。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
