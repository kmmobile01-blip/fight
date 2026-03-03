
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationResult, IndividualResult } from '../types';
import { TableToolbar } from './TableToolbar';

export const IndividualDetailBView: React.FC<{ resultB: SimulationResult }> = ({ resultB }) => {
    const [selectedYear, setSelectedYear] = useState<number>(
        (resultB && resultB.summary && resultB.summary.length > 0) ? resultB.summary[0].year : 2026
    );
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (resultB && resultB.summary && resultB.summary.length > 0) {
            if (!resultB.summary.find(r => r.year === selectedYear)) {
                setSelectedYear(resultB.summary[0].year);
            }
        }
    }, [resultB]);

    const employees: IndividualResult[] = useMemo(() => {
        if (!resultB || !resultB.individuals) return [];
        return resultB.individuals
            .filter(i => i.year === selectedYear && (i.name.includes(searchTerm) || String(i.id).includes(searchTerm)))
            .sort((a, b) => (b.total || 0) - (a.total || 0));
    }, [resultB, selectedYear, searchTerm]);

    const exportData = employees.map(h => {
        const fixedAllowance = (h.allowance || 0) - (h.allowanceDetail?.variable || 0);
        return {
            "ID": h.id,
            "氏名": h.name,
            "年度": h.year,
            "総支給(社保込)": h.total,
            "総支給(社保除)": h.totalExclSoc,
            "基本給": h.base,
            "賞与(一時金込)": (h.bonus || 0) + (h.lumpSum || 0),
            "固定手当計": fixedAllowance,
            "家族手当": h.allowanceDetail?.family || 0,
            "子女教育手当": h.allowanceDetail?.child || 0,
            "指導手当": h.allowanceDetail?.instructor || 0,
            "管理手当": h.allowanceDetail?.manager || 0,
            "業務手当": h.allowanceDetail?.work || 0,
            "新設手当": h.allowanceDetail?.custom || 0,
            "変動手当": h.allowanceDetail?.variable || 0,
            "社会保険料": h.socialInsurance,
        };
    });

    return (
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <label className="font-bold text-gray-700 dark:text-gray-300">対象年度:</label>
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(parseInt(e.target.value))}
                            className="border p-2 rounded font-bold text-lg bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                        >
                            {resultB && resultB.summary && resultB.summary.length > 0 ? (
                                resultB.summary.map(r => <option key={r.year} value={r.year}>{r.year}年度</option>)
                            ) : (
                                <option value={2026}>データなし</option>
                            )}
                        </select>
                        <input 
                            type="text" 
                            placeholder="氏名・ID検索..." 
                            className="border rounded p-2 w-64 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <TableToolbar 
                        title={`${selectedYear}年度 個人別明細[B案] (${employees.length}名)`} 
                        data={exportData} 
                        filename={`individual_detail_B_${selectedYear}`} 
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-sm text-right border-collapse whitespace-nowrap min-w-max">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 text-center text-xs w-16">ID</th>
                            <th className="border dark:border-gray-600 p-2 text-left text-xs">氏名</th>
                            <th className="border dark:border-gray-600 p-2 text-blue-700 dark:text-blue-300">総支給(込)</th>
                            <th className="border dark:border-gray-600 p-2 text-green-700 dark:text-green-300">総支給(抜)</th>
                            <th className="border dark:border-gray-600 p-2">基本給</th>
                            <th className="border dark:border-gray-600 p-2">賞与(一時金込)</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800">固定手当計</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">家族手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">子女教育</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">指導手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">業務手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">管理手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">新設手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300">変動手当</th>
                            <th className="border dark:border-gray-600 p-2 text-pink-700 dark:text-pink-400">社保(概算)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((h) => {
                             const fixedAllowance = (h.allowance || 0) - (h.allowanceDetail?.variable || 0);
                             const totalBonus = (h.bonus || 0) + (h.lumpSum || 0);
                             return (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 transition-colors">
                                    <td className="p-2 text-center text-gray-500 dark:text-gray-400">{h.id}</td>
                                    <td className="p-2 text-left font-medium dark:text-gray-200">{h.name}</td>
                                    <td className="p-2 font-bold text-blue-700 dark:text-blue-400">{(h.total || 0).toLocaleString()}</td>
                                    <td className="p-2 font-bold text-green-700 dark:text-green-400">{(h.totalExclSoc || 0).toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{(h.base || 0).toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{(totalBonus || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50 dark:bg-gray-800 font-bold dark:text-gray-300">
                                        {(fixedAllowance || 0).toLocaleString()}
                                    </td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.family || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.child || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.instructor || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.work || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.manager || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.custom || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 font-bold">{(h.allowanceDetail?.variable || 0).toLocaleString()}</td>
                                    <td className="p-2 text-pink-700 dark:text-pink-400">{(h.socialInsurance || 0).toLocaleString()}</td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
                {employees.length === 0 && (
                    <div className="text-center p-10 text-gray-400 dark:text-gray-500">
                        該当するデータがありません。計算が実行されているか確認してください。
                    </div>
                )}
            </div>
        </div>
    );
};
