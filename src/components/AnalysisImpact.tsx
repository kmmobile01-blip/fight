
import React, { useMemo, useState } from 'react';
import { SimulationResult, Employee, SimulationConfig, RecruitmentPlanYear, RaisePlanYear, CustomAllowance, ImpactRateYear } from '../types';
import { runSimulation } from '../utils/simulationLogic';
import { TableToolbar } from './TableToolbar';

export const BaseUpImpactView: React.FC<{ resultA: SimulationResult; resultB: SimulationResult }> = ({ resultA }) => {
    const exportData = resultA.summary.map(r => ({
        "年度": r.year,
        "平均ベア": r.baseUpImpact?.perCapita || 0,
        "ベア総額": r.baseUpImpact?.total || 0,
        "内訳(基本給)": Object.values(r.baseUpImpact?.breakdown || {}).reduce((a:any,b:any)=>a+(b.base||0),0),
        "内訳(賞与連動)": Object.values(r.baseUpImpact?.breakdown || {}).reduce((a:any,b:any)=>a+(b.bonus||0),0),
        "内訳(変動手当)": Object.values(r.baseUpImpact?.breakdown || {}).reduce((a:any,b:any)=>a+(b.variable||0),0)
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">ベア影響額分析 (パターンA)</h3>
            <TableToolbar title="" data={exportData} filename="baseup_impact" />
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-center text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2">年度</th>
                            <th className="border dark:border-gray-600 p-2">一人平均ベア</th>
                            <th className="border dark:border-gray-600 p-2">ベア総額 (年額)</th>
                            <th className="border dark:border-gray-600 p-2">内訳: 基本給</th>
                            <th className="border dark:border-gray-600 p-2">内訳: 賞与連動</th>
                            <th className="border dark:border-gray-600 p-2">内訳: 変動手当</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resultA.summary.map(r => (
                            <tr key={r.year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b dark:border-gray-700">
                                <td className="border dark:border-gray-600 p-2 text-center font-bold dark:text-gray-200">{r.year}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-300">{(r.baseUpImpact?.perCapita || 0).toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 font-bold dark:text-gray-200">{(r.baseUpImpact?.total || 0).toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{(Object.values(r.baseUpImpact?.breakdown || {}).reduce((a:any,b:any)=>a+(b.base||0),0)).toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{(Object.values(r.baseUpImpact?.breakdown || {}).reduce((a:any,b:any)=>a+(b.bonus||0),0)).toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{(Object.values(r.baseUpImpact?.breakdown || {}).reduce((a:any,b:any)=>a+(b.variable||0),0)).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TermEndImpactView: React.FC<{ resultA: SimulationResult; impactRates: Record<number, ImpactRateYear> }> = ({ resultA, impactRates }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">期末一時金 影響額 (パターンA)</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-center text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2">年度</th>
                            <th className="border dark:border-gray-600 p-2">一時金総額 (社保込)</th>
                            <th className="border dark:border-gray-600 p-2">本体支給額</th>
                            <th className="border dark:border-gray-600 p-2">法定福利費</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resultA.summary.map(r => {
                            const socRate = (impactRates[r.year]?.socialInsuranceRate || 17.5) / 100;
                            const lumpSum = r.breakdownSum?.lump || 0;
                            const socialInsurance = Math.floor(lumpSum * socRate);
                            const total = lumpSum + socialInsurance;
                            return (
                                <tr key={r.year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b dark:border-gray-700">
                                    <td className="border dark:border-gray-600 p-2 text-center font-bold dark:text-gray-200">{r.year}</td>
                                    <td className="border dark:border-gray-600 p-2 font-bold dark:text-gray-200">{total.toLocaleString()}円</td>
                                    <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{lumpSum.toLocaleString()}円</td>
                                    <td className="border dark:border-gray-600 p-2 dark:text-gray-400">{socialInsurance.toLocaleString()}円</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">※ ここでの社保は概算です。年度ごとの設定が適用されます。</p>
            </div>
        </div>
    );
};

export const StartingSalaryView: React.FC<{ 
    currentResult: SimulationResult; 
    resultC: SimulationResult; 
    employees: Employee[];
    config: SimulationConfig;
    recruitmentPlan: Record<number, RecruitmentPlanYear>;
    raisePlan: Record<number, RaisePlanYear>;
    customAllowances: CustomAllowance[],
    impactRates: Record<number, ImpactRateYear>;
}> = ({ currentResult, resultC, employees, config, recruitmentPlan, raisePlan, customAllowances, impactRates }) => {
    
    // 1. Baseline Calculation (Current Base 212k Fixed)
    const baselineResult = useMemo(() => {
        const baselineRecruitment = { ...recruitmentPlan };
        Object.keys(baselineRecruitment).forEach(key => {
            const y = parseInt(key);
            baselineRecruitment[y] = { 
                ...baselineRecruitment[y], 
                newGradSalary: 212000, 
                driverSalary: 212000 
            };
        });
        return runSimulation(employees, config, baselineRecruitment, raisePlan, customAllowances, impactRates);
    }, [employees, config, recruitmentPlan, raisePlan, customAllowances, impactRates]);

    // 2. Data Processing for Tables
    const data = useMemo(() => {
        const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
        const targetDate = new Date(2026, 3, 1);

        return years.map(year => {
            const rec = recruitmentPlan[year] || { newGrad: 0, driver: 0 };
            
            // Filter New Hires (Hired after 2026/4/1)
            // Note: Use individuals from currentResult (Plan A) as the source of truth for new hires
            const newHiresA = currentResult.individuals.filter(i => 
                i.year === year && new Date(i.hireDate) >= targetDate
            );
            
            // Find same individuals in Baseline Result
            // We match by ID since ID generation for new hires is deterministic in runSimulation
            const newHiresBase = baselineResult.individuals.filter(i => 
                i.year === year && new Date(i.hireDate) >= targetDate
            );

            // Helper to sum up costs
            const sumCosts = (inds: typeof newHiresA) => inds.reduce((acc, curr) => ({
                total: acc.total + curr.total,
                base: acc.base + curr.base,
                bonus: acc.bonus + (curr.bonus || 0) + (curr.lumpSum || 0),
                allowance: acc.allowance + (curr.allowance || 0), // allowance in individual result usually sums up fixed + variable
                social: acc.social + curr.socialInsurance
            }), { total: 0, base: 0, bonus: 0, allowance: 0, social: 0 });

            const costA = sumCosts(newHiresA);
            const costBase = sumCosts(newHiresBase);

            return {
                year,
                counts: { 
                    newGrad: rec.newGrad || 0, 
                    driver: rec.driver || 0, 
                    total: (rec.newGrad || 0) + (rec.driver || 0) 
                },
                costA,
                diff: {
                    total: costA.total - costBase.total,
                    base: costA.base - costBase.base,
                    bonus: costA.bonus - costBase.bonus,
                    allowance: costA.allowance - costBase.allowance,
                    social: costA.social - costBase.social
                }
            };
        });
    }, [currentResult, baselineResult, recruitmentPlan]);

    // Export Data (Combined for simplicity, mainly showing Diff)
    const exportData = data.map(d => ({
        "年度": d.year,
        "採用数(計)": d.counts.total,
        "A案コスト(計)": d.costA.total,
        "増加額(計)": d.diff.total,
        "増加額(基本給)": d.diff.base,
        "増加額(賞与)": d.diff.bonus,
        "増加額(社保)": d.diff.social
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">初任給引き上げによる影響額シミュレーション (単位: 円)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        2026年4月1日以降に入社する従業員（新卒・養成）を対象としたコスト分析。<br/>
                        増加額は、現行初任給（212,000円）で採用した場合（ベースライン）との差額です。
                    </p>
                </div>
                <TableToolbar title="初任給影響額" data={exportData} filename="starting_salary_impact" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                
                {/* 1. Hiring Plan Table */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm border-b dark:border-gray-700 pb-1">① 採用人数計画</h4>
                    <table className="w-full text-sm text-right border-collapse whitespace-nowrap">
                        <thead className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="border dark:border-gray-600 p-2 text-center w-24">年度</th>
                                <th className="border dark:border-gray-600 p-2">新卒採用 (名)</th>
                                <th className="border dark:border-gray-600 p-2">養成採用 (名)</th>
                                <th className="border dark:border-gray-600 p-2 font-bold">合計 (名)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.year} className="hover:bg-white dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-700">
                                    <td className="p-2 text-center font-bold dark:text-gray-300">{d.year}</td>
                                    <td className="p-2 dark:text-gray-400">{d.counts.newGrad.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">{d.counts.driver.toLocaleString()}</td>
                                    <td className="p-2 font-bold dark:text-gray-200">{d.counts.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 2. Total Cost Table (Plan A New Hires) */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2 text-sm border-b border-blue-200 dark:border-blue-800 pb-1">② 対象者 人件費総額 (Plan A) - 単位: 円</h4>
                    <table className="w-full text-sm text-right border-collapse whitespace-nowrap">
                        <thead className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100">
                            <tr>
                                <th className="border border-blue-200 dark:border-blue-800 p-2 text-center w-24">年度</th>
                                <th className="border border-blue-200 dark:border-blue-800 p-2 font-black">人件費総額</th>
                                <th className="border border-blue-200 dark:border-blue-800 p-2">基本給</th>
                                <th className="border border-blue-200 dark:border-blue-800 p-2">賞与等</th>
                                <th className="border border-blue-200 dark:border-blue-800 p-2">諸手当</th>
                                <th className="border border-blue-200 dark:border-blue-800 p-2">社保</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.year} className="hover:bg-white dark:hover:bg-gray-800 transition-colors border-b border-blue-100 dark:border-blue-900">
                                    <td className="p-2 text-center font-bold dark:text-gray-300">{d.year}</td>
                                    <td className="p-2 font-bold text-blue-700 dark:text-blue-300">{d.costA.total.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">{d.costA.base.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">{d.costA.bonus.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">{d.costA.allowance.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">{d.costA.social.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 3. Cost Increase Table (Diff vs Baseline 212k) */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 text-sm border-b border-yellow-200 dark:border-yellow-800 pb-1">③ コスト増加額 (対 現行21.2万比) - 単位: 円</h4>
                    <table className="w-full text-sm text-right border-collapse whitespace-nowrap">
                        <thead className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100">
                            <tr>
                                <th className="border border-yellow-200 dark:border-yellow-800 p-2 text-center w-24">年度</th>
                                <th className="border border-yellow-200 dark:border-yellow-800 p-2 font-black">増加額 合計</th>
                                <th className="border border-yellow-200 dark:border-yellow-800 p-2">基本給差</th>
                                <th className="border border-yellow-200 dark:border-yellow-800 p-2">賞与差</th>
                                <th className="border border-yellow-200 dark:border-yellow-800 p-2">手当差</th>
                                <th className="border border-yellow-200 dark:border-yellow-800 p-2">社保差</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.year} className="hover:bg-white dark:hover:bg-gray-800 transition-colors border-b border-yellow-100 dark:border-yellow-900">
                                    <td className="p-2 text-center font-bold dark:text-gray-300">{d.year}</td>
                                    <td className="p-2 font-bold text-red-600 dark:text-red-400">+{d.diff.total.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">+{d.diff.base.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">+{d.diff.bonus.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">+{d.diff.allowance.toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-400">+{d.diff.social.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};
