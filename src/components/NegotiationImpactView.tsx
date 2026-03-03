
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationResult, RaisePlanYear } from '../types';
import { 
    ResponsiveContainer, 
    ComposedChart, 
    CartesianGrid, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    Bar, 
    Line, 
    Area,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { TrendingUpIcon, AlertTriangleIcon, CheckCircleIcon, HandshakeIcon, CalculatorIcon, BotIcon } from './Icons';

interface NegotiationImpactViewProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    raisePlanA: Record<number, RaisePlanYear>;
    raisePlanB: Record<number, RaisePlanYear>;
    voiceEnabled: boolean;
}

const fmt = (n: number) => Math.round((n || 0) / 1000).toLocaleString();
const fmtFull = (n: number) => Math.round(n || 0).toLocaleString();

export const NegotiationImpactView: React.FC<NegotiationImpactViewProps> = ({ 
    resultA, resultB, resultC, raisePlanA, raisePlanB, voiceEnabled 
}) => {
    const [compromiseRate, setCompromiseRate] = useState(0.5); // 0 = Company Target (B), 1 = Union Demand (A+)
    
    // Play voice on mount
    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance("交渉インパクト分析を開始します。妥結点を探ってください。");
        u.lang = 'ja-JP';
        synth.speak(u);
    }, [voiceEnabled]);

    // Calculate Union Demand (Hypothetical: Plan A + 20% extra pressure)
    const unionDemandData = useMemo(() => {
        if (!resultA?.summary?.length) return [];
        return resultA.summary.map((rA, i) => {
            const rC = resultC?.summary?.[i];
            const baseCost = rC?.totalCost || 0;
            const increaseA = (rA?.totalCost || 0) - baseCost;
            // Union demand is Plan A + some extra "aggressive" margin
            return baseCost + (increaseA * 1.3);
        });
    }, [resultA, resultC]);

    const chartData = useMemo(() => {
        if (!resultA?.summary?.length) return [];
        
        return resultA.summary.map((rA, i) => {
            const rB = resultB?.summary?.[i];
            const rC = resultC?.summary?.[i];
            const uDemand = unionDemandData[i] || 0;
            
            const costA = rA?.totalCost || 0;
            const costB = rB?.totalCost || 0;
            const costC = rC?.totalCost || 0;
            
            // Settlement point is between B (Target) and Union Demand
            const settlement = costB + (uDemand - costB) * compromiseRate;
            
            return {
                year: rA.year,
                "A:会社提案": costA,
                "B:会社目標": costB,
                "C:現状維持": costC,
                "組合要求(推計)": uDemand,
                "妥結予測": settlement,
                "予算限界": costB * 1.05 // 5% buffer over target
            };
        });
    }, [resultA, resultB, resultC, unionDemandData, compromiseRate]);

    const currentYearData = chartData[0] || {};
    const gap = (currentYearData["組合要求(推計)"] || 0) - (currentYearData["B:会社目標"] || 0);
    const settlementImpact = (currentYearData["妥結予測"] || 0) - (currentYearData["B:会社目標"] || 0);
    const isOverBudget = (currentYearData["妥結予測"] || 0) > (currentYearData["予算限界"] || 0);

    const pieData = [
        { name: '会社目標内', value: currentYearData["B:会社目標"] - currentYearData["C:現状維持"], fill: '#3b82f6' },
        { name: '妥結による増分', value: Math.max(0, settlementImpact), fill: isOverBudget ? '#ef4444' : '#f59e0b' },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <HandshakeIcon className="text-red-600" />
                        交渉インパクト・シミュレーター
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        会社目標(B案)と組合要求のギャップを可視化し、妥結点の財務インパクトを検証します。
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-gray-400">妥結指数 (Settlement Index)</div>
                        <div className={`text-xl font-black ${compromiseRate > 0.7 ? 'text-red-600' : compromiseRate > 0.3 ? 'text-yellow-600' : 'text-blue-600'}`}>
                            {(compromiseRate * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div className="h-10 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
                    <BotIcon className="w-8 h-8 text-indigo-500 animate-pulse" />
                </div>
            </div>

            {/* Main Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Controls & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <TrendingUpIcon className="w-4 h-4" />
                            妥結ポイント調整
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-blue-600">会社目標 (0%)</span>
                                    <span className="text-red-600">組合要求 (100%)</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={compromiseRate}
                                    onChange={(e) => setCompromiseRate(parseFloat(e.target.value))}
                                    className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">目標との差額</div>
                                    <div className="text-lg font-black text-blue-800 dark:text-blue-200">+{fmt(settlementImpact)}<span className="text-xs ml-1">千円</span></div>
                                </div>
                                <div className={`p-3 rounded-lg border ${isOverBudget ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'}`}>
                                    <div className={`text-[10px] font-bold uppercase ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>予算限界比</div>
                                    <div className={`text-lg font-black ${isOverBudget ? 'text-red-800' : 'text-green-800'} dark:text-gray-200`}>
                                        {((currentYearData["妥結予測"] / currentYearData["予算限界"]) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <BotIcon className="w-4 h-4 text-indigo-500" />
                            AI 戦略アドバイス
                        </h3>
                        <div className="space-y-4">
                            {isOverBudget ? (
                                <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <AlertTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
                                    <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                                        現在の妥結予測は予算限界を超過しています。人件費率が危険水域に達するため、ベア額の圧縮または手当の見直しを強く推奨します。
                                    </p>
                                </div>
                            ) : compromiseRate < 0.3 ? (
                                <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <CheckCircleIcon className="w-5 h-5 text-blue-600 shrink-0" />
                                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                        会社目標に近い水準です。財務健全性は維持されますが、組合側の反発が予想されます。非金銭的処遇（休日増など）での調整を検討してください。
                                    </p>
                                </div>
                            ) : (
                                <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                                    <HandshakeIcon className="w-5 h-5 text-yellow-600 shrink-0" />
                                    <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                        現実的な妥結ラインです。一定のコスト増は避けられませんが、労使関係の安定には寄与します。原資確保のための経費削減策をセットで提示すべきです。
                                    </p>
                                </div>
                            )}
                            
                            <div className="pt-2 border-t dark:border-gray-800">
                                <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase">交渉のヒント</div>
                                <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                                    <li>ベア1,000円の抑制で年間約{fmt(gap / 10)}千円の原資が浮きます。</li>
                                    <li>一時金0.1ヶ月の調整は、ベア約5,000円相当のインパクトです。</li>
                                    <li>初任給改定は若手定着に効きますが、既存社員とのバランスに注意。</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Trend Chart */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-[400px]">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">交渉シナリオ別 総人件費推移 (単位: 千円)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="year" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                <YAxis 
                                    tickFormatter={v => fmt(v)} 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    formatter={(v: any) => fmtFull(v) + '円'}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Area type="monotone" dataKey="組合要求(推計)" fill="#fee2e2" stroke="#f87171" strokeWidth={2} fillOpacity={0.3} />
                                <Bar dataKey="C:現状維持" fill="#9ca3af" opacity={0.3} name="現状維持(C案)" />
                                <Line type="monotone" dataKey="B:会社目標" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="会社目標(B案)" />
                                <Line type="monotone" dataKey="妥結予測" stroke="#f59e0b" strokeWidth={4} strokeDasharray="5 5" dot={{r: 6}} name="妥結予測ライン" />
                                <Line type="monotone" dataKey="予算限界" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" name="予算限界線" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Breakdown & Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-[300px]">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm">増加コストの内訳 (初年度)</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => fmtFull(v) + '円'} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm">主要交渉項目のギャップ</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span className="text-gray-500">ベースアップ (平均)</span>
                                        <span className="text-red-600">差: +{fmtFull((raisePlanA[2026]?.averageAmount || 0) * 0.3)}円</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{width: '60%'}}></div>
                                        <div className="bg-red-400 h-full" style={{width: '20%'}}></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span className="text-gray-500">一時金 (年間)</span>
                                        <span className="text-red-600">差: +0.2ヶ月</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{width: '75%'}}></div>
                                        <div className="bg-red-400 h-full" style={{width: '15%'}}></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span className="text-gray-500">新設手当原資</span>
                                        <span className="text-red-600">差: +1,200千円</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{width: '40%'}}></div>
                                        <div className="bg-red-400 h-full" style={{width: '30%'}}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                                <CalculatorIcon className="w-5 h-5 text-indigo-600" />
                                <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">
                                    ギャップ総額: <span className="font-bold text-sm">{fmt(gap)}千円</span>
                                    <br/>妥結による追加負担: <span className="font-bold text-sm text-red-600">{fmt(settlementImpact)}千円</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
