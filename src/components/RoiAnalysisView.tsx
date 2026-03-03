
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationResult, RaisePlanYear, RecruitmentPlanYear, ImpactRateYear, SimulationConfig, Employee, TypeSettings } from '../types';
import { TrendingUpIcon, UserPlusIcon, BanknotesIcon, CalculatorIcon, DatabaseIcon, ChartIcon, FlashIcon, CheckIcon, ShieldCheckIcon } from './Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ComposedChart, Line, Legend, ReferenceLine } from 'recharts';
import { NumberInputControl, StepperControl } from './FormControls';
import { calculateFiscalYearDetails, defaultEmploymentSettings } from '../utils/simulationLogic';

interface RoiAnalysisViewProps {
    resultA: SimulationResult;
    recruitCost: number; // Shared State
    trainingCost: number; // Shared State
    licenseCost: number; // Shared State
    sharedSafetyValue: number; // Shared State
    
    // New props for dynamic calculation
    configA: SimulationConfig;
    raisePlanA: Record<number, RaisePlanYear>;
    recruitmentPlanA: Record<number, RecruitmentPlanYear>;
    impactRatesA: Record<number, ImpactRateYear>;
}

export const RoiAnalysisView: React.FC<RoiAnalysisViewProps> = ({ 
    resultA, 
    recruitCost = 0, 
    trainingCost = 0, 
    licenseCost = 0, 
    sharedSafetyValue = 0,
    configA,
    raisePlanA,
    recruitmentPlanA,
    impactRatesA
}) => {
    
    const [accepted, setAccepted] = useState(false);

    // --- Dynamic Mode State ---
    const [simParams, setSimParams] = useState({
        unitPrice: 7500000,         // 受託料金 (年間/人) - Default 750万
        discountRate: 4.0,          // 割引率 (WACC) - Default 4.0%
        taxRate: 35.0               // 実効税率 (%) - Default 35%
    });

    // --- Dynamic Analysis Logic (Mock Employee Progression) ---
    const dynamicSimulationData = useMemo(() => {
        if (!configA || !raisePlanA || !recruitmentPlanA) return null;

        const results = [];
        let cumulativeCF = 0;
        let totalPv = 0;
        
        // Initial Investment (Year 0)
        const trueInitialInvestment = (recruitCost || 0) + (trainingCost || 0) + (licenseCost || 0) + (sharedSafetyValue || 0);
        
        // Mock Employee for ROI calculation
        // Start as 'Trainee' in Year 1 (2026), transition to 'Regular' in subsequent years
        const startYear = 2026;
        const mockEmployee: Employee = {
            id: 999999,
            name: "ROI Model",
            birthDate: new Date(startYear - 40, 3, 2), // 40 years old
            hireDate: new Date(startYear, 9, 1), // Oct 1st start (typical mid-career)
            baseSalary: recruitmentPlanA[startYear]?.driverSalary || 212000, // Initial salary
            currentBaseSalary: recruitmentPlanA[startYear]?.driverSalary || 212000,
            familyAllowance: 0, childEduAllowance: 0, instructorAllowance: 0, managerAllowance: 0, workAllowance: 0,
            employmentType: '正社員(養成)', // Start as Trainee
            unionType: '組合員',
            job: '運転士'
        };

        let currentMockEmp = { ...mockEmployee };

        for (let i = 0; i < 5; i++) {
            const year = startYear + i; // 2026, 2027, ...
            
            // 1. Get Plan Data for this year
            const rPlan = raisePlanA[year];
            const iRates = impactRatesA?.[year] || { socialInsuranceRate: 17.5, rippleRate: 0.42, rippleTargets: [] };
            
            // 2. Apply Base Up & Teisho (if applicable, typically applies from April 1st)
            // Logic similar to runSimulation loop
            let thisYearBU = 0;
            let thisYearTeisho = 0;
            
            // In Year 1 (2026), he is hired in Oct, so no raise in April 2026.
            // In Year 2+ (2027~), he gets raises.
            if (i > 0) {
                // Assume status transitions to Regular after 1 year.
                // Simplified: Year 1 = Trainee, Year 2+ = Regular
                const isRegular = i >= 1; 
                if (isRegular) {
                    // Apply Raise to Base Salary for calculation
                    const raiseAmount = (rPlan.detailed?.seishain_new || rPlan.averageAmount || 0) + (rPlan.yearlyRaise || 0);
                    currentMockEmp.currentBaseSalary = (currentMockEmp.currentBaseSalary || 0) + raiseAmount;
                    thisYearBU = rPlan.detailed?.seishain_new || rPlan.averageAmount || 0;
                    thisYearTeisho = rPlan.yearlyRaise || 0;
                    
                    // Update Status for calculation helper
                    currentMockEmp.employmentType = '正社員';
                }
            }

            // 3. Calculate Annual Cost
            // Use calculateFiscalYearDetails but strictly for this mock employee
            // We pass 0 for raise amounts here because we updated currentBaseSalary manually above for simplicity,
            // OR we can pass them to let the function handle bonus diffs.
            // Let's pass 0 and rely on currentBaseSalary being the "post-raise" amount for the full year 
            // (Simulating full year cost at that rate).
            // NOTE: calculateFiscalYearDetails handles monthly progression.
            
            const detail = calculateFiscalYearDetails(
                currentMockEmp, year, configA, raisePlanA, [], 
                thisYearBU, thisYearTeisho, iRates
            );

            // 4. Financial Metrics
            const revenue = simParams.unitPrice;
            const expense = detail.total; // Total Company Cost (Inc. Social Insurance)
            
            const operatingProfit = revenue - expense;
            const t = simParams.taxRate / 100;
            const taxAmount = operatingProfit * t;
            const cashFlow = operatingProfit - taxAmount;
            
            // Discounting
            const pv = cashFlow / Math.pow(1 + simParams.discountRate / 100, i + 1);
            totalPv += pv;
            cumulativeCF += cashFlow;

            results.push({
                year: i + 1, // 1st Year, 2nd Year...
                calendarYear: year,
                revenue,
                expense,
                operatingProfit,
                taxAmount,
                cashFlow,
                pv,
                cumulativeNetCF: totalPv - trueInitialInvestment,
                status: i === 0 ? '養成' : '正社員'
            });
        }
        
        const finalNPV = totalPv - trueInitialInvestment;
        
        const totalCashFlow = results.reduce((acc, r) => acc + r.cashFlow, 0);
        const roiSimple = trueInitialInvestment > 0 
            ? ((totalCashFlow - trueInitialInvestment) / trueInitialInvestment) * 100 
            : 0;

        let paybackYearStr = "回収不能";
        let runningCF = -trueInitialInvestment;
        for(let i=0; i<results.length; i++) {
            runningCF += results[i].cashFlow;
            if (runningCF >= 0) {
                const prevCF = runningCF - results[i].cashFlow;
                const fraction = results[i].cashFlow > 0 ? Math.abs(prevCF) / results[i].cashFlow : 1;
                paybackYearStr = (results[i].year - 1 + fraction).toFixed(1) + "年";
                break;
            }
        }

        return {
            yearlyData: results,
            npv: finalNPV,
            roiSimple,
            initialInvestment: trueInitialInvestment,
            paybackYear: paybackYearStr
        };
    }, [simParams, recruitCost, trainingCost, licenseCost, sharedSafetyValue, configA, raisePlanA, recruitmentPlanA, impactRatesA]);

    if (!accepted) {
        return (
            <div className="flex flex-col items-center justify-center h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="mb-6 p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <TrendingUpIcon style={{width: 64, height: 64, color: '#9333ea'}} />
                </div>
                <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-4">
                    ROI分析 (投資対効果) 機能
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-lg mb-8 leading-relaxed">
                    本機能は現在開発中（Beta版/Launch 2対応）です。<br/>
                    1名あたりの採用・教育投資に対する、5年間のリターン（NPV）をシミュレーションします。<br/>
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

    if (!dynamicSimulationData) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[85vh] flex flex-col transition-colors animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b dark:border-gray-700 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg text-white shadow-lg bg-gradient-to-br from-indigo-500 to-blue-700">
                        <ChartIcon />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">ダッシュボード3: 投資対効果分析 (1名あたり)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            採用・教育への初期投資が、5年間の業務を通じてどれだけのリターン（NPV）を生むかを判定します。
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Parameters */}
                <div className="lg:col-span-1 space-y-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[800px]">
                    
                    {/* 1. Revenue */}
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-3 flex items-center gap-2">
                            <BanknotesIcon /> 営業利益の計算 (R - E)
                        </h3>
                        <NumberInputControl 
                            label="1人あたり年間売上 (R)"
                            value={simParams.unitPrice}
                            onChange={v => setSimParams({...simParams, unitPrice: v})}
                            min={5000000} max={20000000} unit="円"
                            color="blue"
                            description="受託単価などの年間売上高。"
                        />
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-800">
                            <span className="font-bold text-orange-700 dark:text-orange-300">自動計算ロジック:</span><br/>
                            人件費(E)は「A案」の採用・昇給計画に基づき、1年目(養成)〜5年目(正社員)の推移を自動算出しています。
                        </div>
                    </div>

                    {/* 2. Tax & Discount */}
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-3 flex items-center gap-2">
                            <ShieldCheckIcon /> タックスシールド & WACC
                        </h3>
                        <StepperControl 
                            label="実効税率 (t)"
                            value={simParams.taxRate}
                            onChange={v => setSimParams({...simParams, taxRate: v})}
                            min={0} max={50} step={1.0} unit="%"
                            color="purple"
                            description="法人税等の実効税率。"
                        />
                         <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-100 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300 mb-3 leading-relaxed">
                            <strong>税引後CF = 営業利益 × (1 - t)</strong><br/>
                            人的資本投資のため減価償却(D)は0とし、営業利益から税金を引いた額をキャッシュフローとします。
                        </div>

                        <StepperControl 
                            label="割引率 (WACC)"
                            value={simParams.discountRate}
                            onChange={v => setSimParams({...simParams, discountRate: v})}
                            min={0} max={15} step={0.1} unit="%"
                            color="gray"
                            description="加重平均資本コスト。将来価値を現在価値に割り引くために使用。"
                        />
                    </div>

                    {/* 3. Initial Investment (Shared) */}
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-3 flex items-center gap-2">
                            <TrendingUpIcon /> 初期投資 (I)
                        </h3>
                        <div className="space-y-2 text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between">
                                <span>採用コスト:</span>
                                <span className="font-mono">{(recruitCost || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>教育コスト:</span>
                                <span className="font-mono">{(trainingCost || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>免許取得費:</span>
                                <span className="font-mono">{(licenseCost || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>安全価値(リスク):</span>
                                <span className="font-mono">{(sharedSafetyValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold text-base">
                                <span>初期投資計:</span>
                                <span className="text-red-600 dark:text-red-400">{dynamicSimulationData.initialInvestment.toLocaleString()} 円</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Charts & Results */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white p-5 rounded-xl shadow-md col-span-2">
                            <div className="text-xs font-bold opacity-70 uppercase mb-1">Net Present Value (NPV / 5年)</div>
                            <div className="flex items-end gap-4">
                                <div className="text-4xl font-black tracking-tight">
                                    {(dynamicSimulationData.npv / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-lg">万円</span>
                                </div>
                                <div className="text-sm font-medium opacity-90 mb-2">
                                    {dynamicSimulationData.npv > 0 
                                        ? "✅ 投資価値あり (GO!)" 
                                        : "⚠️ 回収困難 (STOP)"}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm flex flex-col justify-center">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">回収期間</span>
                                <span className="text-xl font-black text-gray-800 dark:text-gray-200">{dynamicSimulationData.paybackYear}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">単純ROI</span>
                                <span className={`text-xl font-black ${dynamicSimulationData.roiSimple > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{dynamicSimulationData.roiSimple.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-inner min-h-[400px]">
                        <h4 className="text-center font-bold text-gray-700 dark:text-gray-200 mb-4">累積NPV推移 (千円単位)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart 
                                data={[
                                    {year: 0, cumulativeNetCF: -dynamicSimulationData.initialInvestment}, 
                                    ...dynamicSimulationData.yearlyData
                                ]} 
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                <XAxis dataKey="year" label={{ value: '経過年数', position: 'insideBottomRight', offset: -5 }} tick={{fill: '#9ca3af'}} />
                                <YAxis 
                                    tickFormatter={(v) => `${Math.round(v/1000).toLocaleString()}`} 
                                    label={{ value: '累積NPV(千円)', angle: -90, position: 'insideLeft', offset: 10 }} 
                                    tick={{fill: '#9ca3af'}} 
                                />
                                <Tooltip 
                                    formatter={(val: number) => `${val.toLocaleString()}円`} 
                                    labelFormatter={(l) => l === 0 ? "初期投資" : `${l}年目`}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#e5e7eb' }}
                                />
                                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />
                                <Line 
                                    type="monotone" 
                                    dataKey="cumulativeNetCF" 
                                    name="累積NPV (Net)" 
                                    stroke="#55a868" 
                                    strokeWidth={3} 
                                    dot={{r:5, fill: "#55a868"}} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* NEW: Yearly Table */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm overflow-x-auto">
                        <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-3 text-sm flex items-center gap-2">
                            <CalculatorIcon style={{width: 16, height: 16}} /> 年度別収支詳細 (単位: 円)
                        </h4>
                        <table className="w-full text-xs text-right border-collapse whitespace-nowrap">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-2 border dark:border-gray-600 text-center">経過年数</th>
                                    <th className="p-2 border dark:border-gray-600 text-center">ステータス</th>
                                    <th className="p-2 border dark:border-gray-600">売上 (R)</th>
                                    <th className="p-2 border dark:border-gray-600 text-orange-700 dark:text-orange-300 font-bold">人件費 (E)</th>
                                    <th className="p-2 border dark:border-gray-600">営業利益</th>
                                    <th className="p-2 border dark:border-gray-600">税額</th>
                                    <th className="p-2 border dark:border-gray-600 font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">税引後CF</th>
                                    <th className="p-2 border dark:border-gray-600 text-gray-500">PV (現在価値)</th>
                                    <th className="p-2 border dark:border-gray-600 font-bold bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">累積NPV</th>
                                </tr>
                            </thead>
                            <tbody className="dark:text-gray-300">
                                {/* Initial Investment Row */}
                                <tr className="border-b dark:border-gray-700">
                                    <td className="p-2 border dark:border-gray-600 text-center text-gray-500">初期 (0)</td>
                                    <td className="p-2 border dark:border-gray-600 text-center text-gray-500">-</td>
                                    <td className="p-2 border dark:border-gray-600 text-gray-400">-</td>
                                    <td className="p-2 border dark:border-gray-600 text-gray-400">-</td>
                                    <td className="p-2 border dark:border-gray-600 text-gray-400">-</td>
                                    <td className="p-2 border dark:border-gray-600 text-gray-400">-</td>
                                    <td className="p-2 border dark:border-gray-600 font-bold text-red-600">-{dynamicSimulationData.initialInvestment.toLocaleString()}</td>
                                    <td className="p-2 border dark:border-gray-600 text-gray-500">-{dynamicSimulationData.initialInvestment.toLocaleString()}</td>
                                    <td className="p-2 border dark:border-gray-600 font-bold text-red-600">-{dynamicSimulationData.initialInvestment.toLocaleString()}</td>
                                </tr>
                                {dynamicSimulationData.yearlyData.map((d) => (
                                    <tr key={d.year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b dark:border-gray-700">
                                        <td className="p-2 border dark:border-gray-600 text-center font-bold">{d.year}年目 ({d.calendarYear})</td>
                                        <td className="p-2 border dark:border-gray-600 text-center text-xs">{d.status}</td>
                                        <td className="p-2 border dark:border-gray-600">{d.revenue.toLocaleString()}</td>
                                        <td className="p-2 border dark:border-gray-600 text-orange-700 dark:text-orange-300">{d.expense.toLocaleString()}</td>
                                        <td className="p-2 border dark:border-gray-600 font-bold">{d.operatingProfit.toLocaleString()}</td>
                                        <td className="p-2 border dark:border-gray-600 text-red-500">-{Math.round(d.taxAmount).toLocaleString()}</td>
                                        <td className="p-2 border dark:border-gray-600 font-bold bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300">{Math.round(d.cashFlow).toLocaleString()}</td>
                                        <td className="p-2 border dark:border-gray-600 text-gray-500 dark:text-gray-400">{Math.round(d.pv).toLocaleString()}</td>
                                        <td className={`p-2 border dark:border-gray-600 font-black ${d.cumulativeNetCF > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {Math.round(d.cumulativeNetCF).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Detailed Analysis Comment */}
                    <div className={`p-4 rounded-lg border-l-4 text-sm leading-relaxed ${dynamicSimulationData.npv > 0 ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <DatabaseIcon /> 財務分析コメント (WACC: {simParams.discountRate}%)
                        </h4>
                        {dynamicSimulationData.npv > 0 ? (
                            <p>
                                <strong>投資判断: GO</strong><br/>
                                5年間の税引後キャッシュフローの現在価値合計が、初期投資額（採用・教育・免許・安全コスト）を上回っています。
                                資本コスト（WACC 4.0%）を考慮しても、企業価値を向上させる投資と言えます。<br/>
                                ※タックスシールド効果（法人税率35%考慮）により、実質的なキャッシュアウトが軽減されています。
                            </p>
                        ) : (
                            <p>
                                <strong>投資判断: STOP (要検討)</strong><br/>
                                5年間では初期投資を回収できず、NPVがマイナスとなります。
                                「受託単価の引き上げ」または「7年以上の長期雇用」を前提条件とする必要があります。
                                資本コスト（WACC 4.0%）を上回るリターンを生み出せていません。
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};