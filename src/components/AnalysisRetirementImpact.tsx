
import React, { useState, useMemo } from 'react';
import { SimulationResult, SimulationConfig } from '../types';
import { TableToolbar } from './TableToolbar';
import { UserClockIcon } from './Icons';

export const RetirementImpactView: React.FC<{ 
    resultA: SimulationResult; 
    resultB: SimulationResult;
    configA: SimulationConfig;
    configB: SimulationConfig;
}> = ({ resultA, resultB, configA, configB }) => {
    const [searchTerm, setSearchTerm] = useState("");

    // Target years: 2026 to 2030
    const targetYears = [2026, 2027, 2028, 2029, 2030];

    const data = useMemo(() => {
        if (!resultA?.individuals || !resultB?.individuals) return [];

        const list: any[] = [];

        targetYears.forEach(year => {
            // Filter employees for the target year
            // User Request: Include all employees aged 60+ regardless of employment type
            const individualsA = resultA.individuals.filter(i => i.year === year);

            individualsA.forEach(indA => {
                // Find matching individual in Plan B
                const indB = resultB.individuals.find(i => i.id === indA.id && i.year === year);
                
                if (indB) {
                    // Calculate Age at that year end
                    const birthDate = new Date(indA.birthDate);
                    const targetDate = new Date(year, 11, 31);
                    let age = targetDate.getFullYear() - birthDate.getFullYear();
                    const m = targetDate.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && targetDate.getDate() < birthDate.getDate())) age--;

                    // Only include if age is 60+
                    if (age >= 60) {
                        // Monthly Base Salary (at year end)
                        const monthlyBaseA = indA.finalBase || Math.round(indA.base / 12);
                        const monthlyBaseB = indB.finalBase || Math.round(indB.base / 12);
                        const diffMonthly = monthlyBaseA - monthlyBaseB;

                        // Annual Base Salary (Actual paid base salary in that year)
                        const annualBaseA = indA.base;
                        const annualBaseB = indB.base;
                        const diffAnnualBase = annualBaseA - annualBaseB;

                        // Annual Bonus
                        const annualBonusA = indA.bonus;
                        const annualBonusB = indB.bonus;
                        const diffAnnualBonus = annualBonusA - annualBonusB;

                        // Winter Bonus Months Config Lookup
                        const settingA = configA.employmentSettings[indA.type];
                        const winterMonthA = settingA?.bonusMonths?.winter ?? 0;

                        const settingB = configB.employmentSettings[indB.type];
                        const winterMonthB = settingB?.bonusMonths?.winter ?? 0;

                        list.push({
                            id: indA.id,
                            name: indA.name,
                            year: year,
                            age: age,
                            statusA: indA.type,
                            statusB: indB.type,
                            
                            monthlyBaseA,
                            monthlyBaseB,
                            diffMonthly,
                            
                            annualBaseA,
                            annualBaseB,
                            diffAnnualBase,
                            
                            winterMonthA,
                            winterMonthB,
                            
                            annualBonusA,
                            annualBonusB,
                            diffAnnualBonus
                        });
                    }
                }
            });
        });

        // Filter by search term
        return list.filter(item => 
            item.name.includes(searchTerm) || String(item.id).includes(searchTerm)
        ).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return b.diffMonthly - a.diffMonthly; // Descending diff
        });

    }, [resultA, resultB, searchTerm, configA, configB]);

    const exportData = data.map(d => ({
        "年度": d.year,
        "ID": d.id,
        "氏名": d.name,
        "年齢": d.age,
        "A案 区分": d.statusA,
        "B案 区分": d.statusB,
        "A案(基本給月額)": d.monthlyBaseA,
        "B案(基本給月額)": d.monthlyBaseB,
        "差額(月額)": d.diffMonthly,
        "A案(基本給年額)": d.annualBaseA,
        "B案(基本給年額)": d.annualBaseB,
        "差額(年額)": d.diffAnnualBase,
        "A案(支給月数_冬)": d.winterMonthA,
        "B案(支給月数_冬)": d.winterMonthB,
        "A案(賞与年額)": d.annualBonusA,
        "B案(賞与年額)": d.annualBonusB,
        "差額(賞与年額)": d.diffAnnualBonus
    }));

    return (
        <div className="bg-white rounded-lg shadow p-6 h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserClockIcon /> 60歳以上対象者リスト (2026-2030)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        各年度において60歳以上の対象者を抽出し、A案（定年延長）とB案（現状維持）の給与・賞与の差額を詳細表示します。
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
                    <TableToolbar title="60歳以上対象者詳細リスト" data={exportData} filename="retirement_impact_detail" />
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
                            <th className="border p-2 bg-gray-100 text-gray-700">B案 区分</th>
                            
                            {/* Monthly Base */}
                            <th className="border p-2 bg-blue-50 text-blue-900">A案 基本給(月)</th>
                            <th className="border p-2 bg-gray-50 text-gray-700">B案 基本給(月)</th>
                            <th className="border p-2 bg-yellow-50 text-red-600 font-bold">差額 (月)</th>

                            {/* Annual Base */}
                            <th className="border p-2 bg-blue-50 text-blue-900 text-xs">A案 基本給(年)</th>
                            <th className="border p-2 bg-gray-50 text-gray-700 text-xs">B案 基本給(年)</th>
                            <th className="border p-2 bg-yellow-50 text-red-600 font-bold text-xs">差額 (年)</th>

                            {/* Bonus Months */}
                            <th className="border p-2 bg-green-50 text-green-900 text-xs">A案 冬月数</th>
                            <th className="border p-2 bg-gray-50 text-gray-700 text-xs">B案 冬月数</th>

                            {/* Annual Bonus */}
                            <th className="border p-2 bg-green-50 text-green-900">A案 賞与(年)</th>
                            <th className="border p-2 bg-gray-50 text-gray-700">B案 賞与(年)</th>
                            <th className="border p-2 bg-green-100 text-green-800 font-bold">差額 (賞与)</th>
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
                                <td className="border p-2 text-gray-600 text-xs">{d.statusB}</td>
                                
                                <td className="border p-2 font-bold text-blue-800 bg-blue-50/30">{d.monthlyBaseA.toLocaleString()}</td>
                                <td className="border p-2 font-bold text-gray-700 bg-gray-50/30">{d.monthlyBaseB.toLocaleString()}</td>
                                <td className={`border p-2 font-black ${d.diffMonthly > 0 ? 'text-red-600 bg-yellow-50' : d.diffMonthly < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {d.diffMonthly > 0 ? '+' : ''}{d.diffMonthly.toLocaleString()}
                                </td>

                                <td className="border p-2 text-xs text-blue-800">{d.annualBaseA.toLocaleString()}</td>
                                <td className="border p-2 text-xs text-gray-700">{d.annualBaseB.toLocaleString()}</td>
                                <td className={`border p-2 text-xs font-bold ${d.diffAnnualBase > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {d.diffAnnualBase > 0 ? '+' : ''}{d.diffAnnualBase.toLocaleString()}
                                </td>

                                <td className="border p-2 text-xs text-green-900">{d.winterMonthA.toFixed(2)}</td>
                                <td className="border p-2 text-xs text-gray-700">{d.winterMonthB.toFixed(2)}</td>

                                <td className="border p-2 text-green-800">{d.annualBonusA.toLocaleString()}</td>
                                <td className="border p-2 text-gray-700">{d.annualBonusB.toLocaleString()}</td>
                                <td className={`border p-2 font-bold ${d.diffAnnualBonus > 0 ? 'text-green-600' : d.diffAnnualBonus < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {d.diffAnnualBonus > 0 ? '+' : ''}{d.diffAnnualBonus.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={17} className="p-8 text-center text-gray-400">
                                    対象データがありません。シミュレーションが実行されているか確認してください。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
