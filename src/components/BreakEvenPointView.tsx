
import React, { useState, useEffect, useCallback } from 'react';
import { ChartIcon, CalculatorIcon, TrendingUpIcon, UserPlusIcon, FlashIcon, CheckIcon } from './Icons';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceDot } from 'recharts';
import { NumberInputControl } from './FormControls';
import { SimulationConfig, RecruitmentPlanYear, ImpactRateYear, TypeSettings, RaisePlanYear } from '../types';

interface BreakEvenPointViewProps {
    configA?: SimulationConfig;
    recruitmentPlanA?: Record<number, RecruitmentPlanYear>;
    raisePlanA?: Record<number, RaisePlanYear>;
    impactRatesA?: Record<number, ImpactRateYear>;
    // Shared State Props
    recruitCost: number;
    setRecruitCost: (val: number) => void;
    trainingCost: number;
    setTrainingCost: (val: number) => void;
    licenseCost: number;
    setLicenseCost: (val: number) => void;
    safetyValue: number;
    setSafetyValue: (val: number) => void;
}

const InfoBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-xs mt-4">
        <div className="font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
            <span className="text-blue-500">ℹ️</span> {title}
        </div>
        <div className="text-gray-600 dark:text-gray-300 leading-relaxed pl-5">
            {children}
        </div>
    </div>
);

