
import React, { useMemo, useEffect, useState } from 'react';
import { SimulationResult, Breakdown, YearResult, IndividualResult } from '../types';
import { TableToolbar } from './TableToolbar';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

interface SummaryViewProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    voiceEnabled: boolean;
}

const fmt = (n: number) => Math.round((n || 0) / 1000).toLocaleString();
const fmtYen = (n: number) => (n || 0).toLocaleString();

const getDiffClass = (val: number) => {
    if (val > 1000) return "text-red-600 dark:text-red-400 font-bold bg-red-50/50 dark:bg-red-900/20";
    if (val < -1000) return "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/20";
    return "text-gray-500 dark:text-gray-400";
};

// Detailed breakdown table component for reuse
const DetailTable: React.FC<{ title: string; data: any[], filename: string }> = ({ title, data, filename }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700 transition-colors">
        <TableToolbar title={title} data={data} filename={filename} />
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 text-gray-700 dark:text-gray-200">
                    <tr>
                        <th className="border dark:border-gray-600 p-2" rowSpan={2}>年度</th>
                        <th className="border dark:border-gray-600 p-2 font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40" rowSpan={2}>総支給(込)</th>
                        <th className="border dark:border-gray-600 p-2" rowSpan={2}>総支給(抜)</th>
                        <th className="border dark:border-gray-600 p-2" rowSpan={2}>基本給</th>
                        <th className="border dark:border-gray-600 p-2" rowSpan={2}>賞与(一時金込)</th>
                        <th className="border dark:border-gray-600 p-2" rowSpan={2}>固定手当計</th>
                        <th className="border dark:border-gray-600 p-2 text-xs" colSpan={6}>固定手当内訳</th>
                        <th className="border dark:border-gray-600 p-2 text-indigo-700 dark:text-indigo-300" rowSpan={2}>変動手当</th>
                        <th className="border dark:border-gray-600 p-2 text-pink-700 dark:text-pink-300" rowSpan={2}>社保(概算)</th>
                    </tr>
                    <tr>
                        <th className="border dark:border-gray-600 p-2 text-xs">家族</th>
                        <th className="border dark:border-gray-600 p-2 text-xs">子女教育</th>
                        <th className="border dark:border-gray-600 p-2 text-xs">指導</th>
                        <th className="border dark:border-gray-600 p-2 text-xs">業務</th>
                        <th className="border dark:border-gray-600 p-2 text-xs">管理</th>
                        <th className="border dark:border-gray-600 p-2 text-xs">新設</th>
                    </tr>
                </thead>
                <tbody className="dark:text-gray-300">
                    {data.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="border dark:border-gray-600 p-2 font-bold dark:text-gray-200">{d["年度"]}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["総支給(込)"])}`}>{fmtYen(d["総支給(込)"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["総支給(抜)"])}`}>{fmtYen(d["総支給(抜)"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["基本給"])}`}>{fmtYen(d["基本給"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["賞与(一時金込)"])}`}>{fmtYen(d["賞与(一時金込)"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["固定手当計"])}`}>{fmtYen(d["固定手当計"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["家族手当"])}`}>{fmtYen(d["家族手当"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["子女教育"])}`}>{fmtYen(d["子女教育"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["指導手当"])}`}>{fmtYen(d["指導手当"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["業務手当"])}`}>{fmtYen(d["業務手当"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["管理手当"])}`}>{fmtYen(d["管理手当"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["新設手当"])}`}>{fmtYen(d["新設手当"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["変動手当"])}`}>{fmtYen(d["変動手当"])}</td>
                            <td className={`border dark:border-gray-600 p-2 ${getDiffClass(d["社保(概算)"])}`}>{fmtYen(d["社保(概算)"])}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const SummaryView: React.FC<SummaryViewProps> = ({ resultA, resultB, resultC, voiceEnabled }) => {

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("不利益変更");
        u.lang = 'ja-JP';
        u.pitch = 0.8;
        u.rate = 1.1;
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [voiceEnabled]);
    
    const analysisData = useMemo(() => {
        if (!resultA?.summary?.length) return [];
        return resultA.summary.map((rA, i) => {
            const rB = resultB?.summary?.[i];
            const rC = resultC?.summary?.[i];

            const totalA = rA?.totalCost || 0;
            const totalB = rB?.totalCost || 0;
            const totalC = rC?.totalCost || 0;
            
            const diff_AC = totalA - totalC;
            const diff_AB = totalA - totalB;
            const diff_BC = totalB - totalC;
            
            return {
                year: rA.year,
                totalA, totalB, totalC,
                diff_AC, diff_AB, diff_BC
            };
        });
    }, [resultA, resultB, resultC]);

    const breakdownDiff = (r1?: YearResult, r2?: YearResult) => {
        const d1 = r1?.breakdownSum || { base:0, bonus:0, allow:0, allowDetails: {} as any, socialInsurance: 0, lump: 0, house: 0, custom: 0 };
        const d2 = r2?.breakdownSum || { base:0, bonus:0, allow:0, allowDetails: {} as any, socialInsurance: 0, lump: 0, house: 0, custom: 0 };
        const total1 = r1?.totalCost || 0;
        const total2 = r2?.totalCost || 0;
    
        return {
            "総支給(込)": total1 - total2,
            "総支給(抜)": (total1 - d1.socialInsurance) - (total2 - d2.socialInsurance),
            "基本給": d1.base - d2.base,
            "賞与(一時金込)": (d1.bonus + d1.lump) - (d2.bonus + d2.lump),
            "固定手当計": (d1.allow - (d1.allowDetails?.variable || 0)) - (d2.allow - (d2.allowDetails?.variable || 0)),
            "家族手当": (d1.allowDetails?.family || 0) - (d2.allowDetails?.family || 0),
            "子女教育": (d1.allowDetails?.child || 0) - (d2.allowDetails?.child || 0),
            "指導手当": (d1.allowDetails?.instructor || 0) - (d2.allowDetails?.instructor || 0),
            "業務手当": (d1.allowDetails?.work || 0) - (d2.allowDetails?.work || 0),
            "管理手当": (d1.allowDetails?.manager || 0) - (d2.allowDetails?.manager || 0),
            "新設手当": (d1.allowDetails?.custom || 0) - (d2.allowDetails?.custom || 0),
            "変動手当": (d1.allowDetails?.variable || 0) - (d2.allowDetails?.variable || 0),
            "社保(概算)": d1.socialInsurance - d2.socialInsurance
        };
    };

    const details_AB = useMemo(() => {
        if (!resultA?.summary?.length || !resultB?.summary?.length) return [];
        return resultA.summary.map((rA, i) => {
            const rB = resultB.summary[i];
            if (!rB) return null;
            const diff = breakdownDiff(rA, rB);
            return { "年度": rA.year, ...diff };
        }).filter(Boolean);
    }, [resultA, resultB]);

    const details_BC = useMemo(() => {
        if (!resultB?.summary?.length || !resultC?.summary?.length) return [];
        return resultB.summary.map((rB, i) => {
            const rC = resultC.summary[i];
            if (!rC) return null;
            const diff = breakdownDiff(rB, rC);
            return { "年度": rB.year, ...diff };
        }).filter(Boolean);
    }, [resultB, resultC]);

    const details_AC = useMemo(() => {
        if (!resultA?.summary?.length || !resultC?.summary?.length) return [];
        return resultA.summary.map((rA, i) => {
            const rC = resultC.summary[i];
            if (!rC) return null;
            const diff = breakdownDiff(rA, rC);
            return { "年度": rA.year, ...diff };
        }).filter(Boolean);
    }, [resultA, resultC]);

    if(analysisData.length === 0) {
        return (
             <div className="p-10 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="text-lg font-bold">データ不足</h3>
                <p className="text-sm">シミュレーションを実行すると、ここに影響額の分析結果が表示されます。</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Factor Analysis Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700 transition-colors">
                <TableToolbar title="人件費増加 要因分解サマリー (単位: 千円)" data={analysisData.map(d => ({ "年度": d.year, "総コスト増(A-C)": fmt(d.diff_AC), "制度変更要因(A-B)": fmt(d.diff_AB), "賃上げ要因(B-C)": fmt(d.diff_BC)}))} filename="factor_analysis_summary" />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="border dark:border-gray-600 p-2">年度</th>
                                <th className="border dark:border-gray-600 p-2 font-bold text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/40">総コスト増 (A-C)</th>
                                <th className="border dark:border-gray-600 p-2 text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40">制度変更要因 (A-B)</th>
                                <th className="border dark:border-gray-600 p-2 text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/40">賃上げ要因 (B-C)</th>
                            </tr>
                        </thead>
                        <tbody className="dark:text-gray-300">
                            {analysisData.map(d => (
                                <tr key={d.year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-600 p-2 font-bold dark:text-gray-200">{d.year}</td>
                                    <td className={`border dark:border-gray-600 p-2 font-bold text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20`}>{fmt(d.diff_AC)}</td>
                                    <td className={`border dark:border-gray-600 p-2 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20`}>{fmt(d.diff_AB)}</td>
                                    <td className={`border dark:border-gray-600 p-2 font-bold text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-900/20`}>{fmt(d.diff_BC)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3-Pattern Comparison Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700 h-[500px] transition-colors">
                <h3 className="font-bold text-lg mb-4 text-center text-gray-800 dark:text-gray-100">総人件費 3案比較 (単位: 千円)</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart data={analysisData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{fill: '#9ca3af'}} />
                        <YAxis tickFormatter={v => fmt(v)} tick={{fill: '#9ca3af'}} />
                        <Tooltip 
                            formatter={(value: number) => value.toLocaleString() + '円'} 
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                            itemStyle={{ color: '#e5e7eb' }}
                        />
                        <Legend wrapperStyle={{ color: '#9ca3af' }} />
                        <Bar dataKey="totalC" name="C:基準 (昇給停止)" fill="#9ca3af" />
                        <Bar dataKey="totalB" name="B:賃上げのみ" fill="#3b82f6" />
                        <Bar dataKey="totalA" name="A:制度改定+賃上げ" fill="#ef4444" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            {/* Detailed Tables */}
            <DetailTable 
                title="実質総増加額 詳細 (A-C)"
                data={details_AC}
                filename="impact_detail_total"
            />
            <DetailTable 
                title="定年延長による影響額 詳細 (A-B)"
                data={details_AB}
                filename="impact_detail_extension"
            />
            <DetailTable 
                title="賃上げによる影響額 詳細 (B-C)"
                data={details_BC}
                filename="impact_detail_raises"
            />
        </div>
    );
};
