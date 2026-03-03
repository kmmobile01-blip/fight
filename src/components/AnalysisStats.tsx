
import React, { useMemo, useEffect, useState } from 'react';
import { SimulationResult, YearResult, IndividualResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TableToolbar } from './TableToolbar';

export const HeadcountView: React.FC<{ resultA: SimulationResult; resultB: SimulationResult; voiceEnabled: boolean }> = ({ resultA, voiceEnabled }) => {
    
    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("早期退職");
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
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
                    <thead className="bg-gray-100 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2">年度</th>
                            <th className="border dark:border-gray-600 p-2">総人員</th>
                            <th className="border dark:border-gray-600 p-2 text-blue-600 dark:text-blue-400">正社員系<br/><span className="text-[9px] font-normal">(新卒・養成含む)</span></th>
                            <th className="border dark:border-gray-600 p-2 text-orange-600 dark:text-orange-400">延長社員</th>
                            <th className="border dark:border-gray-600 p-2 text-green-600 dark:text-green-400">再雇用</th>
                            <th className="border dark:border-gray-600 p-2 text-green-800 dark:text-green-300">再雇用(嘱託)</th>
                            <th className="border dark:border-gray-600 p-2 text-gray-600 dark:text-gray-400">パート</th>
                            <th className="border dark:border-gray-600 p-2">平均年齢</th>
                            <th className="border dark:border-gray-600 p-2">平均勤続</th>
                            <th className="border dark:border-gray-600 p-2">高齢化率(60+)</th>
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
                                <tr key={d.year} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-600 transition-colors">
                                    <td className="p-2 font-bold dark:text-gray-200">{d.year}</td>
                                    <td className="p-2 font-bold dark:text-gray-200">{grandTotal.toLocaleString()}</td>
                                    <td className="p-2 relative group cursor-help underline decoration-dotted dark:text-blue-200">
                                        {regular.toLocaleString()}
                                        <div className="absolute hidden group-hover:block bg-black text-white text-xs p-2 rounded z-10 bottom-full left-1/2 -translate-x-1/2 min-w-[120px] text-left">
                                            既存: {d["正社員"].toLocaleString()}<br/>
                                            新卒: {d["正社員(新卒)"].toLocaleString()}<br/>
                                            養成: {d["正社員(養成)"].toLocaleString()}<br/>
                                            管理: {d["管理職"].toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-2 bg-orange-50 dark:bg-orange-900/30 font-bold dark:text-orange-200">{d["正社員(延長)"].toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{d["再雇用"].toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{d["再雇用(嘱託)"].toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400">{part.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{d.avgAge}歳</td>
                                    <td className="p-2 dark:text-gray-300">{d.avgTenure}年</td>
                                    <td className="p-2 dark:text-gray-300">{grandTotal > 0 ? ((seniorTotal / grandTotal) * 100).toFixed(1) : '0.0'}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                ※ 平均年齢、平均勤続年数、高齢化率（６０歳以上）は期末時点のものです。
            </div>
        </div>
    );
};

export const YearlyDetailView: React.FC<{ 
    resultA: SimulationResult; 
    resultB: SimulationResult;
    resultC: SimulationResult;
    voiceEnabled: boolean;
}> = ({ resultA, resultB, resultC, voiceEnabled }) => {
    
    // Filtering State
    const [filterType, setFilterType] = useState<string>("all");

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("福利厚生充実");
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

    // Helper to calculate totals based on filter
    const aggregateIndividuals = (individuals: IndividualResult[] | undefined, year: number, filter: string) => {
        if (!individuals) return { headcount: 0, total: 0, avg: 0, base: 0, bonus: 0, allowance: 0, variable: 0, social: 0 };
        
        const targetInds = individuals.filter(i => {
            if (i.year !== year) return false;
            const type = i.type;
            if (filter === "all") return true;
            if (filter === "正社員系") return type.includes("正社員");
            if (filter === "再雇用系") return type.includes("再雇用") || type.includes("嘱託");
            if (filter === "パート") return type.includes("パート");
            return type === filter;
        });

        const sum = targetInds.reduce((acc, ind) => ({
            total: acc.total + ind.total,
            base: acc.base + ind.base,
            bonus: acc.bonus + (ind.bonus || 0) + (ind.lumpSum || 0),
            allowance: acc.allowance + (ind.allowance || 0),
            variable: acc.variable + (ind.allowanceDetail?.variable || 0),
            social: acc.social + (ind.socialInsurance || 0)
        }), { total: 0, base: 0, bonus: 0, allowance: 0, variable: 0, social: 0 });

        const count = targetInds.length;
        return {
            headcount: count,
            avg: count > 0 ? Math.round(sum.total / count) : 0,
            ...sum
        };
    };

    const yearlyData = useMemo(() => {
        const years = resultA?.summary?.map(s => s.year) || [];
        if (years.length === 0) return [];

        const allData: any[] = [];
        years.forEach(year => {
            // Aggregate for A, B, C based on selected filter
            const dataA = { year, plan: 'A案', ...aggregateIndividuals(resultA?.individuals, year, filterType) };
            const dataB = { year, plan: 'B案', ...aggregateIndividuals(resultB?.individuals, year, filterType) };
            const dataC = { year, plan: 'C案', ...aggregateIndividuals(resultC?.individuals, year, filterType) };

            allData.push(dataA);
            allData.push(dataB);
            allData.push(dataC);
        });
        return allData;
    }, [resultA, resultB, resultC, filterType]);
    
    const exportData = yearlyData.map(d => ({
        "年度": d.year,
        "シナリオ": d.plan,
        "雇用区分": filterType,
        "支給人員": d.headcount,
        "総額(円)": d.total,
        "一人平均(円)": d.avg,
        "基本給(円)": d.base,
        "賞与(一時金込)(円)": d.bonus,
        "諸手当(円)": d.allowance,
        "変動手当(円)": d.variable,
        "社会保険(円)": d.social
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">年別明細 3案比較 (単位: 千円)</h3>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">雇用区分切替 (A案ベース):</label>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border dark:border-gray-600 rounded p-1 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                    >
                        {filterOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <TableToolbar title={`年別明細 (${filterOptions.find(o=>o.value===filterType)?.label})`} data={exportData} filename={`yearly_detailed_comparison_${filterType}`} />
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse whitespace-nowrap">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-center sticky top-0 z-10 text-gray-800 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 sticky left-0 bg-gray-200 dark:bg-gray-800 z-20">年度</th>
                            <th className="border dark:border-gray-600 p-2 sticky left-[72px] bg-gray-200 dark:bg-gray-800 z-20">シナリオ</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-900">支給人員</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-100 dark:bg-blue-900/40 font-bold text-blue-900 dark:text-blue-100">総額</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-900 dark:text-blue-200">一人平均</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-900">基本給</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-900">賞与(一時金込)</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-900">諸手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200">変動手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-200">社保(概算)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yearlyData.map((d, idx) => (
                            <tr key={`${d.year}-${d.plan}`} className={`border-b dark:border-gray-700 ${
                                d.plan === 'A案' ? 'bg-red-50/50 dark:bg-red-900/20' : 
                                d.plan === 'B案' ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                            }`}>
                                {idx % 3 === 0 && <td className="border dark:border-gray-600 p-2 text-center font-bold sticky left-0 bg-white dark:bg-gray-800 z-10 dark:text-gray-200" rowSpan={3}>{d.year}</td>}
                                <td className={`border dark:border-gray-600 p-2 font-bold sticky left-[72px] z-10 ${
                                    d.plan === 'A案' ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200' :
                                    d.plan === 'B案' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                }`}>{d.plan}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-300">{d.headcount.toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 font-bold dark:text-gray-100">{fmt(d.total)}</td>
                                <td className="border dark:border-gray-600 p-2 font-bold dark:text-gray-200">{fmt(d.avg)}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{fmt(d.base)}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{fmt(d.bonus)}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{fmt(d.allowance)}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{fmt(d.variable)}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{fmt(d.social)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">※ 数値は千円単位（四捨五入）で表示しています。</p>
        </div>
    );
};