export const BreakEvenPointView: React.FC<BreakEvenPointViewProps> = ({ 
    configA, recruitmentPlanA, raisePlanA, impactRatesA,
    recruitCost = 0, setRecruitCost,
    trainingCost = 0, setTrainingCost,
    licenseCost = 0, setLicenseCost,
    safetyValue = 0, setSafetyValue
}) => {
    
    const [accepted, setAccepted] = useState(false);
    const [newHireMonthly, setNewHireMonthly] = useState(350000);
    const [extensionMonthly, setExtensionMonthly] = useState(250000);

    // Helper: Calculate strict monthly cost based on settings
    const calculateMonthlyCost = (settings: TypeSettings, baseSalary: number, impact: ImpactRateYear) => {
        let fixedAllowances = 0;
        const amts = settings.allowanceAmounts;
        
        if (settings.allowances.family) fixedAllowances += amts.family.spouse;
        if (settings.allowances.child) fixedAllowances += 0; 
        if (settings.allowances.instructor) fixedAllowances += amts.instructor;
        if (settings.allowances.manager) fixedAllowances += amts.manager.type1;
        if (settings.allowances.work) fixedAllowances += amts.work.type1;

        const rippleRate = impact.rippleRate || 0.42;
        const variableAllowances = Math.floor(baseSalary * rippleRate);

        const bonusBasis = baseSalary + (settings.allowances.family ? amts.family.spouse : 0);
        const bonusSummer = Math.floor(bonusBasis * settings.bonusMonths.summer);
        const bonusWinter = Math.floor(bonusBasis * settings.bonusMonths.winter);
        const bonusEnd = Math.floor(bonusBasis * settings.bonusMonths.end); 

        const housingAmt = settings.housingAid.enabled 
            ? (settings.allowances.family ? settings.housingAid.withFamily : settings.housingAid.noFamily)
            : 0;
        
        const annualBonusTotal = (bonusSummer + housingAmt) + (bonusWinter + housingAmt) + bonusEnd;
        const annualizedBonusMonthly = Math.floor(annualBonusTotal / 12);

        const monthlyTaxable = baseSalary + fixedAllowances + variableAllowances + annualizedBonusMonthly;
        const socialInsurance = Math.floor(monthlyTaxable * (impact.socialInsuranceRate / 100));

        return monthlyTaxable + socialInsurance;
    };

    const calculateCosts = useCallback(() => {
        if (configA && recruitmentPlanA) {
            const impact = impactRatesA?.[2026] || { socialInsuranceRate: 17.5, rippleRate: 0.42, rippleTargets: [] };

            const recPlan = recruitmentPlanA[2026];
            // Use '正社員' settings for allowances/bonuses as requested, but start with new grad base salary from plan A
            const regularSettings = configA.employmentSettings['正社員'];
            
            if (recPlan && regularSettings) {
                const cost = calculateMonthlyCost(regularSettings, recPlan.newGradSalary, impact);
                setNewHireMonthly(cost);
            }

            const extSettings = configA.employmentSettings["正社員(延長)"];
            if (extSettings) {
                let extBase = 0;
                if (extSettings.calculationMethod === 'fixed') {
                    extBase = extSettings.fixedSalary || 224020;
                } else {
                    const typicalBase = 380000;
                    extBase = Math.floor(typicalBase * (configA.cutRate || 1.0));
                    if (extSettings.lowerLimit) extBase = Math.max(extBase, extSettings.lowerLimit);
                    if (extSettings.upperLimit && extSettings.upperLimit > 0) extBase = Math.min(extBase, extSettings.upperLimit);
                }

                const cost = calculateMonthlyCost(extSettings, extBase, impact);
                setExtensionMonthly(cost);
            }
        }
    }, [configA, recruitmentPlanA, impactRatesA]);

    useEffect(() => {
        calculateCosts();
    }, []);

    // Calculated Values
    const initialCost = (recruitCost || 0) + (trainingCost || 0) + (licenseCost || 0) + (safetyValue || 0);
    const monthlyDiff = newHireMonthly - extensionMonthly;
    
    // Chart Data Generation
    const chartData = [];
    let cumulativeNew = initialCost;
    let cumulativeExt = 0;
    
    let simNewMonthly = newHireMonthly;
    let simExtMonthly = extensionMonthly;
    let calcBep = 0;
    let runningSavings = 0;
    const GROSS_COST_MULTIPLIER = 1.55; 

    for(let m=1; m<=120; m++) { 
        if ((m - 1) % 12 === 0 && (Math.floor((m-1)/12)) > 0) {
             const yearIndex = Math.floor((m-1)/12);
             const targetYear = 2026 + yearIndex;
             const plan = raisePlanA?.[targetYear];
             if (plan) {
                 simNewMonthly += ((plan.averageAmount||0) + (plan.yearlyRaise||0)) * GROSS_COST_MULTIPLIER;
                 simExtMonthly += (plan.detailed?.extended || 0) * GROSS_COST_MULTIPLIER;
             }
        }
        const monthlySaving = simNewMonthly - simExtMonthly;
        runningSavings += monthlySaving;
        if (runningSavings >= initialCost) {
            calcBep = m;
            break;
        }
        
        if (m <= 60) {
            if (m === 1) {
                cumulativeNew = initialCost + simNewMonthly;
                cumulativeExt = simExtMonthly;
            } else {
                cumulativeNew += simNewMonthly;
                cumulativeExt += simExtMonthly;
            }
            
            chartData.push({
                month: m,
                newHire: cumulativeNew,
                extension: cumulativeExt,
            });
        }
    }
    
    const bepYears = calcBep / 12;

    if (!accepted) {
        return (
            <div className="flex flex-col items-center justify-center h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="mb-6 p-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <TrendingUpIcon style={{width: 64, height: 64, color: '#ca8a04'}} />
                </div>
                <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-4">
                    BEP分析 (損益分岐点) 機能
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-lg mb-8 leading-relaxed">
                    本機能は現在開発中（Beta版/Launch 2対応）です。<br/>
                    定年延長者を継続雇用した場合と、新人を採用した場合のコストを比較します。<br/>
                    <br/>
                    <span className="font-bold text-red-600 dark:text-red-400">※不完全であることを承諾の上でご利用ください。</span>
                </p>
                <button 
                    onClick={() => setAccepted(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xl transition-transform hover:scale-105"
                >
                    <CheckIcon /> 承諾して機能を使用する
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[85vh] flex flex-col transition-colors animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg">
                        <ChartIcon />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">ダッシュボード2: 損益分岐点分析 (BEP)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">定年延長者が「どれくらい働けば、新人を雇うより得か」を判定します。</p>
                    </div>
                </div>
                <button 
                    onClick={calculateCosts}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-bold text-sm transition-colors border border-gray-300 dark:border-gray-600"
                >
                    <FlashIcon style={{width: 16}} /> 最新設定で再計算
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Input Panel */}
                <div className="space-y-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                            <UserPlusIcon /> 新人採用・育成コスト (初期投資)
                        </h3>
                        <div className="space-y-3">
                            <NumberInputControl 
                                label="採用コスト (求人・選考費)" 
                                value={recruitCost} 
                                onChange={setRecruitCost} 
                                min={0} max={10000000} unit="円"
                                color="blue"
                            />
                            <NumberInputControl 
                                label="教育コスト (研修・OJT)" 
                                value={trainingCost} 
                                onChange={setTrainingCost} 
                                min={0} max={10000000} unit="円"
                                color="blue"
                            />
                            <NumberInputControl 
                                label="大型2種免許取得費用" 
                                value={licenseCost} 
                                onChange={setLicenseCost} 
                                min={0} max={1000000} unit="円"
                                color="blue"
                                description="養成運転士の場合の免許取得支援費用。"
                            />
                            <NumberInputControl 
                                label="事故回避額 (安全価値)" 
                                value={safetyValue} 
                                onChange={setSafetyValue} 
                                min={0} max={5000000} unit="円"
                                color="blue"
                                description="ベテランの安全性を失うことによる潜在的損失（リスク）として加算。"
                            />
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded text-right font-bold text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                初期コスト計: {(initialCost || 0).toLocaleString()} 円
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                            <CalculatorIcon /> 月額ランニングコスト比較
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            ※「再計算」ボタンでA案のパラメータから再計算します。<br/>
                            <span className="text-red-500 dark:text-red-400 font-bold">New!</span> グラフにはA案の昇給計画が反映されます。
                        </p>
                        <div className="space-y-3">
                            <NumberInputControl 
                                label="新人 月額コスト (A案採用計画)" 
                                value={newHireMonthly} 
                                onChange={setNewHireMonthly} 
                                min={150000} max={1000000} unit="円"
                                color="green"
                            />
                            <NumberInputControl 
                                label="延長者 月額コスト (A案固定給)" 
                                value={extensionMonthly} 
                                onChange={setExtensionMonthly} 
                                min={150000} max={1000000} unit="円"
                                color="orange"
                            />
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded text-right font-bold text-green-900 dark:text-green-200 border border-green-200 dark:border-green-800">
                                初年度差額: {(monthlyDiff || 0).toLocaleString()} 円/月
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="lg:col-span-2 flex flex-col">
                    {/* Result Banner */}
                    <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-left">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Break-Even Point (Payback Period)</div>
                                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                                    {calcBep.toFixed(1)} <span className="text-2xl text-white">ヶ月</span>
                                </div>
                                <div className="text-sm text-gray-300 mt-2">
                                    ({bepYears.toFixed(1)}年) 働けば、採用・育成コストの元が取れます。
                                </div>
                            </div>
                            
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center min-w-[200px]">
                                <div className="text-xs text-gray-300 mb-1">初期投資回収</div>
                                <div className="font-mono text-sm">
                                    <div className="border-b border-white/30 pb-1 mb-1">{(initialCost || 0).toLocaleString()}</div>
                                    <div className="text-[10px] opacity-70">毎月の差額(昇給考慮)で償却</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-inner min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    label={{ value: '経過月数', position: 'insideBottomRight', offset: -10 }} 
                                    type="number"
                                    domain={[0, 'auto']}
                                    tick={{fill: '#9ca3af'}}
                                />
                                <YAxis 
                                    tickFormatter={(val) => `${(val / 10000).toFixed(0)}万`} 
                                    label={{ value: '累積コスト(円)', angle: -90, position: 'insideLeft' }} 
                                    tick={{fill: '#9ca3af'}}
                                />
                                <Tooltip 
                                    formatter={(val: number) => val.toLocaleString() + '円'} 
                                    labelFormatter={(label) => `${label}ヶ月目`}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#e5e7eb' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="newHire" 
                                    name="新人 (採用費+免許+安全損失+累積人件費)" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={false}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="extension" 
                                    name="定年延長者 (累積人件費)" 
                                    stroke="#f59e0b" 
                                    strokeWidth={3} 
                                    dot={false}
                                />
                                
                                {calcBep > 0 && calcBep <= 60 && (
                                    <ReferenceLine x={calcBep} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: '分岐点', fill: 'red', fontSize: 12, fontWeight: 'bold' }} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
