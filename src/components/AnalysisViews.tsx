
import React, { useState, useMemo } from 'react';
import { SimulationResult, Employee, SimulationConfig, ImpactRateYear } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TableToolbar } from './TableToolbar';
import { calculateFiscalYearDetails, DateUtils } from '../utils/simulationLogic';

export const HeadcountView: React.FC<{ resultA: SimulationResult; resultB: SimulationResult }> = ({ resultA }) => {
    const data = resultA.summary.map(r => ({
        year: r.year,
        "正社員": r.headcount["正社員"] || 0,
        "正社員(新卒)": r.headcount["正社員(新卒)"] || 0,
        "正社員(養成)": r.headcount["正社員(養成)"] || 0,
        "管理職": r.headcount["管理職"] || 0,
        "正社員(延長)": r.headcount["正社員(延長)"] || 0,
        "再雇用": r.headcount["再雇用"] || 0,
        "再雇用(嘱託)": r.headcount["再雇用(嘱託)"] || 0,
        "パート運転士(月給制)": r.headcount["パート運転士(月給制)"] || 0,
        avgAge: r.avgAge,
        avgTenure: r.avgTenure
    }));
    
    // Prepare export data
    const exportData = resultA.summary.map(r => ({
        "年度": r.year,
        "総人員": r.activeCount,
        "正社員": r.headcount["正社員"] || 0,
        "正社員(新卒)": r.headcount["正社員(新卒)"] || 0,
        "正社員(養成)": r.headcount["正社員(養成)"] || 0,
        "管理職": r.headcount["管理職"] || 0,
        "正社員(延長)": r.headcount["正社員(延長)"] || 0,
        "再雇用": r.headcount["再雇用"] || 0,
        "再雇用(嘱託)": r.headcount["再雇用(嘱託)"] || 0,
        "パート運転士(月給制)": r.headcount["パート運転士(月給制)"] || 0,
        "平均年齢": r.avgAge,
        "平均勤続年数": r.avgTenure
    }));

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <TableToolbar title="人員構成推移予測 (パターンA)" data={exportData} filename="headcount_prediction" />
            
            {/* Scrollable Chart Container */}
            <div className="w-full overflow-x-auto">
                <div className="h-96" style={{ minWidth: '800px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="正社員" stackId="1" fill="#3b82f6" name="正社員" />
                            <Bar dataKey="正社員(新卒)" stackId="1" fill="#60a5fa" name="正社員(新卒)" />
                            <Bar dataKey="正社員(養成)" stackId="1" fill="#93c5fd" name="正社員(養成)" />
                            <Bar dataKey="管理職" stackId="1" fill="#1e40af" name="管理職" />
                            <Bar dataKey="正社員(延長)" stackId="1" fill="#f59e0b" name="正社員(延長)" />
                            <Bar dataKey="再雇用" stackId="1" fill="#10b981" name="再雇用" />
                            <Bar dataKey="再雇用(嘱託)" stackId="1" fill="#059669" name="再雇用(嘱託)" />
                            <Bar dataKey="パート運転士(月給制)" stackId="1" fill="#6b7280" name="パート運転士(月給制)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-8 overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                    <thead className="bg-gray-100 font-bold">
                        <tr>
                            <th className="border p-2">年度</th>
                            <th className="border p-2">総人員</th>
                            <th className="border p-2 text-blue-600">正社員系<br/><span className="text-[9px] font-normal">(新卒・養成含む)</span></th>
                            <th className="border p-2 text-orange-600">延長社員</th>
                            <th className="border p-2 text-green-600">再雇用</th>
                            <th className="border p-2 text-green-800">再雇用(嘱託)</th>
                            <th className="border p-2 text-gray-600">パート</th>
                            <th className="border p-2">平均年齢</th>
                            <th className="border p-2">平均勤続</th>
                            <th className="border p-2">高齢化率(60+)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d: any) => {
                            const regular = (d["正社員"] || 0) + (d["正社員(新卒)"] || 0) + (d["正社員(養成)"] || 0) + (d["管理職"] || 0);
                            const senior = (d["正社員(延長)"] || 0) + (d["再雇用"] || 0) + (d["再雇用(嘱託)"] || 0);
                            const part = d["パート運転士(月給制)"] || 0;
                            const seniorTotal = senior + part; 
                            const grandTotal = regular + seniorTotal;
                            
                            return (
                                <tr key={d.year} className="hover:bg-gray-50 border-b">
                                    <td className="p-2 font-bold">{d.year}</td>
                                    <td className="p-2 font-bold">{grandTotal}</td>
                                    <td className="p-2 relative group cursor-help underline decoration-dotted">
                                        {regular}
                                        <div className="absolute hidden group-hover:block bg-black text-white text-xs p-2 rounded z-10 bottom-full left-1/2 -translate-x-1/2 min-w-[120px] text-left">
                                            既存: {d["正社員"]}<br/>
                                            新卒: {d["正社員(新卒)"]}<br/>
                                            養成: {d["正社員(養成)"]}<br/>
                                            管理: {d["管理職"]}
                                        </div>
                                    </td>
                                    <td className="p-2 bg-orange-50 font-bold">{d["正社員(延長)"]}</td>
                                    <td className="p-2">{d["再雇用"]}</td>
                                    <td className="p-2">{d["再雇用(嘱託)"]}</td>
                                    <td className="p-2 bg-gray-50">{part}</td>
                                    <td className="p-2">{d.avgAge}歳</td>
                                    <td className="p-2">{d.avgTenure}年</td>
                                    <td className="p-2">{grandTotal > 0 ? ((seniorTotal / grandTotal) * 100).toFixed(1) : '0.0'}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">
                ※ 平均年齢、平均勤続年数、高齢化率（６０歳以上）は期末時点のものです。
            </div>
        </div>
    );
};

export const YearlyDetailView: React.FC<{ 
    resultA: SimulationResult; 
    resultB: SimulationResult;
    initialEmployees: Employee[];
    configA: SimulationConfig;
    impactRatesA: Record<number, ImpactRateYear>;
}> = ({ resultA, resultB, initialEmployees, configA, impactRatesA }) => {
    
    const [filterType, setFilterType] = useState<string>("all");

    // Helper for formatting thousands
    const fmt = (n: number) => (n / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 });

    const filterOptions = [
        { value: "all", label: "全員 (All)" },
        { value: "正社員系", label: "正社員系 (正社員/新卒/養成/延長)" },
        { value: "正社員", label: "正社員 (一般)" },
        { value: "正社員(延長)", label: "正社員 (延長)" },
        { value: "正社員(新卒)", label: "正社員 (新卒)" },
        { value: "管理職", label: "管理職" },
        { value: "再雇用系", label: "再雇用系 (再雇用/嘱託)" },
        { value: "再雇用", label: "再雇用 (一般)" },
        { value: "再雇用(嘱託)", label: "再雇用 (元管理職)" },
        { value: "パート", label: "パート運転士" },
    ];

    // Calculate 2025 (Base Year) Data with Filtering
    const baseYearData = useMemo(() => {
        const year = 2025;
        let totalCost = 0;
        let baseSum = 0;
        let bonusSum = 0;
        let allowSum = 0;
        let variableSum = 0;
        let socialSum = 0;
        let headcount = 0;

        // Use 2026 impact rates as a proxy or default
        const iRates = impactRatesA[2026] || { socialInsuranceRate: 17.5, rippleRate: 0.9, rippleTargets: ['base'] };
        // Dummy plan objects for calculation (no raises)
        const emptyRaisePlan = { [year]: { averageAmount: 0, detailed: {} as any, yearlyRaise: 0, raiseRate: 0 } };
        const emptyCustomAllowances: any[] = [];

        initialEmployees.forEach(emp => {
            // Run monthly calc for 2025
            const res = calculateFiscalYearDetails(emp, year, configA, emptyRaisePlan, emptyCustomAllowances, 0, 0, iRates);
            
            const type = res.finalStatus;
            // Check Filter
            const matchesFilter = filterType === "all" || type === filterType || (
                (filterType === "正社員系" && type.includes("正社員")) ||
                (filterType === "再雇用系" && (type.includes("再雇用") || type.includes("嘱託"))) ||
                (filterType === "パート" && type.includes("パート"))
            );

            if (matchesFilter && type !== '退職' && type !== '入社前') {
                totalCost += res.total;
                baseSum += res.breakdown.base;
                bonusSum += res.breakdown.bonus;
                allowSum += res.breakdown.allow;
                variableSum += res.breakdown.allowDetails.variable;
                socialSum += res.breakdown.socialInsurance;
                headcount++;
            }
        });

        return {
            year,
            total: totalCost,
            base: baseSum,
            bonus: bonusSum,
            allowance: allowSum,
            variable: variableSum,
            social: socialSum,
            headcount
        };
    }, [initialEmployees, configA, impactRatesA, filterType]);

    // Aggregate Future Years Data with Filtering
    const data = useMemo(() => {
        if (!resultA || !resultA.individuals) return [];

        return resultA.summary.map(r => {
            const year = r.year;
            
            // We need to aggregate from individuals to apply the filter accurately
            // because summary only holds totals for the year, not breakdowns per type per item.
            const individualsInYear = resultA.individuals.filter(i => i.year === year);
            
            let totalCost = 0;
            let baseSum = 0;
            let bonusSum = 0;
            let allowSum = 0;
            let variableSum = 0;
            let socialSum = 0;
            let headcount = 0;

            individualsInYear.forEach(ind => {
                const type = ind.type;
                const matchesFilter = filterType === "all" || type === filterType || (
                    (filterType === "正社員系" && type.includes("正社員")) ||
                    (filterType === "再雇用系" && (type.includes("再雇用") || type.includes("嘱託"))) ||
                    (filterType === "パート" && type.includes("パート"))
                );

                if (matchesFilter) {
                    totalCost += ind.total;
                    baseSum += ind.base;
                    bonusSum += ind.bonus;
                    allowSum += ind.allowance;
                    variableSum += ind.allowanceDetail.variable;
                    socialSum += ind.socialInsurance;
                    headcount++;
                }
            });

            return {
                year: r.year,
                total: totalCost,
                base: baseSum,
                bonus: bonusSum,
                allowance: allowSum,
                variable: variableSum,
                social: socialSum,
                headcount: headcount
            };
        });
    }, [resultA, filterType]);

    // Prepend 2025 Data
    const fullData = [baseYearData, ...data];

    const exportData = fullData.map(d => ({
        "年度": d.year,
        "支給人員": d.headcount,
        "総額": d.total,
        "一人平均": d.headcount > 0 ? Math.round(d.total / d.headcount) : 0,
        "基本給": d.base,
        "賞与": d.bonus,
        "諸手当": d.allowance,
        "変動手当": d.variable,
        "社会保険": d.social
    }));

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">詳細年度別明細 (パターンA)</h3>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-700">雇用区分:</label>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border rounded p-1 text-sm bg-gray-50"
                    >
                        {filterOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <TableToolbar title={`年度別明細 (${filterOptions.find(o=>o.value===filterType)?.label})`} data={exportData} filename="yearly_detailed_breakdown" />
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse whitespace-nowrap">
                    <thead className="bg-gray-100 text-center">
                        <tr>
                            <th className="border p-2 sticky left-0 bg-gray-200 z-10" rowSpan={2}>年度</th>
                            {/* Swapped: Headcount first, Total second */}
                            <th className="border p-2 bg-gray-50" rowSpan={2}>支給<br/>人員</th>
                            <th className="border p-2 bg-blue-100 font-bold text-blue-900" rowSpan={2}>総額<br/>(千円)</th>
                            <th className="border p-2 bg-blue-50 font-bold text-blue-900" rowSpan={2}>一人平均<br/>(千円)</th>
                            <th className="border p-2 bg-gray-50" colSpan={5}>費目別内訳 (千円)</th>
                        </tr>
                        <tr>
                            <th className="border p-2 bg-gray-50 text-xs">基本給</th>
                            <th className="border p-2 bg-gray-50 text-xs">賞与</th>
                            <th className="border p-2 bg-gray-50 text-xs">諸手当</th>
                            <th className="border p-2 bg-gray-50 text-xs text-indigo-700 font-bold">変動手当</th>
                            <th className="border p-2 bg-gray-50 text-xs text-pink-700">社保(概算)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fullData.map((d, idx) => (
                            <tr key={d.year} className={`hover:bg-gray-50 border-b ${idx === 0 ? 'bg-yellow-50/50' : ''}`}>
                                <td className="border p-2 text-center font-bold sticky left-0 bg-white">{d.year}</td>
                                <td className="border p-2">{d.headcount.toLocaleString()}</td>
                                <td className="border p-2 font-bold text-blue-800 bg-blue-50">{fmt(d.total)}</td>
                                <td className="border p-2 font-bold text-blue-800 bg-blue-50/30">
                                    {d.headcount > 0 ? fmt(Math.round(d.total / d.headcount)) : 0}
                                </td>
                                
                                <td className="border p-2">{fmt(d.base)}</td>
                                <td className="border p-2">{fmt(d.bonus)}</td>
                                <td className="border p-2">{fmt(d.allowance)}</td>
                                <td className="border p-2 text-indigo-700 font-bold">{fmt(d.variable)}</td>
                                <td className="border p-2 text-pink-700">{fmt(d.social)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">※ 2025年度は初期マスタベースの試算値です。数値は千円単位（四捨五入）で表示しています。</p>
        </div>
    );
};
