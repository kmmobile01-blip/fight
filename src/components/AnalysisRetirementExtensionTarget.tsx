
import React, { useState, useMemo } from 'react';
import { SimulationResult, SimulationConfig } from '../types';
import { TableToolbar } from './TableToolbar';
import { UserClockIcon } from './Icons';

export const RetirementExtensionTargetView: React.FC<{ 
    resultA: SimulationResult; 
    resultC: SimulationResult;
    configA: SimulationConfig;
    configB: SimulationConfig; // Keeping configB in props signature if needed elsewhere, but logic uses A vs C
}> = ({ resultA, resultC, configA, configB }) => {
    const [searchTerm, setSearchTerm] = useState("");

    // Target years: 2026 to 2030
    const targetYears = [2026, 2027, 2028, 2029, 2030];

    const data = useMemo(() => {
        if (!resultA?.individuals || !resultC?.individuals) return [];

        const list: any[] = [];

        targetYears.forEach(year => {
            // Filter employees who are "正社員（延長）" in Plan A
            const individualsA = resultA.individuals.filter(i => 
                i.year === year && i.type.includes('延長')
            );

            individualsA.forEach(indA => {
                // Find matching individual in Plan C
                const indC = resultC.individuals.find(i => i.id === indA.id && i.year === year);
                
                if (indC) {
                    // Monthly Base Salary (at year end)
                    const monthlyBaseA = indA.finalBase || Math.round(indA.base / 12);
                    const monthlyBaseC = indC.finalBase || Math.round(indC.base / 12);
                    const diffMonthly = monthlyBaseA - monthlyBaseC;

                    // Annual Base Salary
                    const annualBaseA = indA.base;
                    const annualBaseC = indC.base;
                    const diffAnnualBase = annualBaseA - annualBaseC;

                    // Calculate Age
                    const birthDate = new Date(indA.birthDate);
                    const targetDate = new Date(year, 11, 31);
                    let age = targetDate.getFullYear() - birthDate.getFullYear();
                    const m = targetDate.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && targetDate.getDate() < birthDate.getDate())) age--;

                    list.push({
                        id: indA.id,
                        name: indA.name,
                        year: year,
                        age: age,
                        statusA: indA.type,
                        statusC: indC.type,
                        
                        monthlyBaseA,
                        monthlyBaseC,
                        diffMonthly,
                        
                        annualBaseA,
                        annualBaseC,
                        diffAnnualBase,
                    });
                }
            });
        });

        // Filter by search term
        return list.filter(item => 
            item.name.includes(searchTerm) || String(item.id).includes(searchTerm)
        ).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.id - b.id;
        });

    }, [resultA, resultC, searchTerm]);

    const exportData = data.map(d => ({
        "年度": d.year,
        "ID": d.id,
        "氏名": d.name,
        "年齢": d.age,
        "A案 区分": d.statusA,
        "C案 区分": d.statusC,
        "A案(基本給月額)": d.monthlyBaseA,
        "C案(基本給月額)": d.monthlyBaseC,
        "差額(月額)": d.diffMonthly,
        "A案(基本給年額)": d.annualBaseA,
        "C案(基本給年額)": d.annualBaseC,
        "差額(年額)": d.diffAnnualBase,
    }));

    return (
        <div className="bg-white rounded-lg shadow p-6 h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserClockIcon /> 定年延長対象者リスト (正社員延長のみ)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        A案において「正社員（延長）」となる対象者を抽出し、C案（再雇用等）との基本給差額を表示します。
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <input 
                        type="text" 
                        placeholder="氏名・IDで検索..." 
                        className="border rounded p-2 text-sm w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <TableToolbar title="定年延長対象者リスト(A案vsC案)" data={exportData} filename="retirement_extension_target_ac" />
                </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-xl shadow-sm bg-white">
                <table className="w-full text-sm text-center border-collapse whitespace-nowrap min-w-max">
                    <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="border p-2 w-16 bg-gray-200 sticky left-0 z-20">年度</th>
                            <th className="border p-2 w-20 bg-gray-200">ID</th>
                            <th className="border p-2 text-left min-w-[100px] bg-gray-200">氏名</th>
                            <th className="border p-2 w-12 bg-gray-200">年齢</th>
                            <th className="border p-2 bg-blue-100 text-blue-900">A案 区分</th>
                            <th className="border p-2 bg-gray-100 text-gray-700">C案 区分</th>
                            
                            {/* Monthly Base */}
                            <th className="border p-2 bg-blue-50 text-blue-900">A案 基本給(月)</th>
                            <th className="border p-2 bg-gray-50 text-gray-700">C案 基本給(月)</th>
                            <th className="border p-2 bg-yellow-50 text-red-600 font-bold">差額 (月)</th>

                            {/* Annual Base */}
                            <th className="border p-2 bg-blue-50 text-blue-900 text-xs">A案 基本給(年)</th>
                            <th className="border p-2 bg-gray-50 text-gray-700 text-xs">C案 基本給(年)</th>
                            <th className="border p-2 bg-yellow-50 text-red-600 font-bold text-xs">差額 (年)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d, idx) => (
                            <tr key={`${d.year}-${d.id}`} className="hover:bg-blue-50 transition-colors border-b">
                                <td className="border p-2 font-bold sticky left-0 bg-white z-10">{d.year}</td>
                                <td className="border p-2 text-gray-500">{d.id}</td>
                                <td className="border p-2 text-left font-medium">{d.name}</td>
                                <td className="border p-2">{d.age}</td>
                                <td className="border p-2 text-blue-700 text-xs">{d.statusA}</td>
                                <td className="border p-2 text-gray-600 text-xs">{d.statusC}</td>
                                
                                <td className="border p-2 font-bold text-blue-800 bg-blue-50/30">{d.monthlyBaseA.toLocaleString()}</td>
                                <td className="border p-2 font-bold text-gray-700 bg-gray-50/30">{d.monthlyBaseC.toLocaleString()}</td>
                                <td className={`border p-2 font-black ${d.diffMonthly > 0 ? 'text-red-600 bg-yellow-50' : d.diffMonthly < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {d.diffMonthly > 0 ? '+' : ''}{d.diffMonthly.toLocaleString()}
                                </td>

                                <td className="border p-2 text-xs text-blue-800">{d.annualBaseA.toLocaleString()}</td>
                                <td className="border p-2 text-xs text-gray-700">{d.annualBaseC.toLocaleString()}</td>
                                <td className={`border p-2 text-xs font-bold ${d.diffAnnualBase > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {d.diffAnnualBase > 0 ? '+' : ''}{d.diffAnnualBase.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={12} className="p-8 text-center text-gray-400">
                                    対象データがありません。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
